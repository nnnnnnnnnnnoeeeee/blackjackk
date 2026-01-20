-- ============================================================================
-- Add room_code to tables for easy joining
-- ============================================================================

-- Add room_code column
ALTER TABLE tables 
ADD COLUMN IF NOT EXISTS room_code TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tables_room_code ON tables(room_code);

-- Generate room codes for existing tables
UPDATE tables 
SET room_code = UPPER(SUBSTRING(MD5(id::text || created_at::text), 1, 6))
WHERE room_code IS NULL;

-- Function to generate a unique room code
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a 6-character code (letters and numbers)
    new_code := UPPER(
      SUBSTRING(
        MD5(RANDOM()::text || NOW()::text),
        1, 6
      )
    );
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM tables WHERE room_code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;
