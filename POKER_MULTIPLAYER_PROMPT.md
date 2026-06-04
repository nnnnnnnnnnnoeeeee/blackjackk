# Agent Build Spec — Multiplayer Poker (No-Limit Texas Hold'em)

> **Audience: an autonomous coding agent (Claude Code) working in THIS repo.**
> This is an executable spec, not a discussion. Implement it milestone by milestone.
> Optimize for correctness and for *not breaking the existing blackjack app*.

---

## A. Operating rules (read first, obey throughout)

1. **Work in milestones (§8). After every milestone run all four gates and they MUST pass:**
   `npm run lint` (0 errors) · `npx tsc --noEmit` (exit 0) · `npm run test` (all green) · `npm run build` (no new warnings). Do not start the next milestone until the current one is green.
2. **Never regress blackjack.** The 109 existing tests stay green; do not edit blackjack engine/edge/UI except the two explicitly-allowed shared touch-points: `tables.game_type` (new column, default keeps blackjack working) and adding a Poker entry to `ModeSelection`/Lobby.
3. **All user-facing text goes through `useTranslation()`** from `src/ui/blackjack/i18n`. Add a `poker` section to `translations.ts` for **both `en` and `fr`**. Do **not** use `getLabel()`/`labels.ts` (legacy, English-only).
4. **Server is authoritative.** The browser never shuffles, never deals, never sees the deck or opponents' unrevealed cards. All randomness + mutation happen in Deno edge functions using the service-role key. Clients only call functions and read state via realtime/RLS.
5. **TypeScript: no `any`.** Use precise types or `unknown` + narrowing (the repo's lint forbids `any`). `catch (error) { error instanceof Error ? ... }`.
6. **Mirror existing patterns** rather than inventing (file map in §C). When unsure, copy the closest blackjack file's structure.
7. **Idempotent, reversible migrations**; reuse the RLS patterns from `001`/`005`/`010` (the `table_players` self-referential policy is a known recursion footgun).
8. Prefer **small pure functions with unit tests** for all rules/math. UI and network come last.

---

## B. Scope (decisions are final — implement exactly)

- **No-Limit Texas Hold'em**, play-money. Each player's stack = `table_players.bankroll`.
- 2–8 players; heads-up supported (standard heads-up blind rule: button posts small blind, acts first preflop, last postflop).
- Config (stored in `tables.config` JSONB): `{ smallBlind: 5, bigBlind: 10, actionTimerSec: 20, maxPlayers: 8 }`.
- Actions: `fold | check | call | bet | raise | allin`. Enforce No-Limit min-raise and **side pots**.
- Streets: `preflop → flop(3) → turn(1) → river(1) → showdown`.
- Showdown: best 5-of-7; **split pots** on ties; odd chip to first seat left of button.
- Per-turn timer (default 20s) → server auto-acts `check` if legal else `fold`.
- No real money. No new third-party deps unless unavoidable (justify in the milestone note).

---

## C. Reuse map (study these before writing each layer)

| Layer | Copy the pattern from | Build into |
| --- | --- | --- |
| Migration / RLS / realtime | `supabase/migrations/001,002,005,008,009,010,012` | `supabase/migrations/014_poker.sql` |
| Authoritative state table | `table_state` + "updates only via Edge Functions" | reuse `table_state` (public state) + new `poker_hole_cards` |
| Edge function skeleton | `supabase/functions/start_round/index.ts`, `player_action/index.ts` | `supabase/functions/poker_*` |
| Shared Deno engine | `supabase/functions/_shared/blackjack-engine.ts` | `supabase/functions/_shared/poker-engine.ts` (**authoritative**) |
| Pure client engine + tests | `src/lib/blackjack/{types,deck,hand,rules,game}.ts`, `src/test/*.test.ts` | `src/lib/poker/*`, `src/test/poker-*.test.ts` |
| Lobby (public list + room code, public/private) | `src/pages/Lobby.tsx` | extend with `game_type` filter/tab |
| Realtime table page | `src/pages/MultiplayerTable.tsx` | `src/pages/PokerTable.tsx` |
| UI primitives (reuse as-is) | `TableShell`, `OpponentsZone`, `TimerBadge`, `ChipStack`, `PlayingCard`, `TableChat`, `QuickChatBar`, `EmoteOverlay` | `src/ui/poker/*` |
| Routing (lazy + manualChunks) | `src/App.tsx`, `vite.config.ts` | add `/poker/table/:id` (+ lobby route) |
| Settlement FX | `src/ui/blackjack/hooks/useSettlementEffects.ts`, `src/lib/haptics.ts` | reuse for pot-award |

---

## D. THE critical constraint — hole-card privacy (implement exactly)

Blackjack state is fully public (every seated player reads `table_state.state_json` via RLS). **Poker must hide each player's 2 hole cards until showdown.** Therefore:

1. `table_state.state_json` = **PUBLIC poker state only** (see `PokerPublicState`, §E). It contains community cards, pots, per-seat bet/stack/status, button, blinds, whose turn — and, **only at showdown**, the revealed hole cards of players who reached showdown. It must **never** contain another player's live (unrevealed) hole cards.
2. Hole cards live in a private table, owner-readable only:
```sql
create table poker_hole_cards (
  table_id uuid not null references tables(id) on delete cascade,
  hand_no  integer not null,
  user_id  uuid not null references auth.users(id) on delete cascade,
  seat     integer not null,
  cards    jsonb  not null,        -- exactly 2 cards
  created_at timestamptz default now(),
  primary key (table_id, hand_no, user_id)
);
alter table poker_hole_cards enable row level security;
create policy "owner reads own hole cards"
  on poker_hole_cards for select using (auth.uid() = user_id);
-- no client insert/update/delete policy → only the service role (edge fns) writes.
create index idx_poker_hole_cards_hand on poker_hole_cards(table_id, hand_no);
```
3. Client merges `PokerPublicState` (realtime from `table_state`) + its own `cards` from `poker_hole_cards where user_id = me and hand_no = state.handNo`. Opponents render face-down until revealed in public state.
4. **Acceptance check (must verify):** authenticated as player A, a query/select on `poker_hole_cards` returns only A's row; `table_state.state_json` never includes B's unrevealed cards on the wire.

---

## E. Pure engine — `src/lib/poker/` (Milestone 1)

Pure TS, immutable, no React, no I/O. Exact contracts:

```ts
// types.ts  (reuse Rank/Suit from blackjack if compatible; else define here)
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'10'|'J'|'Q'|'K'|'A';
export interface Card { rank: Rank; suit: Suit }

export type Street = 'preflop'|'flop'|'turn'|'river'|'showdown';
export type SeatStatus = 'active'|'folded'|'allin'|'out'|'empty';
export type PokerAction = 'fold'|'check'|'call'|'bet'|'raise'|'allin';

export interface SeatState {
  seat: number; userId: string | null; status: SeatStatus;
  stack: number;          // remaining chips
  committedThisStreet: number;  // chips put in on the current street
  committedTotal: number;       // chips put in this hand (for side pots)
  holeCards?: Card[];     // present only for the local player or at showdown
}
export interface Pot { amount: number; eligibleSeats: number[] }

export interface PokerConfig { smallBlind: number; bigBlind: number; actionTimerSec: number; maxPlayers: number }

export interface PokerPublicState {
  phase: 'waiting'|Street|'payout';
  handNo: number;
  buttonSeat: number;
  blinds: { sb: number; bb: number };
  communityCards: Card[];     // 0/3/4/5
  seats: SeatState[];         // holeCards omitted unless revealed
  pots: Pot[];                // main + side pots
  betToCall: number;          // current highest committedThisStreet
  minRaise: number;           // min legal raise increment
  currentTurnSeat: number | null;
  lastAggressorSeat: number | null;
  results?: { seat: number; amountWon: number; handLabel: string }[]; // at payout
  deckRemaining?: number;     // server-only; NEVER include the deck array in public state
}

// handEval.ts
export interface HandRank { category: number; tiebreak: number[]; label: string }
export function evaluate7(cards: Card[]): HandRank;   // best 5 of 7
export function compareHands(a: HandRank, b: HandRank): number; // >0 a wins, 0 tie

// deck.ts
export function shuffledDeck(seed?: number): Card[];  // 52 cards; seedable for tests
export function draw(deck: Card[], n: number): [Card[], Card[]]; // [drawn, rest]

// betting.ts
export function legalActions(state: PokerPublicState, seat: number): PokerAction[];
export function callAmount(state: PokerPublicState, seat: number): number;
export function minRaiseTo(state: PokerPublicState, seat: number): number;
export function isBettingRoundClosed(state: PokerPublicState): boolean;

// pots.ts
export function buildPots(seats: SeatState[]): Pot[]; // from committedTotal, incl. side pots
export function distribute(pots: Pot[], showdownHands: Record<number, HandRank>, buttonSeat: number)
  : Record<number, number>; // seat -> chips won (handles split + odd-chip rule)

// game.ts (immutable transitions; throw on illegal input)
export function startHand(state: PokerPublicState, cfg: PokerConfig): { state: PokerPublicState; deck: Card[]; hole: Record<number, Card[]> };
export function applyAction(state: PokerPublicState, seat: number, action: PokerAction, amount: number | undefined, cfg: PokerConfig): PokerPublicState;
export function advanceStreet(state: PokerPublicState, deck: Card[]): { state: PokerPublicState; deck: Card[] };
export function runShowdown(state: PokerPublicState, hole: Record<number, Card[]>): PokerPublicState; // sets results, reveals
```

> `handEval` is the highest-risk file — write it first, test it hardest (§G).
> **Invariant to assert in every game test:** total chips (Σ stacks + Σ pots) is conserved within a hand.

---

## F. Server — migration + edge functions (Milestones 2–3)

`014_poker.sql`: `ALTER TABLE tables ADD COLUMN game_type text NOT NULL DEFAULT 'blackjack' CHECK (game_type IN ('blackjack','poker'));` + `poker_hole_cards` (§D) + indexes. Don't loosen existing RLS.

`supabase/functions/_shared/poker-engine.ts` = authoritative Deno copy of §E logic (keep equivalent to `src/lib/poker`; cross-reference in comments, like blackjack does).

Edge functions (copy `start_round` boilerplate: CORS preflight, service-role client w/ forwarded `Authorization`, `auth.getUser()`, load `tables, table_players(*)`, validate, mutate, write, return). **I/O contracts:**

| Function | Request | Server does | Response |
| --- | --- | --- | --- |
| `poker_create_table` | `{ name, isPublic, config }` | insert `tables(game_type='poker')` + room code; seat creator | `{ tableId, roomCode }` |
| `poker_join_table` | `{ tableId }` or `{ roomCode }` | assign free seat (respect `UNIQUE(table_id,seat)`), default stack | `{ seat }` |
| `poker_start_hand` | `{ tableId }` | creator/auto when ≥2; rotate button, post blinds, shuffle, deal → write `poker_hole_cards` rows + public `table_state`, `phase='preflop'`, set first to act, `handNo++` | `{ ok }` |
| `poker_player_action` | `{ tableId, action, amount? }` | assert caller's turn + `legalActions`; apply; on round close → `advanceStreet` (deal community) or showdown; persist | `{ ok }` |
| `poker_timeout` | `{ tableId }` | only if timer expired for `currentTurnSeat`: auto `check` else `fold` | `{ ok }` |

Server invariants (enforce + reject otherwise): turn ownership; legal action & amount; `stack >= 0`; pots conserve chips; **no opponent hole card ever returned to a client**. Insert an action row per move (extend `table_actions` CHECK or add `poker_actions`). Prefer **server-driven timing** (`poker_timeout` called by any client whose local timer hit 0; server re-validates expiry) so no single client is a point of failure.

---

## G. Tests (write alongside each engine file — Milestone 1 gate)

- `src/test/poker-handeval.test.ts` — every category; wheel A-2-3-4-5; straight-vs-flush; full-house kicker; board-plays-the-hand; exact ties; royal flush.
- `src/test/poker-betting.test.ts` — legal actions per situation; call/min-raise math; all-in; round-close detection (incl. BB option preflop).
- `src/test/poker-pots.test.ts` — single side pot, multiple all-ins/side pots, split pot, odd-chip rule, chip conservation.
- `src/test/poker-game.test.ts` — full hand flows: normal showdown; everyone folds to one; all-in preflop runs board to river; heads-up; 3-way with one all-in side pot.

---

## H. Frontend (Milestones 4–6)

- `src/App.tsx`: lazy routes `/poker/table/:id` (+ poker lobby route or unified lobby tab).
- `ModeSelection.tsx`: add a Poker card (mirror the Multiplayer card; i18n).
- Lobby: add `game_type` filter/tab + game choice on create (reuse room-code/public-private UX).
- `src/pages/PokerTable.tsx` (mirror `MultiplayerTable.tsx`): subscribe to `table_state`+`table_players` realtime; fetch own hole cards once per `handNo`; render oval table via `OpponentsZone`-style seats (avatar, stack, bet `ChipStack`, button/SB/BB markers, folded/all-in dimming, turn highlight + `TimerBadge`), community row (`PlayingCard`), center pot (+ side-pot breakdown), hero hole cards face-up / opponents face-down until reveal, winner/pot-award animation (reuse `useSettlementEffects` + confetti + `haptics`). Reuse `TableChat`/`QuickChatBar`/`EmoteOverlay` as-is.
- `src/ui/poker/components/PokerActionBar.tsx`: Fold / Check / Call (amount) / Bet-Raise with slider + quick sizes (½, ¾, pot, all-in), min-raise enforced client-side (server re-validates), keyboard shortcuts à la blackjack `ActionBar`. Respect `prefers-reduced-motion`.
- Put poker UI under `src/ui/poker/{layout,components,table}` mirroring `src/ui/blackjack/`; reuse `TableShell`.
- Add `poker` i18n keys (fr+en).

---

## I. Milestones (each = a green commit through all four gates)

1. **Engine** `src/lib/poker/*` + `src/test/poker-*.test.ts` (no net/UI). *Hardest logic first.*
2. **DB+privacy** `014_poker.sql` (`game_type`, `poker_hole_cards`+RLS); verify owner-only read.
3. **Edge functions** `_shared/poker-engine.ts` + `poker_*`; full hand via curl/manual.
4. **Lobby + table render** public state + own hole cards over realtime; seats/community/pot.
5. **Action bar / betting UX** full actions, slider sizes, timer, turn highlight.
6. **Showdown polish** reveal, winner FX, side-pot display, next-hand, i18n complete, a11y/reduced-motion.

---

## J. Definition of done

- 2+ browsers, private room code: full No-Limit hand end-to-end (blinds→preflop→flop→turn→river→showdown→payout), button rotates, next hand auto-starts.
- **Privacy proven:** a client can fetch only its own `poker_hole_cards`; `table_state` never carries opponents' unrevealed cards.
- Server rejects out-of-turn/illegal actions and bad amounts; stacks never negative; chips conserved (incl. side & split pots).
- Timer auto-acts on expiry; a disconnect doesn't freeze the table.
- Blackjack untouched; all prior tests pass.
- Four gates green: lint 0 errors · tsc 0 · tests all pass · build clean.

## K. Known pitfalls

- **Side pots** = top bug source → derive pots from `committedTotal` per seat; never special-case.
- **Chip conservation** is poker's "payout correctness" → assert it in every game test.
- **RLS recursion** on `table_players` (see fixes `005`/`010`) → reuse the proven policy shape; test policies before UI.
- Keep Deno `_shared/poker-engine.ts` authoritative and equivalent to `src/lib/poker`.
- Don't ship the **deck array** or opponents' hole cards in `table_state` — public state only.
</content>
