-- ============================================================================
-- Poker — private per-hand deck/board store (server-only)
-- ============================================================================
-- The undealt deck and the pre-dealt community board must never be visible to
-- clients (knowing future cards = cheating). This table has RLS enabled with NO
-- policies, so no client can read or write it; only Edge Functions using the
-- service-role key (which bypasses RLS) touch it.

CREATE TABLE IF NOT EXISTS poker_private (
  table_id   UUID PRIMARY KEY REFERENCES tables(id) ON DELETE CASCADE,
  hand_no    INTEGER NOT NULL DEFAULT 0,
  deck       JSONB   NOT NULL DEFAULT '[]'::jsonb,  -- remaining undealt cards
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE poker_private ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies: clients cannot SELECT/INSERT/UPDATE/DELETE.

-- Allow poker action types in the action log (extend the existing CHECK).
ALTER TABLE table_actions DROP CONSTRAINT IF EXISTS table_actions_action_type_check;
ALTER TABLE table_actions ADD CONSTRAINT table_actions_action_type_check
  CHECK (action_type IN (
    'bet','hit','stand','double','split','insurance','surrender','deal','dealer_draw','settle',
    'fold','check','call','raise','allin','showdown'
  ));
