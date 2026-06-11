
-- ============ buy_sticker_with_galeons ============
CREATE OR REPLACE FUNCTION public.buy_sticker_with_galeons(_user_id uuid, _sticker_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rarity text;
  v_cost integer;
  v_balance integer;
  v_exists boolean;
  v_name text;
BEGIN
  SELECT rarity, character_name INTO v_rarity, v_name FROM public.stickers WHERE id = _sticker_id;
  IF v_rarity IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'sticker_not_found');
  END IF;

  v_cost := CASE v_rarity
    WHEN 'gold' THEN 150
    WHEN 'silver' THEN 60
    ELSE 25
  END;

  SELECT EXISTS(SELECT 1 FROM public.user_stickers WHERE user_id = _user_id AND sticker_id = _sticker_id) INTO v_exists;
  IF v_exists THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_owned');
  END IF;

  SELECT COALESCE(galeons, 0) INTO v_balance FROM public.profiles WHERE user_id = _user_id FOR UPDATE;
  IF v_balance < v_cost THEN
    RETURN jsonb_build_object('ok', false, 'error', 'insufficient_galeons', 'need', v_cost, 'have', v_balance);
  END IF;

  UPDATE public.profiles
     SET galeons = galeons - v_cost, updated_at = now()
   WHERE user_id = _user_id;

  INSERT INTO public.user_stickers(user_id, sticker_id) VALUES (_user_id, _sticker_id);

  INSERT INTO public.currency_ledger(user_id, currency_type, amount, transaction_type, description)
  VALUES (_user_id, 'galeon', -v_cost, 'sticker_purchase', 'Figurinha: ' || v_name);

  RETURN jsonb_build_object('ok', true, 'cost', v_cost, 'new_balance', v_balance - v_cost);
END;
$$;

GRANT EXECUTE ON FUNCTION public.buy_sticker_with_galeons(uuid, uuid) TO authenticated, service_role;

-- ============ claim_starter_pack ============
CREATE OR REPLACE FUNCTION public.claim_starter_pack(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_already boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.currency_ledger
     WHERE user_id = _user_id AND transaction_type = 'starter_pack'
  ) INTO v_already;

  IF v_already THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_claimed');
  END IF;

  UPDATE public.profiles
     SET galeons = COALESCE(galeons,0) + 200,
         xp = COALESCE(xp,0) + 50,
         updated_at = now()
   WHERE user_id = _user_id;

  INSERT INTO public.currency_ledger(user_id, currency_type, amount, transaction_type, description)
  VALUES (_user_id, 'galeon', 200, 'starter_pack', 'Bônus de boas-vindas');

  RETURN jsonb_build_object('ok', true, 'galeons', 200, 'xp', 50);
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_starter_pack(uuid) TO authenticated, service_role;
