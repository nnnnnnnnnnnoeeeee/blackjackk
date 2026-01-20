-- ============================================================================
-- Fix RLS Policy for table_state to allow users to create state
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Table state is viewable by players in the table" ON table_state;
DROP POLICY IF EXISTS "Users can create table state" ON table_state;
DROP POLICY IF EXISTS "Table creator can create state" ON table_state;

-- Allow users to view table state if they are players in the table
CREATE POLICY "Players can view table state"
  ON table_state FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM table_players tp
      WHERE tp.table_id = table_state.table_id
      AND tp.user_id = auth.uid()
    )
  );

-- Allow users to create table state if they created the table
CREATE POLICY "Table creator can create state"
  ON table_state FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tables t
      WHERE t.id = table_state.table_id
      AND t.created_by = auth.uid()
    )
  );

-- Allow users to update table state if they are players in the table
CREATE POLICY "Players can update table state"
  ON table_state FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM table_players tp
      WHERE tp.table_id = table_state.table_id
      AND tp.user_id = auth.uid()
    )
  );
