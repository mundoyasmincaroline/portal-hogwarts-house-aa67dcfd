
-- Fix claim_rp_slot: rp_streak_milestones columns are days_required/xp_bonus/galeons_bonus;
-- rp_streak_rewards has no character_id column.
CREATE OR REPLACE FUNCTION public.claim_rp_slot(p_character_id uuid)
RETURNS public.rp_daily_claims
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_owns boolean;
  v_claim public.rp_daily_claims;
  v_existing public.rp_daily_claims;
  v_last_date date;
  v_current int;
  v_best int;
  v_new_streak int;
  v_is_new boolean := false;
  v_freezes int;
  v_used_freeze boolean := false;
  v_milestone int := NULL;
  v_xp_bonus int := 10;
  v_gal_bonus int := 2;
  v_label text := 'Presença diária';
  v_m_xp int;
  v_m_gal int;
  v_m_label text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Você precisa estar autenticado.'; END IF;

  SELECT EXISTS (SELECT 1 FROM public.characters WHERE id = p_character_id AND user_id = v_user)
    INTO v_owns;
  IF NOT v_owns THEN RAISE EXCEPTION 'Personagem não pertence a você.'; END IF;

  SELECT * INTO v_existing FROM public.rp_daily_claims
   WHERE user_id = v_user AND claim_date = v_today;
  IF v_existing.id IS NULL THEN v_is_new := true; END IF;

  INSERT INTO public.rp_daily_claims (user_id, character_id, claim_date)
  VALUES (v_user, p_character_id, v_today)
  ON CONFLICT (user_id, claim_date) DO UPDATE SET last_active_at = now()
  RETURNING * INTO v_claim;

  UPDATE public.profiles SET active_character_id = p_character_id WHERE user_id = v_user;

  IF v_is_new THEN
    SELECT rp_last_claim_date, rp_streak_current, rp_streak_best, streak_freezes
      INTO v_last_date, v_current, v_best, v_freezes
      FROM public.profiles WHERE user_id = v_user;
    v_current := COALESCE(v_current,0);
    v_best := COALESCE(v_best,0);
    v_freezes := COALESCE(v_freezes,0);

    IF v_last_date IS NULL THEN
      v_new_streak := 1;
    ELSIF v_last_date = v_today - INTERVAL '1 day' THEN
      v_new_streak := v_current + 1;
    ELSIF v_last_date = v_today - INTERVAL '2 day' AND v_freezes > 0 THEN
      v_new_streak := v_current + 1;
      v_used_freeze := true;
      UPDATE public.profiles SET streak_freezes = streak_freezes - 1 WHERE user_id = v_user;
      INSERT INTO public.notifications (user_id, title, message)
      VALUES (v_user, '⏳ Cápsula de Tempo usada!',
              'Sua sequência foi salva. Restam ' || (v_freezes - 1) || ' cápsulas.');
    ELSE
      v_new_streak := 1;
    END IF;

    UPDATE public.profiles
       SET rp_streak_current = v_new_streak,
           rp_streak_best = GREATEST(v_best, v_new_streak),
           rp_last_claim_date = v_today
     WHERE user_id = v_user;

    -- Marcos (colunas corretas: days_required / xp_bonus / galeons_bonus)
    SELECT days_required, xp_bonus, galeons_bonus, label
      INTO v_milestone, v_m_xp, v_m_gal, v_m_label
      FROM public.rp_streak_milestones
     WHERE days_required = v_new_streak AND active = true
     LIMIT 1;

    IF v_milestone IS NOT NULL THEN
      v_xp_bonus := COALESCE(v_m_xp,0) + 10;
      v_gal_bonus := COALESCE(v_m_gal,0) + 2;
      v_label := COALESCE(v_m_label, 'Marco de ' || v_new_streak || ' dias!');
    ELSIF v_used_freeze THEN
      v_label := 'Presença diária (salva!)';
    END IF;

    INSERT INTO public.rp_streak_rewards
      (user_id, claim_date, streak_day, milestone, xp_bonus, galeons_bonus, label)
    VALUES (v_user, v_today, v_new_streak, v_milestone, v_xp_bonus, v_gal_bonus, v_label)
    ON CONFLICT DO NOTHING;

    UPDATE public.profiles
       SET xp = COALESCE(xp,0) + v_xp_bonus,
           galeons = COALESCE(galeons,0) + v_gal_bonus
     WHERE user_id = v_user;

    INSERT INTO public.currency_ledger (user_id, currency_type, amount, transaction_type, description)
    VALUES (v_user, 'galeons', v_gal_bonus, 'streak_reward', v_label);
  END IF;

  RETURN v_claim;
END;
$function$;

-- Restaurar Yasmin Caroline (mundoyasmincaroline@gmail.com) como admin
INSERT INTO public.user_roles (user_id, role)
SELECT '4a798ef3-70cb-452e-8aae-82f080441529'::uuid, 'admin'::public.app_role
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = '4a798ef3-70cb-452e-8aae-82f080441529'::uuid AND role = 'admin'
);

UPDATE public.profiles
   SET approved = true
 WHERE user_id = '4a798ef3-70cb-452e-8aae-82f080441529'::uuid;
