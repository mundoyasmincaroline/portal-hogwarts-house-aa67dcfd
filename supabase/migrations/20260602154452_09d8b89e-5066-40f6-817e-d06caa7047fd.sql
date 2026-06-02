-- Enable pg_cron and schedule monthly VIP renewals
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Remove previous schedule if exists
DO $$
BEGIN
  PERFORM cron.unschedule('vip-monthly-renewals');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Run on the 1st of every month at 03:00 UTC
SELECT cron.schedule(
  'vip-monthly-renewals',
  '0 3 1 * *',
  $$ SELECT public.process_vip_renewals(); $$
);