
CREATE OR REPLACE FUNCTION public.complete_canon_lesson(
  p_lesson_id uuid,
  p_character_id uuid,
  p_mastery_score integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_lesson record;
  v_existing uuid;
  v_xp integer;
  v_gal integer;
  v_mastery integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- Confirma que o personagem pertence ao usuário
  IF NOT EXISTS (SELECT 1 FROM public.characters WHERE id = p_character_id AND user_id = v_user_id) THEN
    RAISE EXCEPTION 'Personagem inválido';
  END IF;

  SELECT * INTO v_lesson FROM public.professor_lessons WHERE id = p_lesson_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aula não encontrada';
  END IF;

  IF v_lesson.status <> 'open' THEN
    RAISE EXCEPTION 'Aula encerrada';
  END IF;

  -- Verifica presença duplicada
  SELECT id INTO v_existing
  FROM public.lesson_attendance
  WHERE lesson_id = p_lesson_id AND character_id = p_character_id
  LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RAISE EXCEPTION 'Você já assistiu esta aula com este personagem';
  END IF;

  v_mastery := GREATEST(1, LEAST(5, COALESCE(p_mastery_score, 1)));
  v_xp := COALESCE(v_lesson.xp_reward, 50) * v_mastery;
  v_gal := COALESCE(v_lesson.galeons_reward, 5) * v_mastery;

  -- Registra presença
  INSERT INTO public.lesson_attendance (lesson_id, user_id, character_id, spell_learned)
  VALUES (p_lesson_id, v_user_id, p_character_id, v_lesson.spell_id IS NOT NULL);

  -- Aprende ou aumenta maestria do feitiço
  IF v_lesson.spell_id IS NOT NULL THEN
    INSERT INTO public.user_spells (user_id, spell_id, mastery_level)
    VALUES (v_user_id, v_lesson.spell_id, v_mastery)
    ON CONFLICT (user_id, spell_id)
    DO UPDATE SET mastery_level = LEAST(5, public.user_spells.mastery_level + 1);

    -- Também grava em character_spells para vincular ao personagem
    INSERT INTO public.character_spells (character_id, spell_id, learned_from, mastery, times_cast)
    VALUES (p_character_id, v_lesson.spell_id, 'lesson:' || v_lesson.title, v_mastery, 0)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Recompensas
  PERFORM public.award_xp_action('canon_lesson', v_user_id, v_xp);
  PERFORM public.award_galeons(v_user_id, v_gal, 'Aula de ' || v_lesson.title);

  INSERT INTO public.currency_ledger (user_id, currency_type, amount, transaction_type, description)
  VALUES
    (v_user_id, 'xp', v_xp, 'credit', 'Aula canon: ' || v_lesson.title),
    (v_user_id, 'galeon', v_gal, 'credit', 'Aula canon: ' || v_lesson.title);

  RETURN jsonb_build_object(
    'ok', true,
    'xp_awarded', v_xp,
    'galeons_awarded', v_gal,
    'mastery', v_mastery,
    'spell_id', v_lesson.spell_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_canon_lesson(uuid, uuid, integer) TO authenticated;
