-- ============================================================================
-- Add public/private option for tables
-- ============================================================================

-- Add is_public column (default to true for existing tables)
ALTER TABLE tables 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_tables_is_public ON tables(is_public);

-- Update RLS policy to allow viewing public tables or own tables
DROP POLICY IF EXISTS "Anyone can view active tables" ON tables;

CREATE POLICY "Users can view public tables or their own tables"
  ON tables FOR SELECT
  USING (
    status != 'finished' AND (
      is_public = true OR 
      created_by = auth.uid()
    )
  );
