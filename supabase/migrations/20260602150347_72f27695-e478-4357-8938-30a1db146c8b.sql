
CREATE OR REPLACE FUNCTION public.process_duel_turn(_duel_id UUID, _spell_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_duel RECORD; v_spell RECORD;
  v_role TEXT; v_new_opp_hp INT; v_new_my_hp INT;
  v_next_turn TEXT; v_winner TEXT; v_turn_number INT; v_is_damage BOOLEAN;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO v_duel FROM public.duels WHERE id = _duel_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'duel_not_found'; END IF;
  IF v_duel.status NOT IN ('active','ongoing','pending') THEN RAISE EXCEPTION 'duel_not_active'; END IF;
  IF v_duel.challenger_user_id = v_uid THEN v_role := 'challenger';
  ELSIF v_duel.opponent_user_id = v_uid THEN v_role := 'opponent';
  ELSE RAISE EXCEPTION 'not_a_participant'; END IF;
  IF v_duel.current_turn <> v_role THEN RAISE EXCEPTION 'not_your_turn'; END IF;
  SELECT * INTO v_spell FROM public.spells WHERE id = _spell_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'spell_not_found'; END IF;
  v_is_damage := (v_spell.category = 'damage' OR COALESCE(v_spell.base_damage,0) > 0);
  IF v_role = 'challenger' THEN
    v_new_opp_hp := v_duel.opponent_hp; v_new_my_hp := v_duel.challenger_hp;
  ELSE
    v_new_opp_hp := v_duel.challenger_hp; v_new_my_hp := v_duel.opponent_hp;
  END IF;
  IF v_is_damage THEN
    v_new_opp_hp := GREATEST(0, v_new_opp_hp - COALESCE(v_spell.base_damage, 15));
  ELSE
    v_new_my_hp := LEAST(100, v_new_my_hp + COALESCE(v_spell.base_defense, 10));
  END IF;
  v_next_turn := CASE WHEN v_role='challenger' THEN 'opponent' ELSE 'challenger' END;
  IF v_new_opp_hp <= 0 THEN v_winner := v_role; END IF;
  SELECT COALESCE(MAX(turn_number),0)+1 INTO v_turn_number FROM public.duel_turns WHERE duel_id = _duel_id;
  INSERT INTO public.duel_turns(duel_id,turn_number,actor,spell_id,spell_name,damage,hit,narrative)
  VALUES (_duel_id, v_turn_number, v_role, _spell_id, v_spell.name,
          COALESCE(v_spell.base_damage,0), TRUE,
          'Turno '||v_turn_number||': '||v_spell.name||' causou '||COALESCE(v_spell.base_damage,0)||' de dano.');
  IF v_winner IS NOT NULL THEN
    UPDATE public.duels SET
      challenger_hp = CASE WHEN v_role='challenger' THEN v_new_my_hp ELSE v_new_opp_hp END,
      opponent_hp   = CASE WHEN v_role='opponent'   THEN v_new_my_hp ELSE v_new_opp_hp END,
      current_turn = v_next_turn, status='completed', winner=v_winner, finished_at=now()
    WHERE id = _duel_id;
    PERFORM public.award_xp_action('duel_win', v_uid, 50);
  ELSE
    UPDATE public.duels SET
      challenger_hp = CASE WHEN v_role='challenger' THEN v_new_my_hp ELSE v_new_opp_hp END,
      opponent_hp   = CASE WHEN v_role='opponent'   THEN v_new_my_hp ELSE v_new_opp_hp END,
      current_turn = v_next_turn
    WHERE id = _duel_id;
  END IF;
  RETURN jsonb_build_object(
    'challenger_hp', CASE WHEN v_role='challenger' THEN v_new_my_hp ELSE v_new_opp_hp END,
    'opponent_hp',   CASE WHEN v_role='opponent'   THEN v_new_my_hp ELSE v_new_opp_hp END,
    'current_turn', v_next_turn,
    'status', CASE WHEN v_winner IS NOT NULL THEN 'completed' ELSE 'active' END,
    'winner', v_winner
  );
END;
$$;

REVOKE ALL ON FUNCTION public.process_duel_turn(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_duel_turn(UUID, UUID) TO authenticated;
