-- ============================================================================
-- Allow joining private tables by room code
-- ============================================================================

-- Update RLS policy to allow viewing tables when joining by room code
-- Users can view:
-- 1. Public tables (any status except finished)
-- 2. Their own tables (any status)
-- 3. Private tables that are waiting (for joining by code)
DROP POLICY IF EXISTS "Users can view public tables or their own tables" ON tables;

CREATE POLICY "Users can view public tables, own tables, or waiting private tables"
  ON tables FOR SELECT
  USING (
    status != 'finished' AND (
      is_public = true OR 
      created_by = auth.uid() OR
      (is_public = false AND status = 'waiting') -- Allow viewing private waiting tables (for room code join)
    )
  );
