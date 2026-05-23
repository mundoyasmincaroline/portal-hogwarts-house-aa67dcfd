
-- 1. Fix Function Search Path Mutable warnings
ALTER FUNCTION public.apply_item_effects() SET search_path = public;
ALTER FUNCTION public.complete_referral_action(_invited_id uuid) SET search_path = public;
ALTER FUNCTION public.create_infinitepay_link(p_order_id uuid, p_amount_brl numeric, p_description text, p_user_id uuid, p_user_email text, p_user_name text, p_galeons integer, p_vip_plan text) SET search_path = public;
ALTER FUNCTION public.get_payment_link(p_request_id bigint, p_order_id uuid) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.start_payment_request(p_order_id uuid, p_amount_brl numeric, p_description text, p_user_id uuid, p_user_email text, p_user_name text) SET search_path = public;
ALTER FUNCTION public.update_last_seen() SET search_path = public;
ALTER FUNCTION public.verify_infinitepay_payment(p_order_nsu text, p_transaction_nsu text, p_slug text) SET search_path = public;
ALTER FUNCTION public.calc_blood_status(_mother_id uuid, _father_id uuid) SET search_path = public;

-- 2. Tighten notifications INSERT: require authenticated user (cannot impersonate anon)
DROP POLICY IF EXISTS "Users can insert notifications for others" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
