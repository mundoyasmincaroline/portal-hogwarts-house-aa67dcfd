-- Add blood_locked column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blood_locked BOOLEAN DEFAULT false;

-- Update existing profiles to have blood_locked as false
UPDATE public.profiles SET blood_locked = false WHERE blood_locked IS NULL;
