
-- 1. GRANTs e novas políticas
GRANT SELECT, INSERT, UPDATE ON public.user_battle_pass_progress TO authenticated;
GRANT ALL ON public.user_battle_pass_progress TO service_role;
GRANT SELECT ON public.battle_passes TO authenticated;
GRANT SELECT ON public.battle_pass_rewards TO authenticated;
GRANT ALL ON public.battle_passes TO service_role;
GRANT ALL ON public.battle_pass_rewards TO service_role;

DROP POLICY IF EXISTS "Users upsert own bp progress" ON public.user_battle_pass_progress;
CREATE POLICY "Users upsert own bp progress"
  ON public.user_battle_pass_progress
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own bp progress" ON public.user_battle_pass_progress;
CREATE POLICY "Users update own bp progress"
  ON public.user_battle_pass_progress
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage battle_passes" ON public.battle_passes;
CREATE POLICY "Admins manage battle_passes"
  ON public.battle_passes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage battle_pass_rewards" ON public.battle_pass_rewards;
CREATE POLICY "Admins manage battle_pass_rewards"
  ON public.battle_pass_rewards FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. RPC: claim_battle_pass_reward
CREATE OR REPLACE FUNCTION public.claim_battle_pass_reward(
  p_pass_id uuid,
  p_reward_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_reward record;
  v_pass record;
  v_progress record;
  v_is_vip boolean;
  v_xp integer := 0;
  v_gal integer := 0;
  v_claimed jsonb;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;

  SELECT * INTO v_pass FROM public.battle_passes WHERE id = p_pass_id AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Temporada inválida ou encerrada'; END IF;

  SELECT * INTO v_reward FROM public.battle_pass_rewards WHERE id = p_reward_id AND pass_id = p_pass_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Recompensa não encontrada'; END IF;

  -- Garante a linha de progresso
  INSERT INTO public.user_battle_pass_progress (user_id, pass_id, current_level, current_xp)
  VALUES (v_user, p_pass_id, 1, 0)
  ON CONFLICT (user_id, pass_id) DO NOTHING;

  SELECT * INTO v_progress FROM public.user_battle_pass_progress WHERE user_id = v_user AND pass_id = p_pass_id;

  IF v_progress.current_level < v_reward.level_required THEN
    RAISE EXCEPTION 'Você ainda não atingiu o nível % deste passe', v_reward.level_required;
  END IF;

  -- Premium gate
  IF v_reward.is_premium THEN
    SELECT EXISTS (
      SELECT 1 FROM public.vip_subscriptions
      WHERE user_id = v_user AND status = 'active' AND expires_at > now()
    ) INTO v_is_vip;
    IF NOT v_is_vip THEN
      RAISE EXCEPTION 'Esta recompensa exige o Passe Premium ativo';
    END IF;
  END IF;

  -- Evita duplicata
  IF v_progress.claimed_rewards ? p_reward_id::text THEN
    RAISE EXCEPTION 'Recompensa já reivindicada';
  END IF;

  -- Aplica recompensa
  IF v_reward.reward_type = 'xp' THEN
    v_xp := COALESCE((v_reward.reward_value->>'amount')::int, 0);
    PERFORM public.award_xp_action('battle_pass', v_user, v_xp);
  ELSIF v_reward.reward_type = 'galeons' THEN
    v_gal := COALESCE((v_reward.reward_value->>'amount')::int, 0);
    PERFORM public.award_galeons(v_user, v_gal, 'Battle Pass nível ' || v_reward.level_required);
  ELSIF v_reward.reward_type = 'badge' THEN
    INSERT INTO public.user_badges (user_id, badge_id)
    SELECT v_user, b.id FROM public.badges b WHERE b.name = (v_reward.reward_value->>'badge_name')
    ON CONFLICT DO NOTHING;
  ELSIF v_reward.reward_type = 'streak_freeze' THEN
    UPDATE public.profiles
      SET streak_freezes = LEAST(3, COALESCE(streak_freezes,0) + COALESCE((v_reward.reward_value->>'amount')::int,1))
      WHERE user_id = v_user;
  END IF;

  -- Marca como reivindicada
  v_claimed := COALESCE(v_progress.claimed_rewards, '[]'::jsonb) || jsonb_build_array(p_reward_id::text);
  UPDATE public.user_battle_pass_progress
    SET claimed_rewards = v_claimed, updated_at = now()
    WHERE user_id = v_user AND pass_id = p_pass_id;

  -- Ledger
  IF v_xp > 0 THEN
    INSERT INTO public.currency_ledger (user_id, currency_type, amount, transaction_type, description)
    VALUES (v_user, 'xp', v_xp, 'credit', 'Battle Pass: nível ' || v_reward.level_required);
  END IF;
  IF v_gal > 0 THEN
    INSERT INTO public.currency_ledger (user_id, currency_type, amount, transaction_type, description)
    VALUES (v_user, 'galeon', v_gal, 'credit', 'Battle Pass: nível ' || v_reward.level_required);
  END IF;

  RETURN jsonb_build_object('ok', true, 'xp', v_xp, 'galeons', v_gal, 'type', v_reward.reward_type);
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_battle_pass_reward(uuid, uuid) TO authenticated;

-- 3. Sync trigger: nivel do perfil -> nivel do passe ativo
CREATE OR REPLACE FUNCTION public.sync_active_battle_pass()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pass_id uuid;
BEGIN
  SELECT id INTO v_pass_id FROM public.battle_passes
    WHERE active = true AND now()::date BETWEEN start_date AND end_date
    LIMIT 1;
  IF v_pass_id IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.user_battle_pass_progress (user_id, pass_id, current_level, current_xp)
  VALUES (NEW.user_id, v_pass_id, COALESCE(NEW.level,1), COALESCE(NEW.xp,0))
  ON CONFLICT (user_id, pass_id)
  DO UPDATE SET
    current_level = GREATEST(public.user_battle_pass_progress.current_level, COALESCE(NEW.level,1)),
    current_xp = COALESCE(NEW.xp,0),
    updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_battle_pass ON public.profiles;
CREATE TRIGGER trg_sync_battle_pass
  AFTER UPDATE OF xp, level ON public.profiles
  FOR EACH ROW
  WHEN (OLD.xp IS DISTINCT FROM NEW.xp OR OLD.level IS DISTINCT FROM NEW.level)
  EXECUTE FUNCTION public.sync_active_battle_pass();

-- 4. Seed: 15 níveis x 2 trilhas para a temporada ativa
DO $$
DECLARE
  v_pass_id uuid;
  v_lvl int;
BEGIN
  SELECT id INTO v_pass_id FROM public.battle_passes WHERE active = true ORDER BY start_date DESC LIMIT 1;
  IF v_pass_id IS NULL THEN RETURN; END IF;

  -- só semeia se ainda não houver recompensas
  IF EXISTS (SELECT 1 FROM public.battle_pass_rewards WHERE pass_id = v_pass_id) THEN RETURN; END IF;

  FOR v_lvl IN 1..15 LOOP
    -- Trilha gratuita
    INSERT INTO public.battle_pass_rewards (pass_id, level_required, is_premium, reward_type, reward_value)
    VALUES (v_pass_id, v_lvl, false,
      CASE WHEN v_lvl % 5 = 0 THEN 'streak_freeze'
           WHEN v_lvl % 2 = 0 THEN 'galeons'
           ELSE 'xp' END,
      CASE WHEN v_lvl % 5 = 0 THEN jsonb_build_object('amount', 1)
           WHEN v_lvl % 2 = 0 THEN jsonb_build_object('amount', v_lvl * 10)
           ELSE jsonb_build_object('amount', v_lvl * 25) END);

    -- Trilha premium (sempre mais generosa)
    INSERT INTO public.battle_pass_rewards (pass_id, level_required, is_premium, reward_type, reward_value)
    VALUES (v_pass_id, v_lvl, true,
      CASE WHEN v_lvl = 15 THEN 'badge'
           WHEN v_lvl % 3 = 0 THEN 'galeons'
           ELSE 'xp' END,
      CASE WHEN v_lvl = 15 THEN jsonb_build_object('badge_name', 'Pacto Mágico Sazonal')
           WHEN v_lvl % 3 = 0 THEN jsonb_build_object('amount', v_lvl * 30)
           ELSE jsonb_build_object('amount', v_lvl * 60) END);
  END LOOP;
END$$;
