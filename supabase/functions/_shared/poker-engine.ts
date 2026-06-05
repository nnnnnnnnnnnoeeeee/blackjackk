// ============================================================================
// Shared Poker Engine (Deno / Edge Functions) — AUTHORITATIVE COPY
// ============================================================================
// Keep this equivalent to src/lib/poker/* (the client mirror). No-Limit Texas
// Hold'em. Pure logic, no I/O. Hole cards are returned separately by startHand
// and only merged into public state at showdown.

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'10'|'J'|'Q'|'K'|'A';
export interface Card { rank: Rank; suit: Suit }

export const RANK_VALUE: Record<Rank, number> = {
  '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,J:11,Q:12,K:13,A:14,
};

export type Street = 'preflop'|'flop'|'turn'|'river'|'showdown';
export type SeatStatus = 'active'|'folded'|'allin'|'out'|'empty';
export type PokerAction = 'fold'|'check'|'call'|'bet'|'raise'|'allin';

export interface SeatState {
  seat: number; userId: string | null; status: SeatStatus;
  stack: number; committedThisStreet: number; committedTotal: number;
  hasActedThisStreet: boolean; holeCards?: Card[];
}
export interface Pot { amount: number; eligibleSeats: number[] }
export interface PokerConfig { smallBlind: number; bigBlind: number; actionTimerSec: number; maxPlayers: number }
export const DEFAULT_POKER_CONFIG: PokerConfig = { smallBlind: 5, bigBlind: 10, actionTimerSec: 20, maxPlayers: 8 };
export interface ShowdownResult { seat: number; amountWon: number; handLabel: string }

export interface PokerPublicState {
  phase: 'waiting' | Street | 'payout';
  handNo: number; buttonSeat: number; blinds: { sb: number; bb: number };
  communityCards: Card[]; seats: SeatState[]; betToCall: number; minRaise: number;
  currentTurnSeat: number | null; lastAggressorSeat: number | null;
  results?: ShowdownResult[];
}

export const HAND_CATEGORY = {
  HIGH_CARD:0, ONE_PAIR:1, TWO_PAIR:2, THREE_OF_A_KIND:3, STRAIGHT:4,
  FLUSH:5, FULL_HOUSE:6, FOUR_OF_A_KIND:7, STRAIGHT_FLUSH:8,
} as const;
const HAND_CATEGORY_LABEL: Record<number, string> = {
  0:'High Card',1:'One Pair',2:'Two Pair',3:'Three of a Kind',4:'Straight',
  5:'Flush',6:'Full House',7:'Four of a Kind',8:'Straight Flush',
};
export interface HandRank { category: number; tiebreak: number[]; label: string }

// ---- deck ------------------------------------------------------------------
const SUITS: Suit[] = ['hearts','diamonds','clubs','spades'];
const RANKS: Rank[] = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

export function freshDeck(): Card[] {
  const d: Card[] = [];
  for (const suit of SUITS) for (const rank of RANKS) d.push({ rank, suit });
  return d;
}
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function shuffledDeck(seed?: number): Card[] {
  const deck = freshDeck();
  const rng = seed === undefined ? Math.random : mulberry32(seed);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
export function draw(deck: Card[], n: number): [Card[], Card[]] {
  if (n > deck.length) throw new Error(`Cannot draw ${n} from ${deck.length}`);
  return [deck.slice(0, n), deck.slice(n)];
}

// ---- hand evaluation -------------------------------------------------------
function evaluate5(cards: Card[]): HandRank {
  const values = cards.map((c) => RANK_VALUE[c.rank]).sort((a, b) => b - a);
  const suits = cards.map((c) => c.suit);
  const isFlush = suits.every((s) => s === suits[0]);
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const countsDesc = groups.map((g) => g[1]);
  const distinct = [...new Set(values)].sort((a, b) => b - a);
  let straightHigh = 0;
  if (distinct.length === 5) {
    if (distinct[0] - distinct[4] === 4) straightHigh = distinct[0];
    else if (distinct[0] === 14 && distinct[1] === 5 && distinct[2] === 4 && distinct[3] === 3 && distinct[4] === 2) straightHigh = 5;
  }
  const mk = (category: number, tiebreak: number[]): HandRank => ({ category, tiebreak, label: HAND_CATEGORY_LABEL[category] });
  if (isFlush && straightHigh > 0) return mk(8, [straightHigh]);
  if (countsDesc[0] === 4) return mk(7, [groups[0][0], groups[1][0]]);
  if (countsDesc[0] === 3 && countsDesc[1] === 2) return mk(6, [groups[0][0], groups[1][0]]);
  if (isFlush) return mk(5, values);
  if (straightHigh > 0) return mk(4, [straightHigh]);
  if (countsDesc[0] === 3) return mk(3, [groups[0][0], ...groups.slice(1).map((g) => g[0]).sort((a, b) => b - a)]);
  if (countsDesc[0] === 2 && countsDesc[1] === 2) {
    const hp = Math.max(groups[0][0], groups[1][0]); const lp = Math.min(groups[0][0], groups[1][0]);
    return mk(2, [hp, lp, groups[2][0]]);
  }
  if (countsDesc[0] === 2) return mk(1, [groups[0][0], ...groups.slice(1).map((g) => g[0]).sort((a, b) => b - a)]);
  return mk(0, values);
}
function combinations<T>(arr: T[], k: number): T[][] {
  const out: T[][] = []; const combo: T[] = [];
  const rec = (start: number) => {
    if (combo.length === k) { out.push([...combo]); return; }
    for (let i = start; i < arr.length; i++) { combo.push(arr[i]); rec(i + 1); combo.pop(); }
  };
  rec(0); return out;
}
export function compareHands(a: HandRank, b: HandRank): number {
  if (a.category !== b.category) return a.category - b.category;
  const len = Math.max(a.tiebreak.length, b.tiebreak.length);
  for (let i = 0; i < len; i++) { const av = a.tiebreak[i] ?? 0; const bv = b.tiebreak[i] ?? 0; if (av !== bv) return av - bv; }
  return 0;
}
export function evaluate7(cards: Card[]): HandRank {
  if (cards.length < 5 || cards.length > 7) throw new Error('evaluate7 needs 5-7 cards');
  if (cards.length === 5) return evaluate5(cards);
  let best: HandRank | null = null;
  for (const combo of combinations(cards, 5)) {
    const r = evaluate5(combo);
    if (best === null || compareHands(r, best) > 0) best = r;
  }
  return best as HandRank;
}

// ---- pots ------------------------------------------------------------------
function sameSeats(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y); const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
}
export function buildPots(seats: SeatState[]): Pot[] {
  const contributors = seats.filter((s) => s.committedTotal > 0)
    .map((s) => ({ seat: s.seat, amount: s.committedTotal, folded: s.status === 'folded' }));
  if (contributors.length === 0) return [];
  const levels = [...new Set(contributors.map((c) => c.amount))].sort((a, b) => a - b);
  const pots: Pot[] = []; let prev = 0;
  for (const level of levels) {
    const layer = level - prev;
    const inLayer = contributors.filter((c) => c.amount >= level);
    const amount = layer * inLayer.length;
    if (amount > 0) pots.push({ amount, eligibleSeats: inLayer.filter((c) => !c.folded).map((c) => c.seat) });
    prev = level;
  }
  const merged: Pot[] = [];
  for (const pot of pots) {
    const last = merged[merged.length - 1];
    if (last && sameSeats(last.eligibleSeats, pot.eligibleSeats)) last.amount += pot.amount;
    else merged.push({ ...pot, eligibleSeats: [...pot.eligibleSeats] });
  }
  return merged;
}
export function distribute(pots: Pot[], showdownHands: Record<number, HandRank>, buttonSeat: number): Record<number, number> {
  const won: Record<number, number> = {};
  const add = (seat: number, amt: number) => { won[seat] = (won[seat] ?? 0) + amt; };
  const orderKey = (seat: number) => (seat > buttonSeat ? seat - buttonSeat : seat - buttonSeat + 100);
  for (const pot of pots) {
    if (pot.eligibleSeats.length === 0) continue;
    if (pot.eligibleSeats.length === 1) { add(pot.eligibleSeats[0], pot.amount); continue; }
    let best: HandRank | null = null; let winners: number[] = [];
    for (const seat of pot.eligibleSeats) {
      const hand = showdownHands[seat]; if (!hand) continue;
      if (best === null) { best = hand; winners = [seat]; }
      else { const cmp = compareHands(hand, best); if (cmp > 0) { best = hand; winners = [seat]; } else if (cmp === 0) winners.push(seat); }
    }
    if (winners.length === 0) continue;
    winners.sort((a, b) => orderKey(a) - orderKey(b));
    const share = Math.floor(pot.amount / winners.length);
    let rem = pot.amount - share * winners.length;
    for (const seat of winners) { add(seat, share); if (rem > 0) { add(seat, 1); rem--; } }
  }
  return won;
}

// ---- betting ---------------------------------------------------------------
function seatOf(state: PokerPublicState, seat: number) { return state.seats.find((s) => s.seat === seat); }
export function callAmount(state: PokerPublicState, seat: number): number {
  const s = seatOf(state, seat); if (!s) return 0;
  return Math.max(0, Math.min(state.betToCall - s.committedThisStreet, s.stack));
}
export function minRaiseTo(state: PokerPublicState): number { return state.betToCall + state.minRaise; }
export function legalActions(state: PokerPublicState, seat: number): PokerAction[] {
  const s = seatOf(state, seat);
  if (!s || s.status !== 'active' || state.currentTurnSeat !== seat) return [];
  const toCall = state.betToCall - s.committedThisStreet;
  const actions: PokerAction[] = ['fold'];
  if (toCall <= 0) { actions.push('check'); if (s.stack > 0) { actions.push('bet'); actions.push('allin'); } }
  else if (s.stack > toCall) { actions.push('call'); actions.push('raise'); actions.push('allin'); }
  else if (s.stack > 0) actions.push('allin');
  return actions;
}
export function isBettingRoundClosed(state: PokerPublicState): boolean {
  const notFolded = state.seats.filter((s) => s.status === 'active' || s.status === 'allin');
  if (notFolded.length <= 1) return true;
  const active = state.seats.filter((s) => s.status === 'active');
  if (active.length === 0) return true;
  return active.every((s) => s.hasActedThisStreet && s.committedThisStreet === state.betToCall);
}
export function inHandCount(state: PokerPublicState): number {
  return state.seats.filter((s) => s.status === 'active' || s.status === 'allin').length;
}

// ---- game state machine ----------------------------------------------------
function clone(state: PokerPublicState): PokerPublicState {
  return {
    ...state, blinds: { ...state.blinds }, communityCards: [...state.communityCards],
    seats: state.seats.map((s) => ({ ...s, holeCards: s.holeCards ? [...s.holeCards] : undefined })),
    results: state.results ? state.results.map((r) => ({ ...r })) : undefined,
  };
}
function sortedSeats(state: PokerPublicState): SeatState[] { return [...state.seats].sort((a, b) => a.seat - b.seat); }
function nextSeatMatching(state: PokerPublicState, fromSeat: number, pred: (s: SeatState) => boolean): number | null {
  const sorted = sortedSeats(state); const n = sorted.length; if (n === 0) return null;
  let startIdx = sorted.findIndex((s) => s.seat === fromSeat); if (startIdx < 0) startIdx = -1;
  for (let i = 1; i <= n; i++) { const s = sorted[(startIdx + i + n) % n]; if (pred(s)) return s.seat; }
  return null;
}
function commit(seat: SeatState, amount: number): number {
  const real = Math.min(amount, seat.stack);
  seat.stack -= real; seat.committedThisStreet += real; seat.committedTotal += real;
  if (seat.stack === 0 && seat.status === 'active') seat.status = 'allin';
  return real;
}
export function createInitialState(players: Array<{ seat: number; userId: string | null; stack: number }>, cfg: PokerConfig): PokerPublicState {
  const seats: SeatState[] = players.map((p) => ({
    seat: p.seat, userId: p.userId, status: p.userId && p.stack > 0 ? 'active' : 'empty',
    stack: p.stack, committedThisStreet: 0, committedTotal: 0, hasActedThisStreet: false,
  }));
  return {
    phase: 'waiting', handNo: 0, buttonSeat: seats.length ? Math.min(...seats.map((s) => s.seat)) : 0,
    blinds: { sb: cfg.smallBlind, bb: cfg.bigBlind }, communityCards: [], seats,
    betToCall: 0, minRaise: cfg.bigBlind, currentTurnSeat: null, lastAggressorSeat: null,
  };
}
export function startHand(prev: PokerPublicState, cfg: PokerConfig, deckSeed?: number): { state: PokerPublicState; deck: Card[]; hole: Record<number, Card[]> } {
  const state = clone(prev);
  for (const s of state.seats) {
    if (s.userId && s.stack > 0) s.status = 'active';
    else if (s.userId) s.status = 'out';
    else s.status = 'empty';
    s.committedThisStreet = 0; s.committedTotal = 0; s.hasActedThisStreet = false; s.holeCards = undefined;
  }
  const active = state.seats.filter((s) => s.status === 'active');
  if (active.length < 2) throw new Error('Need at least 2 players with chips');
  const button = nextSeatMatching(state, prev.buttonSeat, (s) => s.status === 'active');
  state.buttonSeat = button ?? active[0].seat;
  const headsUp = active.length === 2;
  const sbSeat = headsUp ? state.buttonSeat : nextSeatMatching(state, state.buttonSeat, (s) => s.status === 'active')!;
  const bbSeat = nextSeatMatching(state, sbSeat, (s) => s.status === 'active')!;
  commit(state.seats.find((s) => s.seat === sbSeat)!, cfg.smallBlind);
  commit(state.seats.find((s) => s.seat === bbSeat)!, cfg.bigBlind);
  state.betToCall = Math.max(...state.seats.map((s) => s.committedThisStreet));
  state.minRaise = cfg.bigBlind; state.lastAggressorSeat = bbSeat;
  let deck = shuffledDeck(deckSeed);
  const hole: Record<number, Card[]> = {};
  const dealOrder: number[] = []; let cur = sbSeat;
  for (let i = 0; i < active.length; i++) { dealOrder.push(cur); cur = nextSeatMatching(state, cur, (s) => s.status === 'active')!; }
  for (const seat of dealOrder) { const [cards, rest] = draw(deck, 2); hole[seat] = cards; deck = rest; }
  state.currentTurnSeat = headsUp ? state.buttonSeat : nextSeatMatching(state, bbSeat, (s) => s.status === 'active');
  state.phase = 'preflop'; state.communityCards = []; state.handNo = prev.handNo + 1; state.results = undefined;
  return { state, deck, hole };
}
export function applyAction(prev: PokerPublicState, seat: number, action: PokerAction, amount: number | undefined, cfg: PokerConfig): PokerPublicState {
  if (!legalActions(prev, seat).includes(action)) throw new Error(`Illegal action "${action}" for seat ${seat}`);
  const state = clone(prev);
  const s = state.seats.find((x) => x.seat === seat)!;
  const toCall = state.betToCall - s.committedThisStreet;
  const reopen = () => { for (const o of state.seats) if (o.seat !== seat && o.status === 'active') o.hasActedThisStreet = false; };
  switch (action) {
    case 'fold': s.status = 'folded'; s.hasActedThisStreet = true; break;
    case 'check': s.hasActedThisStreet = true; break;
    case 'call': commit(s, toCall); s.hasActedThisStreet = true; break;
    case 'bet': {
      const target = amount ?? 0;
      if (target < cfg.bigBlind && target < s.committedThisStreet + s.stack) throw new Error(`Bet must be >= ${cfg.bigBlind}`);
      const need = target - s.committedThisStreet; if (need > s.stack) throw new Error('Bet exceeds stack');
      commit(s, need); state.minRaise = s.committedThisStreet - state.betToCall; state.betToCall = s.committedThisStreet;
      state.lastAggressorSeat = seat; reopen(); s.hasActedThisStreet = true; break;
    }
    case 'raise': {
      const target = amount ?? 0; const isAllIn = target >= s.committedThisStreet + s.stack;
      const minTarget = state.betToCall + state.minRaise;
      if (!isAllIn && target < minTarget) throw new Error(`Raise must be to at least ${minTarget}`);
      const need = target - s.committedThisStreet; if (need > s.stack) throw new Error('Raise exceeds stack');
      const increment = target - state.betToCall; commit(s, need);
      if (increment >= state.minRaise) { state.minRaise = increment; reopen(); }
      state.betToCall = Math.max(state.betToCall, s.committedThisStreet); state.lastAggressorSeat = seat; s.hasActedThisStreet = true; break;
    }
    case 'allin': {
      commit(s, s.stack); const target = s.committedThisStreet;
      if (target > state.betToCall) {
        const increment = target - state.betToCall;
        if (increment >= state.minRaise) { state.minRaise = increment; reopen(); }
        state.betToCall = target; state.lastAggressorSeat = seat;
      }
      s.hasActedThisStreet = true; break;
    }
  }
  if (isBettingRoundClosed(state)) state.currentTurnSeat = null;
  else state.currentTurnSeat = nextSeatMatching(state, seat, (x) => x.status === 'active' && (!x.hasActedThisStreet || x.committedThisStreet < state.betToCall));
  return state;
}
const NEXT_STREET: Record<string, PokerPublicState['phase']> = { preflop: 'flop', flop: 'turn', turn: 'river', river: 'showdown' };
export function advanceStreet(prev: PokerPublicState, deck: Card[]): { state: PokerPublicState; deck: Card[] } {
  const state = clone(prev); let working = [...deck];
  for (const s of state.seats) { s.committedThisStreet = 0; if (s.status === 'active') s.hasActedThisStreet = false; }
  state.betToCall = 0; state.minRaise = state.blinds.bb; state.lastAggressorSeat = null;
  const next = NEXT_STREET[state.phase] ?? 'showdown';
  if (state.phase === 'preflop') { const [c, rest] = draw(working, 3); state.communityCards = [...state.communityCards, ...c]; working = rest; }
  else if (state.phase === 'flop' || state.phase === 'turn') { const [c, rest] = draw(working, 1); state.communityCards = [...state.communityCards, ...c]; working = rest; }
  state.phase = next;
  state.currentTurnSeat = next === 'showdown' ? null : nextSeatMatching(state, state.buttonSeat, (s) => s.status === 'active');
  return { state, deck: working };
}
export function runShowdown(prev: PokerPublicState, hole: Record<number, Card[]>): PokerPublicState {
  const state = clone(prev);
  const pots = buildPots(state.seats);
  const showdownHands: Record<number, HandRank> = {};
  for (const s of state.seats) {
    if ((s.status === 'active' || s.status === 'allin') && hole[s.seat]) {
      s.holeCards = [...hole[s.seat]];
      showdownHands[s.seat] = evaluate7([...hole[s.seat], ...state.communityCards]);
    }
  }
  const won = distribute(pots, showdownHands, state.buttonSeat);
  const results = Object.entries(won).map(([seatStr, amountWon]) => {
    const seat = Number(seatStr);
    return { seat, amountWon, handLabel: showdownHands[seat]?.label ?? '' };
  });
  for (const s of state.seats) if (won[s.seat]) s.stack += won[s.seat];
  state.results = results; state.phase = 'payout'; state.currentTurnSeat = null;
  return state;
}
