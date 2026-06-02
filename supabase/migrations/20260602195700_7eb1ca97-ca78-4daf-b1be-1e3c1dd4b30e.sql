-- ============================================================
-- FASE 10 — IMERSÃO PROFUNDA & PvP AVANÇADO
-- ============================================================

-- ============= 10.A — DUELOS PvP ==============================

CREATE TABLE IF NOT EXISTS public.duel_spells (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text UNIQUE NOT NULL,
  name        text NOT NULL,
  type        text NOT NULL CHECK (type IN ('attack','defense','curse','heal')),
  damage      int  NOT NULL DEFAULT 0,
  heal        int  NOT NULL DEFAULT 0,
  shield      int  NOT NULL DEFAULT 0,
  mp_cost     int  NOT NULL DEFAULT 10,
  level_req   int  NOT NULL DEFAULT 1,
  description text,
  icon        text DEFAULT '✨',
  created_at  timestamptz DEFAULT now()
);

GRANT SELECT ON public.duel_spells TO anon, authenticated;
GRANT ALL ON public.duel_spells TO service_role;
ALTER TABLE public.duel_spells ENABLE ROW LEVEL SECURITY;
CREATE POLICY "duel_spells_public_read" ON public.duel_spells FOR SELECT USING (true);
CREATE POLICY "duel_spells_admin_write" ON public.duel_spells FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.duel_matches (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_a        uuid NOT NULL,
  player_b        uuid NOT NULL,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','finished','forfeited')),
  hp_a            int  NOT NULL DEFAULT 100,
  hp_b            int  NOT NULL DEFAULT 100,
  mp_a            int  NOT NULL DEFAULT 100,
  mp_b            int  NOT NULL DEFAULT 100,
  shield_a        int  NOT NULL DEFAULT 0,
  shield_b        int  NOT NULL DEFAULT 0,
  current_turn    uuid,
  turn_number     int  NOT NULL DEFAULT 1,
  winner          uuid,
  xp_reward       int  NOT NULL DEFAULT 50,
  galeon_reward   int  NOT NULL DEFAULT 25,
  started_at      timestamptz,
  finished_at     timestamptz,
  created_at      timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.duel_matches TO authenticated;
GRANT ALL ON public.duel_matches TO service_role;
ALTER TABLE public.duel_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "duel_matches_participants_read" ON public.duel_matches FOR SELECT USING (auth.uid() = player_a OR auth.uid() = player_b OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "duel_matches_admin_write" ON public.duel_matches FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.duel_actions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id    uuid NOT NULL REFERENCES public.duel_matches(id) ON DELETE CASCADE,
  player      uuid NOT NULL,
  spell_code  text NOT NULL,
  turn        int  NOT NULL,
  damage      int  NOT NULL DEFAULT 0,
  healed      int  NOT NULL DEFAULT 0,
  shielded    int  NOT NULL DEFAULT 0,
  log_text    text,
  created_at  timestamptz DEFAULT now()
);

GRANT SELECT ON public.duel_actions TO authenticated;
GRANT ALL ON public.duel_actions TO service_role;
ALTER TABLE public.duel_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "duel_actions_participants_read" ON public.duel_actions FOR SELECT
USING (EXISTS (SELECT 1 FROM public.duel_matches m WHERE m.id = duel_actions.match_id AND (m.player_a = auth.uid() OR m.player_b = auth.uid())));

ALTER PUBLICATION supabase_realtime ADD TABLE public.duel_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.duel_actions;

-- Seed feitiços
INSERT INTO public.duel_spells (code, name, type, damage, heal, shield, mp_cost, level_req, description, icon) VALUES
  ('expelliarmus', 'Expelliarmus',  'attack',  18, 0, 0, 10, 1,  'Desarma o oponente causando dano leve.', '✋'),
  ('stupefy',      'Estupefaça',    'attack',  25, 0, 0, 15, 3,  'Atordoa e causa dano moderado.', '⚡'),
  ('protego',      'Protego',       'defense',  0, 0, 30, 12, 1, 'Cria um escudo mágico.', '🛡️'),
  ('episkey',      'Episkey',       'heal',     0, 25, 0, 18, 2, 'Recupera HP.', '💚'),
  ('confringo',    'Confringo',     'attack',  35, 0, 0, 25, 5,  'Maldição explosiva.', '💥'),
  ('crucio',       'Crucio',        'curse',   45, 0, 0, 40, 8,  'Maldição imperdoável — dor extrema.', '🔥'),
  ('sectumsempra', 'Sectumsempra',  'attack',  55, 0, 0, 50, 10, 'Corte mágico devastador.', '🗡️'),
  ('reparifors',   'Reparifors',    'heal',     0, 40, 0, 30, 6, 'Cura completa de feridas.', '✨')
ON CONFLICT (code) DO NOTHING;

-- RPC: criar duelo (desafio)
CREATE OR REPLACE FUNCTION public.create_duel(p_opponent uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF auth.uid() = p_opponent THEN RAISE EXCEPTION 'Você não pode duelar consigo mesmo'; END IF;

  INSERT INTO public.duel_matches (player_a, player_b, current_turn)
  VALUES (auth.uid(), p_opponent, auth.uid())
  RETURNING id INTO v_id;

  RETURN v_id;
END $$;

-- RPC: aceitar duelo
CREATE OR REPLACE FUNCTION public.accept_duel(p_match uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.duel_matches
  SET status='active', started_at=now()
  WHERE id = p_match AND player_b = auth.uid() AND status='pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'Duelo não encontrado ou já iniciado'; END IF;
END $$;

-- RPC: lançar feitiço no duelo
CREATE OR REPLACE FUNCTION public.cast_duel_spell(p_match uuid, p_spell_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match  public.duel_matches;
  v_spell  public.duel_spells;
  v_is_a   boolean;
  v_target_hp int;
  v_dmg    int := 0;
  v_heal   int := 0;
  v_shield int := 0;
  v_msg    text;
BEGIN
  SELECT * INTO v_match FROM public.duel_matches WHERE id=p_match FOR UPDATE;
  IF v_match.status <> 'active' THEN RAISE EXCEPTION 'Duelo não está ativo'; END IF;
  IF v_match.current_turn <> auth.uid() THEN RAISE EXCEPTION 'Não é o seu turno'; END IF;

  SELECT * INTO v_spell FROM public.duel_spells WHERE code=p_spell_code;
  IF v_spell IS NULL THEN RAISE EXCEPTION 'Feitiço inválido'; END IF;

  v_is_a := (auth.uid() = v_match.player_a);

  -- consome MP
  IF v_is_a THEN
    IF v_match.mp_a < v_spell.mp_cost THEN RAISE EXCEPTION 'Mana insuficiente'; END IF;
  ELSE
    IF v_match.mp_b < v_spell.mp_cost THEN RAISE EXCEPTION 'Mana insuficiente'; END IF;
  END IF;

  IF v_spell.type IN ('attack','curse') THEN
    v_dmg := v_spell.damage;
    -- aplica em quem é alvo (oponente)
    IF v_is_a THEN
      v_dmg := GREATEST(0, v_dmg - v_match.shield_b);
      v_match.hp_b := GREATEST(0, v_match.hp_b - v_dmg);
      v_match.shield_b := 0;
    ELSE
      v_dmg := GREATEST(0, v_dmg - v_match.shield_a);
      v_match.hp_a := GREATEST(0, v_match.hp_a - v_dmg);
      v_match.shield_a := 0;
    END IF;
    v_msg := v_spell.name || ' causou ' || v_dmg || ' de dano!';
  ELSIF v_spell.type = 'defense' THEN
    v_shield := v_spell.shield;
    IF v_is_a THEN v_match.shield_a := v_match.shield_a + v_shield;
    ELSE v_match.shield_b := v_match.shield_b + v_shield; END IF;
    v_msg := v_spell.name || ' adicionou ' || v_shield || ' de escudo.';
  ELSIF v_spell.type = 'heal' THEN
    v_heal := v_spell.heal;
    IF v_is_a THEN v_match.hp_a := LEAST(100, v_match.hp_a + v_heal);
    ELSE v_match.hp_b := LEAST(100, v_match.hp_b + v_heal); END IF;
    v_msg := v_spell.name || ' restaurou ' || v_heal || ' HP.';
  END IF;

  -- consumo de MP + troca de turno + regen leve
  IF v_is_a THEN
    v_match.mp_a := GREATEST(0, v_match.mp_a - v_spell.mp_cost);
    v_match.mp_b := LEAST(100, v_match.mp_b + 8);
  ELSE
    v_match.mp_b := GREATEST(0, v_match.mp_b - v_spell.mp_cost);
    v_match.mp_a := LEAST(100, v_match.mp_a + 8);
  END IF;

  v_match.turn_number := v_match.turn_number + 1;
  v_match.current_turn := CASE WHEN v_is_a THEN v_match.player_b ELSE v_match.player_a END;

  -- vitória?
  IF v_match.hp_a <= 0 OR v_match.hp_b <= 0 THEN
    v_match.status := 'finished';
    v_match.finished_at := now();
    v_match.winner := CASE WHEN v_match.hp_a <= 0 THEN v_match.player_b ELSE v_match.player_a END;
    -- recompensa
    UPDATE public.profiles SET xp = xp + v_match.xp_reward, galeons = galeons + v_match.galeon_reward
    WHERE user_id = v_match.winner;
  END IF;

  UPDATE public.duel_matches SET
    hp_a=v_match.hp_a, hp_b=v_match.hp_b,
    mp_a=v_match.mp_a, mp_b=v_match.mp_b,
    shield_a=v_match.shield_a, shield_b=v_match.shield_b,
    current_turn=v_match.current_turn, turn_number=v_match.turn_number,
    status=v_match.status, winner=v_match.winner, finished_at=v_match.finished_at
  WHERE id = v_match.id;

  INSERT INTO public.duel_actions(match_id, player, spell_code, turn, damage, healed, shielded, log_text)
  VALUES (v_match.id, auth.uid(), p_spell_code, v_match.turn_number-1, v_dmg, v_heal, v_shield, v_msg);

  RETURN jsonb_build_object('damage',v_dmg,'heal',v_heal,'shield',v_shield,'winner',v_match.winner,'status',v_match.status);
END $$;

CREATE OR REPLACE FUNCTION public.forfeit_duel(p_match uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_match public.duel_matches; v_other uuid;
BEGIN
  SELECT * INTO v_match FROM public.duel_matches WHERE id=p_match FOR UPDATE;
  IF v_match.status NOT IN ('pending','active') THEN RETURN; END IF;
  IF auth.uid() NOT IN (v_match.player_a, v_match.player_b) THEN RAISE EXCEPTION 'Não é participante'; END IF;
  v_other := CASE WHEN auth.uid()=v_match.player_a THEN v_match.player_b ELSE v_match.player_a END;
  UPDATE public.duel_matches SET status='forfeited', winner=v_other, finished_at=now() WHERE id=p_match;
END $$;

-- ============= 10.B — QUADRIBOL ===============================

CREATE TABLE IF NOT EXISTS public.quidditch_matches (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  house_a         text NOT NULL,
  house_b         text NOT NULL,
  status          text NOT NULL DEFAULT 'open' CHECK (status IN ('open','running','finished')),
  score_a         int  NOT NULL DEFAULT 0,
  score_b         int  NOT NULL DEFAULT 0,
  snitch_caught_by uuid,
  winner_house    text,
  started_at      timestamptz,
  finished_at     timestamptz,
  created_at      timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.quidditch_matches TO authenticated;
GRANT ALL ON public.quidditch_matches TO service_role;
ALTER TABLE public.quidditch_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qmatches_read_all" ON public.quidditch_matches FOR SELECT USING (true);
CREATE POLICY "qmatches_admin_write" ON public.quidditch_matches FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.quidditch_players (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id    uuid NOT NULL REFERENCES public.quidditch_matches(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL,
  house       text NOT NULL,
  position    text NOT NULL CHECK (position IN ('chaser','keeper','beater','seeker')),
  joined_at   timestamptz DEFAULT now(),
  UNIQUE(match_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.quidditch_players TO authenticated;
GRANT ALL ON public.quidditch_players TO service_role;
ALTER TABLE public.quidditch_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qplayers_read_all" ON public.quidditch_players FOR SELECT USING (true);
CREATE POLICY "qplayers_self_join" ON public.quidditch_players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "qplayers_self_leave" ON public.quidditch_players FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.quidditch_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id    uuid NOT NULL REFERENCES public.quidditch_matches(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL,
  event_type  text NOT NULL CHECK (event_type IN ('goal','save','bludger','snitch')),
  house       text NOT NULL,
  points      int  NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

GRANT SELECT, INSERT ON public.quidditch_events TO authenticated;
GRANT ALL ON public.quidditch_events TO service_role;
ALTER TABLE public.quidditch_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qevents_read_all" ON public.quidditch_events FOR SELECT USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.quidditch_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quidditch_events;

CREATE OR REPLACE FUNCTION public.quidditch_score(p_match uuid, p_event text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_match public.quidditch_matches;
  v_player public.quidditch_players;
  v_points int := 0;
BEGIN
  SELECT * INTO v_match FROM public.quidditch_matches WHERE id=p_match FOR UPDATE;
  IF v_match.status <> 'running' THEN RAISE EXCEPTION 'Partida não está em andamento'; END IF;

  SELECT * INTO v_player FROM public.quidditch_players WHERE match_id=p_match AND user_id=auth.uid();
  IF v_player IS NULL THEN RAISE EXCEPTION 'Você não está nesta partida'; END IF;

  IF p_event = 'goal' AND v_player.position IN ('chaser','keeper') THEN
    v_points := 10;
  ELSIF p_event = 'save' AND v_player.position = 'keeper' THEN
    v_points := 5;
  ELSIF p_event = 'bludger' AND v_player.position = 'beater' THEN
    v_points := 3;
  ELSIF p_event = 'snitch' AND v_player.position = 'seeker' THEN
    v_points := 150;
    v_match.snitch_caught_by := auth.uid();
  ELSE
    RAISE EXCEPTION 'Ação inválida para sua posição';
  END IF;

  IF v_player.house = v_match.house_a THEN
    v_match.score_a := v_match.score_a + v_points;
  ELSE
    v_match.score_b := v_match.score_b + v_points;
  END IF;

  INSERT INTO public.quidditch_events(match_id,user_id,event_type,house,points)
  VALUES (p_match, auth.uid(), p_event, v_player.house, v_points);

  IF p_event = 'snitch' THEN
    v_match.status := 'finished';
    v_match.finished_at := now();
    v_match.winner_house := CASE WHEN v_match.score_a > v_match.score_b THEN v_match.house_a
                                 WHEN v_match.score_b > v_match.score_a THEN v_match.house_b
                                 ELSE v_player.house END;
    -- recompensa XP para todos da casa vencedora
    UPDATE public.profiles SET xp = xp + 100, galeons = galeons + 50
    WHERE user_id IN (SELECT user_id FROM public.quidditch_players WHERE match_id=p_match AND house=v_match.winner_house);
  END IF;

  UPDATE public.quidditch_matches SET
    score_a=v_match.score_a, score_b=v_match.score_b,
    snitch_caught_by=v_match.snitch_caught_by,
    status=v_match.status, winner_house=v_match.winner_house,
    finished_at=v_match.finished_at
  WHERE id=p_match;

  RETURN jsonb_build_object('points',v_points,'status',v_match.status,'winner',v_match.winner_house);
END $$;

CREATE OR REPLACE FUNCTION public.start_quidditch_match(p_match uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  UPDATE public.quidditch_matches SET status='running', started_at=now()
  WHERE id=p_match AND status='open';
END $$;

-- ============= 10.B — SALA PRECISA ============================

CREATE TABLE IF NOT EXISTS public.room_of_requirement (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid NOT NULL,
  name          text NOT NULL,
  theme         text NOT NULL DEFAULT 'estudo',
  password_hash text,
  max_members   int  NOT NULL DEFAULT 6,
  description   text,
  created_at    timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_of_requirement TO authenticated;
GRANT ALL ON public.room_of_requirement TO service_role;
ALTER TABLE public.room_of_requirement ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ror_read_all" ON public.room_of_requirement FOR SELECT USING (true);
CREATE POLICY "ror_owner_create" ON public.room_of_requirement FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "ror_owner_manage" ON public.room_of_requirement FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "ror_owner_delete" ON public.room_of_requirement FOR DELETE USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.room_members (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id   uuid NOT NULL REFERENCES public.room_of_requirement(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(room_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.room_members TO authenticated;
GRANT ALL ON public.room_members TO service_role;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rm_read_all" ON public.room_members FOR SELECT USING (true);
CREATE POLICY "rm_self_join" ON public.room_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rm_self_leave" ON public.room_members FOR DELETE USING (auth.uid() = user_id);

-- ============= 10.C — VARINHAS ================================

CREATE TABLE IF NOT EXISTS public.wands (
  user_id        uuid PRIMARY KEY,
  wood           text NOT NULL,
  core           text NOT NULL,
  length_inches  numeric(4,1) NOT NULL DEFAULT 11.0,
  flexibility    text NOT NULL DEFAULT 'flexível',
  bonus_attack   int  NOT NULL DEFAULT 0,
  bonus_defense  int  NOT NULL DEFAULT 0,
  bonus_speed    int  NOT NULL DEFAULT 0,
  crafted_at     timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.wands TO authenticated;
GRANT ALL ON public.wands TO service_role;
ALTER TABLE public.wands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wands_read_all" ON public.wands FOR SELECT USING (true);
CREATE POLICY "wands_self_create" ON public.wands FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wands_self_update" ON public.wands FOR UPDATE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.craft_wand(p_wood text, p_core text, p_length numeric, p_flex text)
RETURNS public.wands LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_atk int := 0; v_def int := 0; v_spd int := 0;
  v_row public.wands;
BEGIN
  -- bônus por madeira
  v_atk := v_atk + CASE p_wood
    WHEN 'azevinho' THEN 8 WHEN 'teixo' THEN 12 WHEN 'carvalho' THEN 6
    WHEN 'salgueiro' THEN 4 WHEN 'videira' THEN 5 ELSE 3 END;
  -- bônus por núcleo
  v_def := v_def + CASE p_core
    WHEN 'pena de fênix' THEN 10 WHEN 'pelo de unicórnio' THEN 12
    WHEN 'corda de coração de dragão' THEN 6 WHEN 'crina de thestral' THEN 8 ELSE 4 END;
  v_atk := v_atk + CASE p_core
    WHEN 'corda de coração de dragão' THEN 10 WHEN 'pena de fênix' THEN 7
    WHEN 'crina de thestral' THEN 5 ELSE 3 END;
  -- velocidade por comprimento (varinhas curtas são mais ágeis)
  v_spd := GREATEST(0, 20 - FLOOR((p_length - 9))::int);
  IF p_flex = 'flexível' THEN v_spd := v_spd + 3;
  ELSIF p_flex = 'rígida' THEN v_def := v_def + 3; END IF;

  INSERT INTO public.wands(user_id, wood, core, length_inches, flexibility, bonus_attack, bonus_defense, bonus_speed)
  VALUES (auth.uid(), p_wood, p_core, p_length, p_flex, v_atk, v_def, v_spd)
  ON CONFLICT (user_id) DO UPDATE SET
    wood=EXCLUDED.wood, core=EXCLUDED.core, length_inches=EXCLUDED.length_inches,
    flexibility=EXCLUDED.flexibility, bonus_attack=EXCLUDED.bonus_attack,
    bonus_defense=EXCLUDED.bonus_defense, bonus_speed=EXCLUDED.bonus_speed,
    crafted_at=now()
  RETURNING * INTO v_row;
  RETURN v_row;
END $$;

-- ============= 10.C — PATRONOS ================================

CREATE TABLE IF NOT EXISTS public.patronuses (
  user_id         uuid PRIMARY KEY,
  animal          text NOT NULL,
  form_strength   int  NOT NULL DEFAULT 30 CHECK (form_strength BETWEEN 0 AND 100),
  mastery_level   int  NOT NULL DEFAULT 1,
  last_invoked_at timestamptz,
  created_at      timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.patronuses TO authenticated;
GRANT ALL ON public.patronuses TO service_role;
ALTER TABLE public.patronuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "patronus_read_all" ON public.patronuses FOR SELECT USING (true);
CREATE POLICY "patronus_self" ON public.patronuses FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

CREATE TABLE IF NOT EXISTS public.patronus_invocations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  success    boolean NOT NULL,
  strength   int NOT NULL,
  created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT ON public.patronus_invocations TO authenticated;
GRANT ALL ON public.patronus_invocations TO service_role;
ALTER TABLE public.patronus_invocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "patinv_self_read" ON public.patronus_invocations FOR SELECT USING (auth.uid()=user_id);
CREATE POLICY "patinv_self_insert" ON public.patronus_invocations FOR INSERT WITH CHECK (auth.uid()=user_id);

CREATE OR REPLACE FUNCTION public.invoke_patronus(p_focus int)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_pat public.patronuses;
  v_success boolean;
  v_str int;
BEGIN
  SELECT * INTO v_pat FROM public.patronuses WHERE user_id=auth.uid();
  IF v_pat IS NULL THEN RAISE EXCEPTION 'Você ainda não descobriu seu patrono'; END IF;

  -- p_focus 0-100 representa precisão do mini-game
  v_success := p_focus >= (60 - v_pat.mastery_level * 3);
  v_str := LEAST(100, v_pat.form_strength + CASE WHEN v_success THEN 3 ELSE -1 END);

  UPDATE public.patronuses SET
    form_strength = v_str,
    mastery_level = CASE WHEN v_str >= v_pat.mastery_level * 20 THEN v_pat.mastery_level + 1 ELSE v_pat.mastery_level END,
    last_invoked_at = now()
  WHERE user_id = auth.uid();

  INSERT INTO public.patronus_invocations(user_id, success, strength) VALUES (auth.uid(), v_success, v_str);

  IF v_success THEN
    UPDATE public.profiles SET xp = xp + 15 WHERE user_id = auth.uid();
  END IF;

  RETURN jsonb_build_object('success',v_success,'strength',v_str);
END $$;