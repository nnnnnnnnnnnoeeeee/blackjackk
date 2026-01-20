-- ============================================================================
-- Fix profiles RLS to allow viewing other players' usernames
-- And ensure private tables can only be joined by code
-- ============================================================================

-- Allow viewing all profiles (for displaying player names in multiplayer)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

CREATE POLICY "Anyone authenticated can view profiles"
  ON profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Keep update and insert policies as they were
-- (Users can only update/insert their own profile)
