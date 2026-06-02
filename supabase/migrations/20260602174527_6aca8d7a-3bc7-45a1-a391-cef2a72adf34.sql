DROP FUNCTION IF EXISTS public.claim_rp_slot(uuid);

CREATE TABLE IF NOT EXISTS public.rp_streak_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  days_required INTEGER NOT NULL UNIQUE,
  xp_bonus INTEGER NOT NULL DEFAULT 0,
  galeons_bonus INTEGER NOT NULL DEFAULT 0,
  label TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.rp_streak_milestones TO authenticated;
GRANT ALL ON public.rp_streak_milestones TO service_role;

ALTER TABLE public.rp_streak_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view milestones" ON public.rp_streak_milestones;
CREATE POLICY "Authenticated can view milestones"
ON public.rp_streak_milestones FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage milestones" ON public.rp_streak_milestones;
CREATE POLICY "Admins manage milestones"
ON public.rp_streak_milestones FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.rp_streak_milestones (days_required, xp_bonus, galeons_bonus, label) VALUES
  (3, 25, 5, 'Sequência inicial'),
  (7, 80, 25, 'Semana mágica'),
  (14, 200, 60, 'Quinzena lendária'),
  (30, 500, 150, 'Lua cheia mensal · MARCO!')
ON CONFLICT (days_required) DO NOTHING;

CREATE OR REPLACE FUNCTION public.claim_rp_slot(p_character_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_today DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_yesterday DATE := v_today - 1;
  v_last_date DATE;
  v_current INTEGER;
  v_new_streak INTEGER;
  v_base_xp INTEGER := 10;
  v_base_gal INTEGER := 2;
  v_bonus_xp INTEGER := 0;
  v_bonus_gal INTEGER := 0;
  v_bonus_label TEXT := NULL;
  v_total_xp INTEGER;
  v_total_gal INTEGER;
  v_milestone RECORD;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF NOT EXISTS (SELECT 1 FROM characters WHERE id = p_character_id AND user_id = v_user_id) THEN
    RAISE EXCEPTION 'character not owned by user';
  END IF;

  SELECT rp_last_claim_date, COALESCE(rp_streak_current,0)
    INTO v_last_date, v_current
  FROM profiles WHERE user_id = v_user_id;

  IF v_last_date = v_today THEN v_new_streak := v_current;
  ELSIF v_last_date = v_yesterday THEN v_new_streak := v_current + 1;
  ELSE v_new_streak := 1;
  END IF;

  SELECT * INTO v_milestone FROM rp_streak_milestones
  WHERE active = TRUE AND days_required = v_new_streak LIMIT 1;

  IF v_milestone.id IS NOT NULL THEN
    v_bonus_xp := v_milestone.xp_bonus;
    v_bonus_gal := v_milestone.galeons_bonus;
    v_bonus_label := v_milestone.label;
  END IF;

  v_total_xp := v_base_xp + v_bonus_xp;
  v_total_gal := v_base_gal + v_bonus_gal;

  INSERT INTO rp_daily_claims (user_id, character_id, claim_date, xp_earned)
  VALUES (v_user_id, p_character_id, v_today, v_total_xp)
  ON CONFLICT (user_id, claim_date) DO UPDATE
  SET character_id = EXCLUDED.character_id, xp_earned = rp_daily_claims.xp_earned;

  UPDATE profiles SET
    active_character_id = p_character_id,
    rp_streak_current = v_new_streak,
    rp_streak_best = GREATEST(COALESCE(rp_streak_best,0), v_new_streak),
    rp_last_claim_date = v_today,
    xp = COALESCE(xp,0) + CASE WHEN v_last_date = v_today THEN 0 ELSE v_total_xp END,
    galeons = COALESCE(galeons,0) + CASE WHEN v_last_date = v_today THEN 0 ELSE v_total_gal END
  WHERE user_id = v_user_id;

  IF v_last_date <> v_today OR v_last_date IS NULL THEN
    INSERT INTO rp_streak_rewards (user_id, claim_date, streak_day, xp_bonus, galeons_bonus, label)
    VALUES (v_user_id, v_today, v_new_streak, v_bonus_xp, v_bonus_gal, COALESCE(v_bonus_label, 'Check-in diário'))
    ON CONFLICT (user_id, claim_date) DO NOTHING;

    IF v_bonus_xp > 0 THEN
      INSERT INTO currency_ledger (user_id, amount, currency_type, transaction_type, description)
      VALUES (v_user_id, v_bonus_xp, 'xp', 'streak_bonus', COALESCE(v_bonus_label,'') || ' (Dia '||v_new_streak||')');
    END IF;
    IF v_bonus_gal > 0 THEN
      INSERT INTO currency_ledger (user_id, amount, currency_type, transaction_type, description)
      VALUES (v_user_id, v_bonus_gal, 'galeons', 'streak_bonus', COALESCE(v_bonus_label,'') || ' (Dia '||v_new_streak||')');
    END IF;
  END IF;

  RETURN jsonb_build_object('streak', v_new_streak, 'bonus_xp', v_bonus_xp, 'bonus_galeons', v_bonus_gal, 'label', v_bonus_label);
END;
$$;