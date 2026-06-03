ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS facial_identity_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS facial_verification_enabled BOOLEAN DEFAULT FALSE;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.profiles TO authenticated;