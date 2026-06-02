-- Phase 17: Exploration & Magical Travel

CREATE TYPE public.travel_method AS ENUM ('floo','apparate','portkey','broom','thestral');

-- 17.B World Locations
CREATE TABLE public.world_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  region text NOT NULL,
  description text,
  lore text,
  icon text DEFAULT '📍',
  pos_x integer NOT NULL DEFAULT 50,
  pos_y integer NOT NULL DEFAULT 50,
  min_level integer NOT NULL DEFAULT 1,
  danger_level integer NOT NULL DEFAULT 1,
  travel_cost integer NOT NULL DEFAULT 10,
  xp_reward integer NOT NULL DEFAULT 25,
  discoverable boolean DEFAULT true
);
GRANT SELECT ON public.world_locations TO anon, authenticated;
GRANT ALL ON public.world_locations TO service_role;
ALTER TABLE public.world_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Locations public" ON public.world_locations FOR SELECT USING (true);
CREATE POLICY "Admins manage locations" ON public.world_locations FOR ALL USING (has_role(auth.uid(),'admin'::app_role));

-- 17.A Travel log
CREATE TABLE public.user_travels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  location_id uuid NOT NULL REFERENCES public.world_locations(id) ON DELETE CASCADE,
  method public.travel_method NOT NULL,
  success boolean NOT NULL DEFAULT true,
  notes text,
  traveled_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT ON public.user_travels TO authenticated;
GRANT ALL ON public.user_travels TO service_role;
ALTER TABLE public.user_travels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own travels read" ON public.user_travels FOR SELECT USING (auth.uid() = user_id);

-- Current position / cooldown
CREATE TABLE public.user_position (
  user_id uuid PRIMARY KEY,
  current_location_id uuid REFERENCES public.world_locations(id) ON DELETE SET NULL,
  last_travel_at timestamptz DEFAULT now(),
  visited_count integer NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE ON public.user_position TO authenticated;
GRANT ALL ON public.user_position TO service_role;
ALTER TABLE public.user_position ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own position" ON public.user_position FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 17.C Travel journal
CREATE TABLE public.travel_journal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  location_id uuid REFERENCES public.world_locations(id) ON DELETE SET NULL,
  title text NOT NULL,
  entry text NOT NULL,
  mood text DEFAULT '✨',
  photo_url text,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.travel_journal TO authenticated;
GRANT ALL ON public.travel_journal TO service_role;
ALTER TABLE public.travel_journal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own journal" ON public.travel_journal FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Explorer achievements
CREATE TABLE public.explorer_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  icon text DEFAULT '🏆',
  required_visits integer NOT NULL DEFAULT 5,
  xp_reward integer NOT NULL DEFAULT 100
);
GRANT SELECT ON public.explorer_achievements TO anon, authenticated;
GRANT ALL ON public.explorer_achievements TO service_role;
ALTER TABLE public.explorer_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Achievements public" ON public.explorer_achievements FOR SELECT USING (true);
CREATE POLICY "Admins manage achievements" ON public.explorer_achievements FOR ALL USING (has_role(auth.uid(),'admin'::app_role));

CREATE TABLE public.user_explorer_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL REFERENCES public.explorer_achievements(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);
GRANT SELECT, INSERT ON public.user_explorer_achievements TO authenticated;
GRANT ALL ON public.user_explorer_achievements TO service_role;
ALTER TABLE public.user_explorer_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own achievements read" ON public.user_explorer_achievements FOR SELECT USING (auth.uid() = user_id);

-- Travel RPC
CREATE OR REPLACE FUNCTION public.travel_to(p_location_id uuid, p_method public.travel_method)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_loc record;
  v_lvl int;
  v_bal int;
  v_pos record;
  v_cd_sec int;
  v_success boolean := true;
  v_risk int := 0;
  v_visits int;
  v_ach record;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO v_loc FROM public.world_locations WHERE id = p_location_id AND discoverable;
  IF NOT FOUND THEN RAISE EXCEPTION 'Local indisponível'; END IF;
  SELECT level, COALESCE(galeons,0) INTO v_lvl, v_bal FROM public.profiles WHERE user_id = v_user;
  IF COALESCE(v_lvl,1) < v_loc.min_level THEN RAISE EXCEPTION 'Nível mínimo: %', v_loc.min_level; END IF;
  IF v_bal < v_loc.travel_cost THEN RAISE EXCEPTION 'Galeões insuficientes'; END IF;

  SELECT * INTO v_pos FROM public.user_position WHERE user_id = v_user FOR UPDATE;
  IF FOUND THEN
    v_cd_sec := EXTRACT(EPOCH FROM (now() - v_pos.last_travel_at));
    IF v_cd_sec < 60 THEN RAISE EXCEPTION 'Aguarde % segundos antes de viajar novamente', 60 - v_cd_sec; END IF;
  END IF;

  -- Risk by method
  v_risk := CASE p_method
    WHEN 'apparate' THEN 15 + v_loc.danger_level * 5
    WHEN 'portkey' THEN 5
    WHEN 'floo' THEN 8
    WHEN 'broom' THEN 10 + v_loc.danger_level * 3
    WHEN 'thestral' THEN 12
  END;

  v_success := (floor(random()*100)::int >= v_risk);

  UPDATE public.profiles SET galeons = galeons - v_loc.travel_cost WHERE user_id = v_user;

  INSERT INTO public.user_travels(user_id, location_id, method, success, notes)
  VALUES (v_user, p_location_id, p_method,
    v_success,
    CASE WHEN v_success THEN 'Viagem tranquila.' ELSE 'Algo deu errado no trajeto!' END);

  IF v_success THEN
    INSERT INTO public.user_position(user_id, current_location_id, last_travel_at, visited_count)
    VALUES (v_user, p_location_id, now(), 1)
    ON CONFLICT (user_id) DO UPDATE
      SET current_location_id = p_location_id,
          last_travel_at = now(),
          visited_count = public.user_position.visited_count + 1;

    PERFORM public.award_xp_action('travel', v_user, v_loc.xp_reward);
    INSERT INTO public.notifications(user_id, title, message)
    VALUES (v_user, '🗺️ Nova viagem registrada!', 'Você chegou em: ' || v_loc.name);

    -- check achievements
    SELECT visited_count INTO v_visits FROM public.user_position WHERE user_id = v_user;
    FOR v_ach IN
      SELECT * FROM public.explorer_achievements
      WHERE required_visits <= v_visits
      AND id NOT IN (SELECT achievement_id FROM public.user_explorer_achievements WHERE user_id = v_user)
    LOOP
      INSERT INTO public.user_explorer_achievements(user_id, achievement_id) VALUES (v_user, v_ach.id);
      PERFORM public.award_xp_action('explorer_achievement', v_user, v_ach.xp_reward);
      INSERT INTO public.notifications(user_id, title, message)
      VALUES (v_user, '🏆 Conquista de Explorador!', v_ach.icon || ' ' || v_ach.name);
    END LOOP;
  ELSE
    -- accident: half xp loss & negative notification
    UPDATE public.user_position SET last_travel_at = now() WHERE user_id = v_user;
    INSERT INTO public.notifications(user_id, title, message)
    VALUES (v_user, '💫 Erro de viagem!', 'O método ' || p_method::text || ' falhou. Você se desorientou.');
  END IF;

  RETURN jsonb_build_object('ok', true, 'success', v_success, 'location', v_loc.name);
END $$;

-- Seeds: locations
INSERT INTO public.world_locations(slug, name, region, description, lore, icon, pos_x, pos_y, min_level, danger_level, travel_cost, xp_reward) VALUES
  ('hogwarts', 'Hogwarts', 'Escócia', 'Castelo de magia e bruxaria.', 'Fundada por Godric, Helga, Rowena e Salazar.', '🏰', 48, 30, 1, 1, 0, 0),
  ('hogsmeade_vila', 'Vila de Hogsmeade', 'Escócia', 'Única vila inteiramente bruxa.', 'Famosa pelo Três Vassouras e Dedosdemel.', '🏘️', 50, 35, 3, 1, 10, 30),
  ('beco_diagonal', 'Beco Diagonal', 'Londres', 'Rua comercial mágica oculta no centro de Londres.', 'Acesso pelo Caldeirão Furado.', '🛍️', 55, 55, 1, 1, 15, 25),
  ('toca', 'A Toca', 'Devon', 'Casa torta dos Weasley.', 'Lar de Arthur, Molly e os 7 filhos.', '🏚️', 52, 60, 2, 1, 12, 30),
  ('mansao_malfoy', 'Mansão Malfoy', 'Wiltshire', 'Mansão sombria da família Malfoy.', 'Sede dos Comensais da Morte.', '🦇', 53, 58, 8, 4, 25, 80),
  ('beauxbatons', 'Beauxbatons', 'Pirineus', 'Academia francesa de magia.', 'Dirigida por Madame Olympe Maxime.', '⚜️', 35, 70, 5, 2, 40, 60),
  ('durmstrang', 'Durmstrang', 'Norte da Europa', 'Instituto sombrio do norte.', 'Ensina artes das trevas.', '❄️', 70, 15, 7, 3, 50, 75),
  ('ministerio', 'Ministério da Magia', 'Londres', 'Sede do governo bruxo britânico.', 'Acesso por privada/cabine telefônica.', '🏛️', 56, 56, 4, 1, 20, 40),
  ('floresta_proibida', 'Floresta Proibida', 'Hogwarts', 'Mata densa cheia de criaturas perigosas.', 'Centauros, aragogues, testrálios.', '🌲', 47, 32, 6, 5, 5, 100),
  ('azkaban', 'Azkaban', 'Mar do Norte', 'Prisão mágica vigiada por Dementadores.', 'Ilha gélida e desolada.', '⛓️', 65, 18, 10, 5, 60, 150),
  ('godric_hollow', 'Godric''s Hollow', 'West Country', 'Vila onde nasceram os Potter.', 'Local do túmulo de Lily e James.', '⛪', 50, 62, 5, 2, 30, 70),
  ('shell_cottage', 'Chalé das Conchas', 'Cornualha', 'Refúgio à beira-mar de Bill e Fleur.', 'Esconderijo durante a guerra.', '🐚', 45, 68, 4, 1, 22, 50);

INSERT INTO public.explorer_achievements(code, name, description, icon, required_visits, xp_reward) VALUES
  ('first_steps', 'Primeiros Passos', 'Realize sua primeira viagem.', '👣', 1, 50),
  ('wanderer', 'Andarilho', 'Complete 5 viagens.', '🚶', 5, 150),
  ('explorer', 'Explorador', 'Complete 15 viagens.', '🧭', 15, 400),
  ('globetrotter', 'Trotamundos Mágico', 'Complete 30 viagens.', '🌍', 30, 800),
  ('master_traveler', 'Mestre Viajante', 'Complete 50 viagens.', '✨', 50, 1500);