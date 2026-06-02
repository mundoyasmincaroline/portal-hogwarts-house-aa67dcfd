CREATE OR REPLACE FUNCTION public.open_sticker_pack(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_xp INTEGER;
  v_pack_cost INTEGER := 80;
  v_picked RECORD;
  v_pool_size INTEGER;
  v_pick_index INTEGER;
BEGIN
  IF _user_id IS NULL OR auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Não autorizado');
  END IF;

  SELECT xp INTO v_xp FROM public.profiles WHERE user_id = _user_id FOR UPDATE;
  IF v_xp IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Perfil não encontrado');
  END IF;
  IF v_xp < v_pack_cost THEN
    RETURN jsonb_build_object('success', false, 'message', 'XP insuficiente');
  END IF;

  -- Construir pool ponderado de figurinhas ainda não possuídas
  WITH locked AS (
    SELECT s.id, s.character_name, s.rarity, s.image_url, s.house,
      CASE s.rarity WHEN 'gold' THEN 1 WHEN 'silver' THEN 3 ELSE 6 END AS weight
    FROM public.stickers s
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_stickers us
      WHERE us.user_id = _user_id AND us.sticker_id = s.id
    )
  ),
  weighted AS (
    SELECT id, character_name, rarity, image_url, house,
      SUM(weight) OVER (ORDER BY id) AS cumulative,
      SUM(weight) OVER () AS total
    FROM locked
  )
  SELECT id, character_name, rarity, image_url, house INTO v_picked
  FROM weighted
  WHERE cumulative >= (random() * total)
  ORDER BY cumulative
  LIMIT 1;

  IF v_picked.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Álbum completo');
  END IF;

  -- Desconta XP atomicamente
  PERFORM public.award_xp_action('buy_sticker', _user_id, -v_pack_cost);

  -- Adiciona figurinha
  INSERT INTO public.user_stickers (user_id, sticker_id)
  VALUES (_user_id, v_picked.id)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'sticker', jsonb_build_object(
      'id', v_picked.id,
      'character_name', v_picked.character_name,
      'rarity', v_picked.rarity,
      'image_url', v_picked.image_url,
      'house', v_picked.house
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.open_sticker_pack(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.open_sticker_pack(uuid) TO authenticated;