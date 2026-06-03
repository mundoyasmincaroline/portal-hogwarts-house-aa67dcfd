-- Revoke execute from public for all SECURITY DEFINER functions in public schema
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.prosecdef = true
    ) LOOP
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC', r.nspname, r.proname, r.args);
        -- Re-grant to authenticated and service_role to ensure legitimate app usage
        EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated, service_role', r.nspname, r.proname, r.args);
    END LOOP;
END $$;
