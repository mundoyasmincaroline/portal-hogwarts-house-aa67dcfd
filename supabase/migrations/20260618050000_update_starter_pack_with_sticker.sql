-- ============ claim_starter_pack ============
CREATE OR REPLACE FUNCTION public.claim_starter_pack(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_already boolean;
  v_picked RECORD;
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

  -- Pick a random sticker
  WITH weighted AS (
    SELECT id, character_name, rarity, image_url, house,
      CASE rarity WHEN 'gold' THEN 1 WHEN 'silver' THEN 3 ELSE 6 END AS weight,
      SUM(CASE rarity WHEN 'gold' THEN 1 WHEN 'silver' THEN 3 ELSE 6 END) OVER (ORDER BY id) AS cumulative,
      SUM(CASE rarity WHEN 'gold' THEN 1 WHEN 'silver' THEN 3 ELSE 6 END) OVER () AS total
    FROM public.stickers
  )
  SELECT id, character_name, rarity, image_url, house INTO v_picked
  FROM weighted
  WHERE cumulative >= (random() * total)
  ORDER BY cumulative
  LIMIT 1;

  IF v_picked.id IS NOT NULL THEN
    INSERT INTO public.user_stickers (user_id, sticker_id, quantity)
    VALUES (_user_id, v_picked.id, 1)
    ON CONFLICT (user_id, sticker_id) DO UPDATE SET quantity = public.user_stickers.quantity + 1;
  END IF;

  RETURN jsonb_build_object('ok', true, 'galeons', 200, 'xp', 50, 'sticker', row_to_json(v_picked));
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_starter_pack(uuid) TO authenticated, service_role;
