
DROP FUNCTION IF EXISTS public.buy_store_item(uuid, uuid);
DROP FUNCTION IF EXISTS public.buy_store_item(uuid, text);

CREATE OR REPLACE FUNCTION public.buy_store_item(_user_id uuid, _item_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  item_price INTEGER;
  item_name TEXT;
  user_balance INTEGER;
  item_effects JSONB;
  xp_bonus_val INTEGER := 0;
  galeons_bonus_val INTEGER := 0;
  level_up_val INTEGER := 0;
BEGIN
  SELECT price_galeons, name, COALESCE(effects, '{}'::jsonb)
    INTO item_price, item_name, item_effects
  FROM public.store_items WHERE id = _item_id AND is_active = true;

  IF item_price IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Item não encontrado ou inativo');
  END IF;

  SELECT galeons INTO user_balance FROM public.profiles WHERE user_id = _user_id;
  IF user_balance IS NULL OR user_balance < item_price THEN
    RETURN jsonb_build_object('success', false, 'message', 'Saldo de Galeões insuficiente');
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_items WHERE user_id = _user_id AND item_id = _item_id) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Você já possui este item');
  END IF;

  UPDATE public.profiles
     SET galeons = galeons - item_price, updated_at = now()
   WHERE user_id = _user_id;

  INSERT INTO public.user_items (user_id, item_id, purchased_at)
  VALUES (_user_id, _item_id, now());

  IF item_effects ? 'xp_reward' THEN
    xp_bonus_val := xp_bonus_val + (item_effects->>'xp_reward')::INTEGER;
  END IF;
  IF item_effects ? 'xp_bonus' THEN
    xp_bonus_val := xp_bonus_val + ((item_effects->>'xp_bonus')::INTEGER * 50);
  END IF;
  IF item_effects ? 'galeons_bonus' THEN
    galeons_bonus_val := (item_effects->>'galeons_bonus')::INTEGER * 10;
  END IF;
  IF item_effects ? 'level_up' THEN
    level_up_val := (item_effects->>'level_up')::INTEGER;
  END IF;

  IF xp_bonus_val > 0 OR level_up_val > 0 THEN
    UPDATE public.profiles
       SET xp = COALESCE(xp,0) + xp_bonus_val,
           level = COALESCE(level,1) + level_up_val,
           updated_at = now()
     WHERE user_id = _user_id;
  END IF;

  IF galeons_bonus_val > 0 THEN
    UPDATE public.profiles
       SET galeons = galeons + galeons_bonus_val
     WHERE user_id = _user_id;
  END IF;

  INSERT INTO public.notifications (user_id, title, message, link)
  VALUES (
    _user_id,
    '🪙 Compra realizada!',
    'Você adquiriu "' || item_name || '" em Gringotts.'
      || CASE WHEN xp_bonus_val > 0 THEN ' (+' || xp_bonus_val || ' XP)' ELSE '' END
      || CASE WHEN galeons_bonus_val > 0 THEN ' (+' || galeons_bonus_val || ' Galeões)' ELSE '' END,
    '/perfil'
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Compra realizada com sucesso!',
    'xp_gained', xp_bonus_val,
    'galeons_gained', galeons_bonus_val,
    'level_up', level_up_val
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_item_effects()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- No-op: efeitos agora são aplicados em buy_store_item para evitar duplicidade.
  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION public.buy_store_item(uuid, text) TO authenticated, service_role;

UPDATE public.store_items
   SET is_featured = (id LIKE 'mq_%' OR rarity = 'legendary');
