
-- 1. Streak columns on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS rp_streak_current integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rp_streak_best integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rp_last_claim_date date;

-- 2. Streak reward history table
CREATE TABLE IF NOT EXISTS public.rp_streak_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  claim_date date NOT NULL,
  streak_day integer NOT NULL,
  milestone integer,
  xp_bonus integer NOT NULL DEFAULT 0,
  galeons_bonus integer NOT NULL DEFAULT 0,
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS rp_streak_rewards_user_date_unique
  ON public.rp_streak_rewards(user_id, claim_date);
CREATE INDEX IF NOT EXISTS rp_streak_rewards_user_idx
  ON public.rp_streak_rewards(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rp_streak_rewards TO authenticated;
GRANT ALL ON public.rp_streak_rewards TO service_role;

ALTER TABLE public.rp_streak_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own streak rewards"
  ON public.rp_streak_rewards FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage streak rewards"
  ON public.rp_streak_rewards FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Rewrite claim_rp_slot to include streak logic + rewards
CREATE OR REPLACE FUNCTION public.claim_rp_slot(p_character_id uuid)
RETURNS rp_daily_claims
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
  v_milestone int := NULL;
  v_xp_bonus int := 0;
  v_gal_bonus int := 0;
  v_label text := NULL;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Você precisa estar autenticado.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.characters
    WHERE id = p_character_id AND user_id = v_user
  ) INTO v_owns;
  IF NOT v_owns THEN
    RAISE EXCEPTION 'Personagem não pertence a você.';
  END IF;

  SELECT * INTO v_existing FROM public.rp_daily_claims
   WHERE user_id = v_user AND claim_date = v_today;

  IF v_existing.id IS NULL THEN
    v_is_new := true;
  END IF;

  -- Insert or update claim
  INSERT INTO public.rp_daily_claims (user_id, character_id, claim_date)
  VALUES (v_user, p_character_id, v_today)
  ON CONFLICT (user_id, claim_date) DO UPDATE
    SET last_active_at = now()
  RETURNING * INTO v_claim;

  UPDATE public.profiles
     SET active_character_id = p_character_id
   WHERE user_id = v_user;

  -- Streak logic only on first claim of the day
  IF v_is_new THEN
    SELECT rp_last_claim_date, rp_streak_current, rp_streak_best
      INTO v_last_date, v_current, v_best
      FROM public.profiles WHERE user_id = v_user;

    v_current := COALESCE(v_current, 0);
    v_best := COALESCE(v_best, 0);

    IF v_last_date IS NULL OR v_last_date < v_today - INTERVAL '1 day' THEN
      v_new_streak := 1;
    ELSIF v_last_date = v_today - INTERVAL '1 day' THEN
      v_new_streak := v_current + 1;
    ELSE
      v_new_streak := GREATEST(v_current, 1);
    END IF;

    UPDATE public.profiles
       SET rp_streak_current = v_new_streak,
           rp_streak_best = GREATEST(v_best, v_new_streak),
           rp_last_claim_date = v_today
     WHERE user_id = v_user;

    -- Daily base reward
    v_xp_bonus := 10;
    v_gal_bonus := 2;
    v_label := 'Presença diária';

    -- Milestone bonuses
    IF v_new_streak % 30 = 0 THEN
      v_milestone := 30; v_xp_bonus := v_xp_bonus + 500; v_gal_bonus := v_gal_bonus + 150;
      v_label := 'Lua cheia mensal (30 dias)';
    ELSIF v_new_streak % 14 = 0 THEN
      v_milestone := 14; v_xp_bonus := v_xp_bonus + 200; v_gal_bonus := v_gal_bonus + 60;
      v_label := 'Quinzena mágica (14 dias)';
    ELSIF v_new_streak % 7 = 0 THEN
      v_milestone := 7; v_xp_bonus := v_xp_bonus + 80; v_gal_bonus := v_gal_bonus + 25;
      v_label := 'Semana completa (7 dias)';
    ELSIF v_new_streak = 3 THEN
      v_milestone := 3; v_xp_bonus := v_xp_bonus + 25; v_gal_bonus := v_gal_bonus + 5;
      v_label := 'Trio de constância (3 dias)';
    END IF;

    -- Record reward
    INSERT INTO public.rp_streak_rewards(user_id, claim_date, streak_day, milestone, xp_bonus, galeons_bonus, label)
    VALUES (v_user, v_today, v_new_streak, v_milestone, v_xp_bonus, v_gal_bonus, v_label)
    ON CONFLICT (user_id, claim_date) DO NOTHING;

    -- Apply XP/galeons
    UPDATE public.profiles
       SET xp = COALESCE(xp,0) + v_xp_bonus,
           galeons = COALESCE(galeons,0) + v_gal_bonus
     WHERE user_id = v_user;

    -- Track xp_earned on claim
    UPDATE public.rp_daily_claims
       SET xp_earned = COALESCE(xp_earned,0) + v_xp_bonus
     WHERE id = v_claim.id
     RETURNING * INTO v_claim;
  END IF;

  RETURN v_claim;
END;
$function$;
