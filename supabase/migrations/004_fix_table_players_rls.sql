-- ============================================================================
-- Fix RLS Policy for table_players to allow viewing players in waiting tables
-- ============================================================================

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Players can view players in their table" ON table_players;

-- Create a new policy that allows viewing players in waiting tables
-- This allows anyone authenticated to see who's in waiting tables (for lobby)
CREATE POLICY "Anyone can view players in waiting tables"
  ON table_players FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tables t
      WHERE t.id = table_players.table_id
      AND t.status = 'waiting'
    )
    OR
    -- Also allow players to see players in their own table (any status)
    EXISTS (
      SELECT 1 FROM table_players tp
      WHERE tp.table_id = table_players.table_id
      AND tp.user_id = auth.uid()
    )
  );
