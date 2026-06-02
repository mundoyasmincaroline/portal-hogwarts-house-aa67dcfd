-- Streak Freeze
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS streak_freezes integer NOT NULL DEFAULT 0;

-- Drop antes de recriar (mudança de assinatura)
DROP FUNCTION IF EXISTS public.claim_rp_slot(uuid);

CREATE FUNCTION public.claim_rp_slot(p_character_id uuid)
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

    -- Marcos
    SELECT milestone, xp_reward, galeons_reward, label
      INTO v_milestone, v_m_xp, v_m_gal, v_m_label
      FROM public.rp_streak_milestones
     WHERE milestone = v_new_streak AND active = true
     LIMIT 1;

    IF v_milestone IS NOT NULL THEN
      v_xp_bonus := COALESCE(v_m_xp,0) + 10;
      v_gal_bonus := COALESCE(v_m_gal,0) + 2;
      v_label := COALESCE(v_m_label, 'Marco de ' || v_new_streak || ' dias!');
    ELSIF v_used_freeze THEN
      v_label := 'Presença diária (salva!)';
    END IF;

    INSERT INTO public.rp_streak_rewards
      (user_id, character_id, claim_date, streak_day, milestone, xp_bonus, galeons_bonus, label)
    VALUES (v_user, p_character_id, v_today, v_new_streak, v_milestone, v_xp_bonus, v_gal_bonus, v_label)
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

-- Daily Missions
CREATE TABLE IF NOT EXISTS public.daily_missions_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '✨',
  action_type text NOT NULL,
  goal integer NOT NULL DEFAULT 1,
  xp_reward integer NOT NULL DEFAULT 25,
  galeons_reward integer NOT NULL DEFAULT 5,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.daily_missions_catalog TO authenticated;
GRANT ALL ON public.daily_missions_catalog TO service_role;
ALTER TABLE public.daily_missions_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated view missions catalog" ON public.daily_missions_catalog;
CREATE POLICY "Authenticated view missions catalog"
  ON public.daily_missions_catalog FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins manage missions catalog" ON public.daily_missions_catalog;
CREATE POLICY "Admins manage missions catalog"
  ON public.daily_missions_catalog FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.user_daily_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mission_id uuid NOT NULL REFERENCES public.daily_missions_catalog(id) ON DELETE CASCADE,
  assigned_date date NOT NULL DEFAULT ((now() AT TIME ZONE 'America/Sao_Paulo')::date),
  progress integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  xp_awarded integer DEFAULT 0,
  galeons_awarded integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, mission_id, assigned_date)
);
CREATE INDEX IF NOT EXISTS idx_user_daily_missions_today
  ON public.user_daily_missions(user_id, assigned_date);
GRANT SELECT, INSERT, UPDATE ON public.user_daily_missions TO authenticated;
GRANT ALL ON public.user_daily_missions TO service_role;
ALTER TABLE public.user_daily_missions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own daily missions" ON public.user_daily_missions;
CREATE POLICY "Users view own daily missions"
  ON public.user_daily_missions FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users update own daily missions" ON public.user_daily_missions;
CREATE POLICY "Users update own daily missions"
  ON public.user_daily_missions FOR UPDATE TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "System inserts daily missions" ON public.user_daily_missions;
CREATE POLICY "System inserts daily missions"
  ON public.user_daily_missions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.assign_daily_missions()
RETURNS SETOF public.user_daily_missions
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_existing int;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT COUNT(*) INTO v_existing FROM public.user_daily_missions
   WHERE user_id = v_user AND assigned_date = v_today;
  IF v_existing = 0 THEN
    INSERT INTO public.user_daily_missions (user_id, mission_id, assigned_date)
    SELECT v_user, c.id, v_today
      FROM public.daily_missions_catalog c WHERE c.active = true
     ORDER BY random() LIMIT 3;
  END IF;
  RETURN QUERY SELECT * FROM public.user_daily_missions
   WHERE user_id = v_user AND assigned_date = v_today;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_daily_mission(p_mission_id uuid)
RETURNS public.user_daily_missions
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_um public.user_daily_missions;
  v_cat public.daily_missions_catalog;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO v_um FROM public.user_daily_missions
   WHERE user_id = v_user AND mission_id = p_mission_id AND assigned_date = v_today
   FOR UPDATE;
  IF v_um.id IS NULL THEN RAISE EXCEPTION 'Missão não atribuída para hoje'; END IF;
  IF v_um.completed THEN RETURN v_um; END IF;

  SELECT * INTO v_cat FROM public.daily_missions_catalog WHERE id = p_mission_id;

  UPDATE public.user_daily_missions
     SET completed = true, completed_at = now(), progress = v_cat.goal,
         xp_awarded = v_cat.xp_reward, galeons_awarded = v_cat.galeons_reward
   WHERE id = v_um.id RETURNING * INTO v_um;

  UPDATE public.profiles
     SET xp = COALESCE(xp,0) + v_cat.xp_reward,
         galeons = COALESCE(galeons,0) + v_cat.galeons_reward
   WHERE user_id = v_user;

  INSERT INTO public.currency_ledger (user_id, currency_type, amount, transaction_type, description)
  VALUES (v_user, 'galeons', v_cat.galeons_reward, 'daily_mission', v_cat.title);

  INSERT INTO public.notifications (user_id, title, message)
  VALUES (v_user, '✅ Missão concluída!',
          v_cat.title || ' (+' || v_cat.xp_reward || ' XP, +' || v_cat.galeons_reward || ' G)');

  RETURN v_um;
END;
$$;

-- Seed
INSERT INTO public.daily_missions_catalog (title, description, icon, action_type, goal, xp_reward, galeons_reward)
SELECT t.title, t.description, t.icon, t.action_type, t.goal, t.xp_reward, t.galeons_reward
  FROM (VALUES
  ('Faça check-in no RP', 'Marque presença diária no portal.', '⚡', 'rp_checkin', 1, 30, 5),
  ('Envie 3 mensagens no chat', 'Converse com colegas em qualquer canal.', '💬', 'send_messages', 3, 25, 4),
  ('Curta 5 posts do Feed', 'Espalhe magia reagindo no Feed.', '✨', 'like_posts', 5, 20, 3),
  ('Visite a Loja de Gringotes', 'Dê uma olhada nos itens em destaque.', '🪙', 'visit_store', 1, 15, 2),
  ('Veja seu histórico de RP', 'Acompanhe sua jornada e sequência.', '📜', 'view_rp_history', 1, 15, 2),
  ('Faça 1 publicação no Feed', 'Compartilhe algo com a comunidade.', '📝', 'create_post', 1, 35, 6),
  ('Envie um privado para um amigo', 'Mantenha laços vivos.', '🦉', 'send_dm', 1, 25, 4)
) AS t(title, description, icon, action_type, goal, xp_reward, galeons_reward)
WHERE NOT EXISTS (SELECT 1 FROM public.daily_missions_catalog);