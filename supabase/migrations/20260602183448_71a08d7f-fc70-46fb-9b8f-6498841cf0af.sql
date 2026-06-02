
-- ============ CLUBES ============
CREATE TABLE public.clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  emblem text,
  color text DEFAULT '#c9a84c',
  meeting_day text,
  founded_by text,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.clubs TO anon, authenticated;
GRANT ALL ON public.clubs TO service_role;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clubes visíveis a todos" ON public.clubs FOR SELECT USING (true);
CREATE POLICY "Admin gerencia clubes" ON public.clubs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.club_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  weekly_xp int NOT NULL DEFAULT 0,
  UNIQUE (club_id, user_id)
);

CREATE INDEX idx_club_members_user ON public.club_members(user_id);
CREATE INDEX idx_club_members_club ON public.club_members(club_id);

GRANT SELECT ON public.club_members TO anon, authenticated;
GRANT INSERT, DELETE ON public.club_members TO authenticated;
GRANT ALL ON public.club_members TO service_role;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros visíveis a todos" ON public.club_members FOR SELECT USING (true);
CREATE POLICY "Usuário entra como ele mesmo" ON public.club_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuário sai dos próprios clubes" ON public.club_members FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============ MENTORIA ============
CREATE TABLE public.mentorships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL,
  apprentice_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | active | ended
  started_at timestamptz,
  ended_at timestamptz,
  apprentice_levels_gained int NOT NULL DEFAULT 0,
  total_bonus_xp int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mentor_id, apprentice_id)
);

CREATE INDEX idx_mentorships_mentor ON public.mentorships(mentor_id);
CREATE INDEX idx_mentorships_apprentice ON public.mentorships(apprentice_id);

GRANT SELECT ON public.mentorships TO authenticated;
GRANT ALL ON public.mentorships TO service_role;
ALTER TABLE public.mentorships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vejo minhas mentorias" ON public.mentorships FOR SELECT TO authenticated
  USING (auth.uid() = mentor_id OR auth.uid() = apprentice_id);

-- ============ RPC: entrar em clube ============
CREATE OR REPLACE FUNCTION public.join_club(p_club_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_count int;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT COUNT(*) INTO v_count FROM public.club_members WHERE user_id = v_user;
  IF v_count >= 2 THEN
    RAISE EXCEPTION 'Você já participa de 2 clubes (limite). Saia de algum primeiro.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.clubs WHERE id = p_club_id AND active) THEN
    RAISE EXCEPTION 'Clube não disponível';
  END IF;
  INSERT INTO public.club_members (club_id, user_id) VALUES (p_club_id, v_user)
  ON CONFLICT (club_id, user_id) DO NOTHING;
  INSERT INTO public.notifications (user_id, title, message)
  VALUES (v_user, '🎓 Bem-vindo ao clube!', 'Você ingressou em um novo clube estudantil.');
  RETURN jsonb_build_object('success', true);
END $$;

-- ============ RPC: solicitar mentoria ============
CREATE OR REPLACE FUNCTION public.request_mentorship(p_mentor_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_apprentice_lvl int;
  v_mentor_lvl int;
  v_existing uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF v_user = p_mentor_id THEN RAISE EXCEPTION 'Você não pode ser seu próprio mentor'; END IF;

  SELECT level INTO v_apprentice_lvl FROM public.profiles WHERE user_id = v_user;
  SELECT level INTO v_mentor_lvl FROM public.profiles WHERE user_id = p_mentor_id;

  IF v_apprentice_lvl > 5 THEN
    RAISE EXCEPTION 'Apenas bruxos até nível 5 podem ter mentor.';
  END IF;
  IF v_mentor_lvl < 10 THEN
    RAISE EXCEPTION 'O mentor precisa ter ao menos nível 10.';
  END IF;

  -- aprendiz só pode ter 1 mentoria ativa
  SELECT id INTO v_existing FROM public.mentorships
    WHERE apprentice_id = v_user AND status IN ('pending','active');
  IF v_existing IS NOT NULL THEN
    RAISE EXCEPTION 'Você já tem uma mentoria em andamento.';
  END IF;

  INSERT INTO public.mentorships (mentor_id, apprentice_id, status)
  VALUES (p_mentor_id, v_user, 'pending');

  INSERT INTO public.notifications (user_id, title, message, link)
  VALUES (p_mentor_id, '🦉 Pedido de mentoria',
          'Um aprendiz quer ser apadrinhado por você.',
          '/dashboard/clubs');

  RETURN jsonb_build_object('success', true);
END $$;

-- ============ RPC: aceitar/recusar mentoria ============
CREATE OR REPLACE FUNCTION public.respond_mentorship(p_mentorship_id uuid, p_accept boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_m public.mentorships;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO v_m FROM public.mentorships WHERE id = p_mentorship_id FOR UPDATE;
  IF v_m.id IS NULL OR v_m.mentor_id <> v_user THEN
    RAISE EXCEPTION 'Mentoria não encontrada';
  END IF;
  IF v_m.status <> 'pending' THEN
    RAISE EXCEPTION 'Mentoria já respondida';
  END IF;

  IF p_accept THEN
    UPDATE public.mentorships SET status = 'active', started_at = now() WHERE id = p_mentorship_id;
    INSERT INTO public.notifications (user_id, title, message)
    VALUES (v_m.apprentice_id, '🌟 Mentor aceitou!',
            'Sua jornada agora é acompanhada por um veterano.');
  ELSE
    UPDATE public.mentorships SET status = 'ended', ended_at = now() WHERE id = p_mentorship_id;
    INSERT INTO public.notifications (user_id, title, message)
    VALUES (v_m.apprentice_id, '🦉 Mentoria recusada',
            'O bruxo não pôde aceitar agora. Tente outro mentor!');
  END IF;
  RETURN jsonb_build_object('success', true, 'status', CASE WHEN p_accept THEN 'active' ELSE 'ended' END);
END $$;

-- ============ Trigger: recompensa por level up do aprendiz ============
CREATE OR REPLACE FUNCTION public.trg_mentor_levelup_reward()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_mentor uuid;
  v_men_id uuid;
  v_bonus int := 25; -- XP por nível do aprendiz
BEGIN
  IF NEW.level > COALESCE(OLD.level, 1) THEN
    SELECT id, mentor_id INTO v_men_id, v_mentor
      FROM public.mentorships
     WHERE apprentice_id = NEW.user_id AND status = 'active'
     LIMIT 1;

    IF v_mentor IS NOT NULL THEN
      UPDATE public.profiles SET xp = COALESCE(xp,0) + v_bonus
       WHERE user_id = v_mentor;
      UPDATE public.profiles SET xp = COALESCE(xp,0) + v_bonus
       WHERE user_id = NEW.user_id;
      UPDATE public.mentorships
         SET apprentice_levels_gained = apprentice_levels_gained + (NEW.level - COALESCE(OLD.level,1)),
             total_bonus_xp = total_bonus_xp + (v_bonus * 2)
       WHERE id = v_men_id;

      INSERT INTO public.notifications (user_id, title, message)
      VALUES (v_mentor, '🎓 Seu aprendiz evoluiu!',
              'Você ganhou +' || v_bonus || ' XP pelo progresso do aprendiz.');
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS mentor_levelup_reward ON public.profiles;
CREATE TRIGGER mentor_levelup_reward
  AFTER UPDATE OF level ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.trg_mentor_levelup_reward();

-- ============ SEED CLUBES ============
INSERT INTO public.clubs (slug, name, description, emblem, color, meeting_day, founded_by) VALUES
  ('duelo', 'Clube de Duelo', 'Aperfeiçoe seus feitiços contra outros bruxos. Treinos quinzenais e torneios sazonais.', '⚔️', '#ef4444', 'Quartas-feiras', 'Prof. Severus Snape'),
  ('exercito-dumbledore', 'Exército de Dumbledore', 'Resistência, defesa e coragem. Para bruxos que acreditam em algo maior.', '🦁', '#f59e0b', 'Sextas-feiras', 'Harry Potter'),
  ('slughorn', 'Clube do Slughorn', 'Networking de elite. Apenas convidados — talento e influência valem ouro aqui.', '🏆', '#c9a84c', 'Domingos', 'Prof. Horace Slughorn'),
  ('xadrez-bruxo', 'Xadrez Bruxo', 'Estratégia, paciência e peças que mordem. Para mentes táticas.', '♟️', '#8b5cf6', 'Sábados', 'Ronald Weasley'),
  ('gobstones', 'Clube de Gobstones', 'O jogo das pedrinhas mágicas. Diversão garantida (e um pouco de lama no rosto).', '🪨', '#10b981', 'Terças-feiras', 'Eileen Prince'),
  ('pomo-ouro', 'Caçadores do Pomo', 'Para apaixonados por Quadribol. Treinos, análise tática e fan club.', '🏐', '#fbbf24', 'Segundas e Quintas', 'Madame Hooch')
ON CONFLICT (slug) DO NOTHING;
