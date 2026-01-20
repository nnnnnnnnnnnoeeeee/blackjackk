-- ============================================================================
-- Fix Function Search Path Security Issues
-- ============================================================================
-- This migration fixes the "Function Search Path Mutable" warnings by
-- setting explicit search_path for all functions to prevent security vulnerabilities.

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, email_verified, email_verified_at)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    NEW.email,
    (NEW.email_confirmed_at IS NOT NULL),
    NEW.email_confirmed_at
  );
  RETURN NEW;
END;
$$;

-- Fix sync_user_email_status function
CREATE OR REPLACE FUNCTION public.sync_user_email_status()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    email = NEW.email,
    email_verified = (NEW.email_confirmed_at IS NOT NULL),
    email_verified_at = NEW.email_confirmed_at
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix get_table_player_count function
CREATE OR REPLACE FUNCTION get_table_player_count(table_uuid UUID)
RETURNS INTEGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM table_players WHERE table_id = table_uuid);
END;
$$;

-- Fix is_user_in_table function
CREATE OR REPLACE FUNCTION is_user_in_table(table_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM table_players
    WHERE table_id = table_uuid AND user_id = user_uuid
  );
END;
$$;

-- Fix generate_room_code function
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT 
LANGUAGE plpgsql
SET search_path = public
AS $$
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
$$;
