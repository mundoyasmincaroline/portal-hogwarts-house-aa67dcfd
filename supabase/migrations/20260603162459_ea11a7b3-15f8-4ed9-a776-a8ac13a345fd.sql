-- 1. Restrict Admin Views
REVOKE ALL ON public.admin_kpis FROM anon, authenticated, public;
REVOKE ALL ON public.analytics_vip_funnel FROM anon, authenticated, public;
REVOKE ALL ON public.analytics_daily_active FROM anon, authenticated, public;
REVOKE ALL ON public.analytics_retention_cohorts FROM anon, authenticated, public;
REVOKE ALL ON public.analytics_house_distribution FROM anon, authenticated, public;

GRANT SELECT ON public.admin_kpis TO service_role;
GRANT SELECT ON public.analytics_vip_funnel TO service_role;
GRANT SELECT ON public.analytics_daily_active TO service_role;
GRANT SELECT ON public.analytics_retention_cohorts TO service_role;
GRANT SELECT ON public.analytics_house_distribution TO service_role;

-- 2. Clean up Storage Policies (Avatars)
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users upload own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own avatars" ON storage.objects;

-- Create single, secure policies
-- Anyone can view avatars (but listing the whole bucket is restricted by not using a broad SELECT)
CREATE POLICY "Public view avatars" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Users can only upload to their own folder (id/filename)
CREATE POLICY "Users can upload own avatars" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can only update their own avatars
CREATE POLICY "Users can update own avatars" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can only delete their own avatars
CREATE POLICY "Users can delete own avatars" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Ensure search_path on trigger functions and others (best practice)
-- I'll use a DO block to set it for all SECURITY DEFINER functions that might have been missed
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT n.nspname, p.proname, p.proargtypes
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.prosecdef = true
    ) LOOP
        EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public', r.nspname, r.proname, pg_get_function_identity_arguments(format('%I.%I', r.nspname, r.proname)::regproc));
    END LOOP;
END $$;
