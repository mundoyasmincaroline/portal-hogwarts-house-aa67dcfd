-- ============================================================
-- RPC: process_duel_turn(_duel_id uuid, _spell_id uuid)
-- Executa um turno de duelo de forma totalmente server-side.
-- Assinatura da award_xp_action vigente: (_action TEXT, _user_id UUID, _xp INTEGER)
-- ============================================================

CREATE OR REPLACE FUNCTION public.process_duel_turn(
  _duel_id UUID,
  _spell_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid          UUID  := auth.uid();
  v_duel         RECORD;
  v_spell        RECORD;
  v_role         TEXT;   -- 'challenger' | 'opponent'
  v_opp_hp_col   TEXT;   -- coluna HP do oponente
  v_my_hp_col    TEXT;   -- coluna HP do jogador atual
  v_new_opp_hp   INT;
  v_new_my_hp    INT;
  v_next_turn    TEXT;
  v_winner       TEXT;
  v_turn_number  INT;
  v_is_damage    BOOLEAN;
BEGIN
  -- ── 1. Autenticação ──────────────────────────────────────
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- ── 2. Carregar e travar linha do duelo ──────────────────
  SELECT * INTO v_duel
  FROM public.duels
  WHERE id = _duel_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'duel_not_found';
  END IF;

  IF v_duel.status NOT IN ('active', 'ongoing', 'pending') THEN
    RAISE EXCEPTION 'duel_not_active';
  END IF;

  -- ── 3. Determinar papel do caller ────────────────────────
  IF v_duel.challenger_user_id = v_uid THEN
    v_role := 'challenger';
  ELSIF v_duel.opponent_user_id = v_uid THEN
    v_role := 'opponent';
  ELSE
    RAISE EXCEPTION 'not_a_participant';
  END IF;

  -- ── 4. Validar que é o turno do caller ───────────────────
  IF v_duel.current_turn <> v_role THEN
    RAISE EXCEPTION 'not_your_turn';
  END IF;

  -- ── 5. Carregar feitiço ──────────────────────────────────
  SELECT * INTO v_spell
  FROM public.spells
  WHERE id = _spell_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'spell_not_found';
  END IF;

  -- ── 6. Calcular efeito server-side ───────────────────────
  v_is_damage := (v_spell.category = 'damage' OR COALESCE(v_spell.base_damage, 0) > 0);

  IF v_role = 'challenger' THEN
    v_opp_hp_col := 'opponent_hp';
    v_my_hp_col  := 'challenger_hp';
    v_new_opp_hp := v_duel.opponent_hp;
    v_new_my_hp  := v_duel.challenger_hp;
  ELSE
    v_opp_hp_col := 'challenger_hp';
    v_my_hp_col  := 'opponent_hp';
    v_new_opp_hp := v_duel.challenger_hp;
    v_new_my_hp  := v_duel.opponent_hp;
  END IF;

  IF v_is_damage THEN
    -- Dano ao oponente
    v_new_opp_hp := GREATEST(0, v_new_opp_hp - COALESCE(v_spell.base_damage, 15));
  ELSE
    -- Feitiço de defesa / cura própria
    v_new_my_hp  := LEAST(100, v_new_my_hp + COALESCE(v_spell.base_defense, 10));
  END IF;

  -- ── 7. Determinar próximo turno e vencedor ───────────────
  v_next_turn := CASE WHEN v_role = 'challenger' THEN 'opponent' ELSE 'challenger' END;

  IF v_new_opp_hp <= 0 THEN
    v_winner := v_role;
  END IF;

  -- ── 8. Número do turno ───────────────────────────────────
  SELECT COALESCE(MAX(turn_number), 0) + 1
  INTO v_turn_number
  FROM public.duel_turns
  WHERE duel_id = _duel_id;

  -- ── 9. Registrar turno ───────────────────────────────────
  INSERT INTO public.duel_turns (
    duel_id, turn_number, actor, spell_id, spell_name,
    damage, hit, narrative
  ) VALUES (
    _duel_id,
    v_turn_number,
    v_role,
    _spell_id,
    v_spell.name,
    COALESCE(v_spell.base_damage, 0),
    TRUE,
    'Turno ' || v_turn_number || ': ' || v_spell.name || ' causou ' ||
      COALESCE(v_spell.base_damage, 0) || ' de dano.'
  );

  -- ── 10. Atualizar duelo ───────────────────────────────────
  IF v_winner IS NOT NULL THEN
    -- Jogo acabou
    UPDATE public.duels
    SET
      challenger_hp  = CASE WHEN v_role = 'challenger' THEN v_new_my_hp  ELSE v_new_opp_hp END,
      opponent_hp    = CASE WHEN v_role = 'opponent'   THEN v_new_my_hp  ELSE v_new_opp_hp END,
      current_turn   = v_next_turn,
      status         = 'completed',
      winner         = v_winner,
      finished_at    = now()
    WHERE id = _duel_id;

    -- XP para o vencedor (SECURITY DEFINER, passa _user_id explicitamente)
    PERFORM public.award_xp_action('duel_win', v_uid, 50);
  ELSE
    UPDATE public.duels
    SET
      challenger_hp = CASE WHEN v_role = 'challenger' THEN v_new_my_hp  ELSE v_new_opp_hp END,
      opponent_hp   = CASE WHEN v_role = 'opponent'   THEN v_new_my_hp  ELSE v_new_opp_hp END,
      current_turn  = v_next_turn
    WHERE id = _duel_id;
  END IF;

  -- ── 11. Retornar novo estado ─────────────────────────────
  RETURN jsonb_build_object(
    'duel_id',       _duel_id,
    'spell_cast',    v_spell.name,
    'damage_dealt',  COALESCE(v_spell.base_damage, 0),
    'challenger_hp', CASE WHEN v_role = 'challenger' THEN v_new_my_hp  ELSE v_new_opp_hp END,
    'opponent_hp',   CASE WHEN v_role = 'opponent'   THEN v_new_my_hp  ELSE v_new_opp_hp END,
    'current_turn',  v_next_turn,
    'status',        CASE WHEN v_winner IS NOT NULL THEN 'completed' ELSE 'active' END,
    'winner',        v_winner,
    'turn_number',   v_turn_number
  );
END;
$$;

-- Revogar acesso público e conceder apenas a usuários autenticados
REVOKE ALL ON FUNCTION public.process_duel_turn(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_duel_turn(UUID, UUID) TO authenticated;
