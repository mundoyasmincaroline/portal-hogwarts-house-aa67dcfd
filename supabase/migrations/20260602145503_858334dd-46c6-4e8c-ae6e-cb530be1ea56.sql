
-- 1) RPC servidor-side para validar resposta de enigma sem expor correct_answer
CREATE OR REPLACE FUNCTION public.validate_enigma_answer(
  _challenge_id uuid,
  _answer text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _ch record;
  _already boolean;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Não autenticado');
  END IF;

  SELECT id, xp_reward, correct_answer, type, active
    INTO _ch
    FROM public.challenges
   WHERE id = _challenge_id;

  IF NOT FOUND OR _ch.active IS NOT TRUE THEN
    RETURN jsonb_build_object('success', false, 'message', 'Enigma indisponível');
  END IF;

  IF lower(trim(coalesce(_answer,''))) <> lower(trim(coalesce(_ch.correct_answer,''))) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Resposta incorreta');
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.user_challenges
     WHERE user_id = _uid AND challenge_id = _ch.id::text AND completed = true
  ) INTO _already;

  IF _already THEN
    RETURN jsonb_build_object('success', false, 'message', 'Já completou este enigma');
  END IF;

  INSERT INTO public.user_challenges (user_id, challenge_id, completed, completed_at)
  VALUES (_uid, _ch.id::text, true, now());

  PERFORM public.award_xp_action('enigma_solved', _uid, _ch.xp_reward);

  RETURN jsonb_build_object('success', true, 'xp', _ch.xp_reward);
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_enigma_answer(uuid, text) TO authenticated;

-- 2) Policy de ownership ao criar oferta de troca de figurinha
DROP POLICY IF EXISTS "user owns offered sticker" ON public.sticker_trades;
CREATE POLICY "user owns offered sticker"
ON public.sticker_trades
FOR INSERT
TO authenticated
WITH CHECK (
  offerer_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.user_stickers
     WHERE user_id = auth.uid()
       AND sticker_id = offered_sticker_id
  )
);
