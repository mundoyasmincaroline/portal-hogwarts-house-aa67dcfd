CREATE OR REPLACE FUNCTION public.buy_streak_freeze(p_qty integer DEFAULT 1)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_cost int := 50 * p_qty;
  v_galeons int;
  v_freezes int;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF p_qty < 1 OR p_qty > 3 THEN RAISE EXCEPTION 'Quantidade inválida (1-3)'; END IF;

  SELECT galeons, streak_freezes INTO v_galeons, v_freezes
    FROM public.profiles WHERE user_id = v_user FOR UPDATE;
  v_freezes := COALESCE(v_freezes, 0);
  v_galeons := COALESCE(v_galeons, 0);

  IF v_freezes + p_qty > 3 THEN
    RAISE EXCEPTION 'Você só pode guardar até 3 Cápsulas de Tempo.';
  END IF;
  IF v_galeons < v_cost THEN
    RAISE EXCEPTION 'Galeões insuficientes (precisa de %).', v_cost;
  END IF;

  UPDATE public.profiles
     SET galeons = galeons - v_cost,
         streak_freezes = COALESCE(streak_freezes, 0) + p_qty
   WHERE user_id = v_user;

  INSERT INTO public.currency_ledger (user_id, currency_type, amount, transaction_type, description)
  VALUES (v_user, 'galeons', -v_cost, 'purchase', 'Compra de ' || p_qty || ' Cápsula(s) de Tempo');

  INSERT INTO public.notifications (user_id, title, message)
  VALUES (v_user, '⏳ Cápsula de Tempo adquirida!',
          'Você agora tem ' || (v_freezes + p_qty) || ' cápsula(s) para salvar sua sequência.');

  RETURN jsonb_build_object('success', true, 'freezes', v_freezes + p_qty, 'cost', v_cost);
END;
$$;