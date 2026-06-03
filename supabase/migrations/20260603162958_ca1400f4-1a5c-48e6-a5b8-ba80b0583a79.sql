-- 1. Recreate views with security_invoker = true
-- Drop views first
DROP VIEW IF EXISTS public.admin_kpis;
DROP VIEW IF EXISTS public.analytics_daily_active;
DROP VIEW IF EXISTS public.analytics_house_distribution;
DROP VIEW IF EXISTS public.analytics_retention_cohorts;
DROP VIEW IF EXISTS public.analytics_vip_funnel;

-- Recreate admin_kpis
CREATE VIEW public.admin_kpis WITH (security_invoker = true) AS
SELECT 
    (SELECT count(*) FROM profiles) AS total_wizards,
    (SELECT count(*) FROM profiles WHERE approved = true) AS approved_wizards,
    (SELECT count(*) FROM profiles WHERE created_at > (now() - '7 days'::interval)) AS new_week,
    (SELECT count(*) FROM moderation_log WHERE created_at > (now() - '7 days'::interval)) AS flags_week,
    (SELECT count(*) FROM marketplace_listings WHERE status = 'active'::text) AS market_active,
    (SELECT count(*) FROM tournaments WHERE status = ANY (ARRAY['open'::text, 'running'::text])) AS tournaments_active,
    (SELECT COALESCE(sum(amount_brl), 0) FROM galeon_orders WHERE status = 'paid'::text AND paid_at > date_trunc('month'::text, now())) AS revenue_month_brl;

-- Recreate analytics_daily_active
CREATE VIEW public.analytics_daily_active WITH (security_invoker = true) AS
SELECT (date_trunc('day'::text, last_seen))::date AS day,
    count(*) AS active_users
   FROM profiles
  WHERE (last_seen > (now() - '30 days'::interval))
  GROUP BY ((date_trunc('day'::text, last_seen))::date)
  ORDER BY ((date_trunc('day'::text, last_seen))::date);

-- Recreate analytics_house_distribution
CREATE VIEW public.analytics_house_distribution WITH (security_invoker = true) AS
SELECT (house)::text AS house,
    count(*) AS total
   FROM profiles
  WHERE (approved = true)
  GROUP BY house;

-- Recreate analytics_retention_cohorts
CREATE VIEW public.analytics_retention_cohorts WITH (security_invoker = true) AS
SELECT (date_trunc('week'::text, created_at))::date AS cohort_week,
    count(*) AS signups,
    count(*) FILTER (WHERE (last_seen > (now() - '7 days'::interval))) AS still_active
   FROM profiles
  WHERE (created_at > (now() - '90 days'::interval))
  GROUP BY ((date_trunc('week'::text, created_at))::date)
  ORDER BY ((date_trunc('week'::text, created_at))::date);

-- Recreate analytics_vip_funnel
CREATE VIEW public.analytics_vip_funnel WITH (security_invoker = true) AS
SELECT 
    (SELECT count(*) FROM profiles) AS total_users,
    (SELECT count(*) FROM profiles WHERE vip_plan IS NOT NULL) AS vip_users,
    (SELECT count(*) FROM galeon_orders WHERE status = 'paid'::text) AS paid_orders,
    (SELECT COALESCE(sum(amount_brl), 0) FROM galeon_orders WHERE status = 'paid'::text) AS lifetime_revenue_brl;

-- Grant access back to service_role and authenticated (admins will see data via RLS)
GRANT SELECT ON public.admin_kpis TO service_role, authenticated;
GRANT SELECT ON public.analytics_daily_active TO service_role, authenticated;
GRANT SELECT ON public.analytics_house_distribution TO service_role, authenticated;
GRANT SELECT ON public.analytics_retention_cohorts TO service_role, authenticated;
GRANT SELECT ON public.analytics_vip_funnel TO service_role, authenticated;

-- 2. Add admin policies for tables used in views
CREATE POLICY "Admins can view all galeon orders" ON public.galeon_orders
FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all marketplace listings" ON public.marketplace_listings
FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Fix Storage Policies (Listing issue)
-- Remove broad public SELECT on storage.objects
DROP POLICY IF EXISTS "Public view avatars" ON storage.objects;
-- Add a more restrictive one for authenticated users if they need to list (optional, but safer)
CREATE POLICY "Authenticated can view avatars list" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'avatars');

-- 4. Revoke execute from anon on ALL functions in public
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
    ) LOOP
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM anon, public', r.nspname, r.proname, r.args);
        -- Re-grant to authenticated and service_role
        EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated, service_role', r.nspname, r.proname, r.args);
    END LOOP;
END $$;

-- 5. Set search_path for ALL functions in public (linter requirement)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
    ) LOOP
        EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public', r.nspname, r.proname, r.args);
    END LOOP;
END $$;
