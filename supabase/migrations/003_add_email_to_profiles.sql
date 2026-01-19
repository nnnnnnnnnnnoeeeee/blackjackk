-- ============================================================================
-- Add email and email verification status to profiles table
-- ============================================================================

-- Add email column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verified_at timestamp with time zone;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Update existing profiles with email from auth.users
UPDATE public.profiles p
SET 
  email = u.email,
  email_verified = (u.email_confirmed_at IS NOT NULL),
  email_verified_at = u.email_confirmed_at
FROM auth.users u
WHERE p.id = u.id;

-- Update the handle_new_user function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to sync email verification status
CREATE OR REPLACE FUNCTION public.sync_user_email_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET 
    email = NEW.email,
    email_verified = (NEW.email_confirmed_at IS NOT NULL),
    email_verified_at = NEW.email_confirmed_at
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync email status when user email is confirmed
DROP TRIGGER IF EXISTS sync_email_status ON auth.users;
CREATE TRIGGER sync_email_status
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at)
  EXECUTE FUNCTION public.sync_user_email_status();

-- Create trigger to sync email when user email changes
DROP TRIGGER IF EXISTS sync_email_change ON auth.users;
CREATE TRIGGER sync_email_change
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.sync_user_email_status();

-- Allow viewing all profiles (including emails) for authenticated users
-- This is useful for multiplayer features where you need to see other players
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);
