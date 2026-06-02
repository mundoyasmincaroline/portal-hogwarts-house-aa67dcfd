
-- RPC atômica para creditar Galeões sem race condition
CREATE OR REPLACE FUNCTION public.credit_galeons_atomic(_user_id uuid, _amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance integer;
BEGIN
  IF _amount <= 0 THEN
    RETURN 0;
  END IF;
  UPDATE public.profiles
     SET galeons = COALESCE(galeons, 0) + _amount,
         updated_at = now()
   WHERE user_id = _user_id
  RETURNING galeons INTO v_new_balance;
  RETURN COALESCE(v_new_balance, 0);
END;
$$;

-- RPC admin para creditar pedido pendente de forma atômica
CREATE OR REPLACE FUNCTION public.admin_credit_order(_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_plan_id text;
  v_vip_galeons int;
  v_expires_at timestamptz;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Apenas administradores');
  END IF;

  -- Claim atômico: só atualiza se ainda pending
  UPDATE public.galeon_orders
     SET status = 'paid', paid_at = now()
   WHERE id = _order_id AND status = 'pending'
  RETURNING * INTO v_order;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Pedido já processado ou não encontrado');
  END IF;

  IF v_order.package_id LIKE 'vip_%' THEN
    v_plan_id := REPLACE(v_order.package_id, 'vip_', '');
    v_expires_at := now() + INTERVAL '1 month';
    v_vip_galeons := CASE v_plan_id
      WHEN 'premium' THEN 0
      WHEN 'vip'     THEN 200
      WHEN 'founder' THEN 500
      ELSE 0
    END;

    UPDATE public.profiles
       SET vip_plan = v_plan_id,
           vip_expires_at = v_expires_at,
           galeons = COALESCE(galeons, 0) + v_vip_galeons,
           updated_at = now()
     WHERE user_id = v_order.user_id;

    INSERT INTO public.vip_subscriptions (user_id, plan, amount_brl, status, expires_at, galeons_monthly)
    VALUES (v_order.user_id, v_plan_id, v_order.amount_brl, 'active', v_expires_at, v_vip_galeons);

    INSERT INTO public.notifications (user_id, title, message, link)
    VALUES (v_order.user_id, '👑 Plano VIP ativado!',
            'Seu plano ' || upper(v_plan_id) || ' está ativo. Aproveite os benefícios!',
            '/dashboard/wallet');

    RETURN jsonb_build_object('success', true, 'type', 'vip', 'plan', v_plan_id);
  ELSE
    PERFORM public.credit_galeons_atomic(v_order.user_id, COALESCE(v_order.galeons, 0));

    INSERT INTO public.notifications (user_id, title, message, link)
    VALUES (v_order.user_id, '🪙 Galeões creditados!',
            COALESCE(v_order.galeons,0) || ' Galeões foram adicionados ao seu cofre.',
            '/dashboard/wallet');

    RETURN jsonb_build_object('success', true, 'type', 'galeons', 'galeons', v_order.galeons);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.credit_galeons_atomic(uuid, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_credit_order(uuid) TO authenticated, service_role;
