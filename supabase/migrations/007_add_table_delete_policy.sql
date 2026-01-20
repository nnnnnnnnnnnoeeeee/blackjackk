-- ============================================================================
-- Add RLS Policy for deleting tables
-- ============================================================================

-- Allow table creator to delete their table
CREATE POLICY "Table creator can delete their table"
  ON tables FOR DELETE
  USING (auth.uid() = created_by);
