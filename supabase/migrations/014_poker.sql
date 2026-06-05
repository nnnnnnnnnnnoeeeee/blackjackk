-- ============================================================================
-- Poker (No-Limit Texas Hold'em) — multi-game support + private hole cards
-- ============================================================================
-- This migration is additive and idempotent. It does NOT change blackjack
-- behaviour: existing tables default to game_type = 'blackjack'.

-- ----------------------------------------------------------------------------
-- 1. Multi-game support on `tables`
-- ----------------------------------------------------------------------------
ALTER TABLE tables
  ADD COLUMN IF NOT EXISTS game_type TEXT NOT NULL DEFAULT 'blackjack'
  CHECK (game_type IN ('blackjack', 'poker'));

CREATE INDEX IF NOT EXISTS idx_tables_game_type ON tables(game_type);

-- ----------------------------------------------------------------------------
-- 2. Private hole cards — the security cornerstone of poker
-- ----------------------------------------------------------------------------
-- Each player's 2 hole cards live here, NOT in table_state.state_json.
-- RLS guarantees a client can read ONLY its own row, so opponents can never
-- fetch each other's cards. Writes happen only via Edge Functions (service role,
-- which bypasses RLS) — there is intentionally no client INSERT/UPDATE policy.
CREATE TABLE IF NOT EXISTS poker_hole_cards (
  table_id   UUID    NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  hand_no    INTEGER NOT NULL,
  user_id    UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seat       INTEGER NOT NULL CHECK (seat BETWEEN 1 AND 8),
  cards      JSONB   NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (table_id, hand_no, user_id)
);

ALTER TABLE poker_hole_cards ENABLE ROW LEVEL SECURITY;

-- Owner-only read. (No client write policies → only the service role writes.)
DROP POLICY IF EXISTS "Players read only their own hole cards" ON poker_hole_cards;
CREATE POLICY "Players read only their own hole cards"
  ON poker_hole_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_poker_hole_cards_hand
  ON poker_hole_cards(table_id, hand_no);

-- ----------------------------------------------------------------------------
-- 3. Notes
-- ----------------------------------------------------------------------------
-- * The PUBLIC poker state (community cards, pots, bets, button, blinds, whose
--   turn, and at SHOWDOWN the revealed hole cards) reuses the existing
--   `table_state.state_json` and its "players of this table can read" RLS.
-- * `tables.status` stays generic ('waiting' | 'playing' | ...). The detailed
--   poker phase (preflop/flop/turn/river/showdown/payout) lives in state_json.
-- * `tables.config` holds the PokerConfig JSON for poker tables, e.g.
--   { "smallBlind": 5, "bigBlind": 10, "actionTimerSec": 20, "maxPlayers": 8 }.
-- * Realtime: poker reuses the already-published table_state / tables /
--   table_players. poker_hole_cards is fetched on demand per hand (owner-only),
--   so it does NOT need to be added to the realtime publication.
