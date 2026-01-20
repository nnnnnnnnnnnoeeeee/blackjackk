-- ============================================================================
-- Fix RLS Policy recursion issue for table_players
-- ============================================================================

-- Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "Anyone can view players in waiting tables" ON table_players;
DROP POLICY IF EXISTS "Players can view players in their table" ON table_players;

-- Create a simpler policy: anyone authenticated can view players in waiting tables
-- This avoids recursion by not checking if the user is in the table
CREATE POLICY "Anyone can view players in waiting tables"
  ON table_players FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tables t
      WHERE t.id = table_players.table_id
      AND t.status = 'waiting'
    )
  );

-- Also allow users to see players in tables they're in (any status)
-- But use a different approach to avoid recursion
CREATE POLICY "Users can view players in their own tables"
  ON table_players FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM tables t
      WHERE t.id = table_players.table_id
      AND t.status = 'waiting'
    )
  );
