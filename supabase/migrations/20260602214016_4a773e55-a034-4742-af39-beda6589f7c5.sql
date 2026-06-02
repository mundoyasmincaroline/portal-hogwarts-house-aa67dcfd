-- Phase 19: Dark Arts, Order of the Phoenix, Death Eaters

-- 19.A Dark Arts
CREATE TABLE public.dark_spells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  corruption_cost INT NOT NULL DEFAULT 5,
  xp_reward INT NOT NULL DEFAULT 50,
  unforgivable BOOLEAN NOT NULL DEFAULT false,
  level_req INT NOT NULL DEFAULT 5
);
GRANT SELECT ON public.dark_spells TO anon, authenticated;
GRANT ALL ON public.dark_spells TO service_role;
ALTER TABLE public.dark_spells ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dark spells readable" ON public.dark_spells FOR SELECT USING (true);

CREATE TABLE public.user_corruption (
  user_id UUID PRIMARY KEY,
  corruption INT NOT NULL DEFAULT 0,
  alignment TEXT NOT NULL DEFAULT 'neutral',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_corruption TO anon, authenticated;
GRANT INSERT, UPDATE ON public.user_corruption TO authenticated;
GRANT ALL ON public.user_corruption TO service_role;
ALTER TABLE public.user_corruption ENABLE ROW LEVEL SECURITY;
CREATE POLICY "corruption readable" ON public.user_corruption FOR SELECT USING (true);

CREATE TABLE public.horcruxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  vessel_name TEXT NOT NULL,
  description TEXT,
  destroyed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.horcruxes TO authenticated;
GRANT ALL ON public.horcruxes TO service_role;
ALTER TABLE public.horcruxes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own horcruxes" ON public.horcruxes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "create horcruxes" ON public.horcruxes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update horcruxes" ON public.horcruxes FOR UPDATE USING (auth.uid() = user_id);

-- 19.B + 19.C Factions
CREATE TABLE public.factions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  alignment TEXT NOT NULL, -- light | dark
  description TEXT,
  motto TEXT,
  hq_name TEXT
);
GRANT SELECT ON public.factions TO anon, authenticated;
GRANT ALL ON public.factions TO service_role;
ALTER TABLE public.factions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "factions readable" ON public.factions FOR SELECT USING (true);

CREATE TABLE public.user_factions (
  user_id UUID PRIMARY KEY,
  faction_id UUID NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
  rank TEXT NOT NULL DEFAULT 'recruta',
  loyalty INT NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_factions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.user_factions TO authenticated;
GRANT ALL ON public.user_factions TO service_role;
ALTER TABLE public.user_factions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "factions members readable" ON public.user_factions FOR SELECT USING (true);

CREATE TABLE public.faction_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faction_id UUID NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  briefing TEXT,
  difficulty INT NOT NULL DEFAULT 1,
  xp_reward INT NOT NULL DEFAULT 100,
  galleon_reward INT NOT NULL DEFAULT 50,
  loyalty_reward INT NOT NULL DEFAULT 10
);
GRANT SELECT ON public.faction_missions TO anon, authenticated;
GRANT ALL ON public.faction_missions TO service_role;
ALTER TABLE public.faction_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "missions readable" ON public.faction_missions FOR SELECT USING (true);

CREATE TABLE public.user_faction_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  mission_id UUID NOT NULL REFERENCES public.faction_missions(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, mission_id)
);
GRANT SELECT, INSERT ON public.user_faction_missions TO authenticated;
GRANT ALL ON public.user_faction_missions TO service_role;
ALTER TABLE public.user_faction_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own mission logs" ON public.user_faction_missions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "log own mission" ON public.user_faction_missions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Helpers
CREATE OR REPLACE FUNCTION public._alignment_label(c INT) RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN c >= 80 THEN 'sombrio'
    WHEN c >= 40 THEN 'corrompido'
    WHEN c >= 15 THEN 'instável'
    ELSE 'neutro'
  END;
$$;

-- RPC cast_dark_spell
CREATE OR REPLACE FUNCTION public.cast_dark_spell(p_spell TEXT)
RETURNS public.user_corruption
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  s public.dark_spells;
  r public.user_corruption;
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Sem autenticação'; END IF;
  SELECT * INTO s FROM public.dark_spells WHERE slug = p_spell;
  IF NOT FOUND THEN RAISE EXCEPTION 'Feitiço desconhecido'; END IF;
  INSERT INTO public.user_corruption(user_id, corruption, alignment)
  VALUES (uid, s.corruption_cost, public._alignment_label(s.corruption_cost))
  ON CONFLICT (user_id) DO UPDATE
    SET corruption = LEAST(100, user_corruption.corruption + s.corruption_cost),
        alignment = public._alignment_label(LEAST(100, user_corruption.corruption + s.corruption_cost)),
        updated_at = now()
  RETURNING * INTO r;
  RETURN r;
END $$;

-- RPC create_horcrux
CREATE OR REPLACE FUNCTION public.create_horcrux(p_vessel TEXT, p_description TEXT)
RETURNS public.horcruxes
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  r public.horcruxes;
  uid UUID := auth.uid();
  count_existing INT;
  current_corruption INT;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Sem autenticação'; END IF;
  SELECT COUNT(*) INTO count_existing FROM public.horcruxes WHERE user_id = uid AND NOT destroyed;
  IF count_existing >= 7 THEN RAISE EXCEPTION 'Sete horcruxes já é o limite mítico'; END IF;
  SELECT COALESCE(corruption, 0) INTO current_corruption FROM public.user_corruption WHERE user_id = uid;
  IF COALESCE(current_corruption,0) < 30 THEN RAISE EXCEPTION 'Sua alma ainda é pura demais'; END IF;
  INSERT INTO public.horcruxes(user_id, vessel_name, description)
  VALUES (uid, p_vessel, p_description) RETURNING * INTO r;
  UPDATE public.user_corruption SET corruption = LEAST(100, corruption + 10), updated_at = now() WHERE user_id = uid;
  RETURN r;
END $$;

-- RPC join_faction
CREATE OR REPLACE FUNCTION public.join_faction(p_faction TEXT)
RETURNS public.user_factions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  f public.factions;
  r public.user_factions;
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Sem autenticação'; END IF;
  SELECT * INTO f FROM public.factions WHERE slug = p_faction;
  IF NOT FOUND THEN RAISE EXCEPTION 'Facção inexistente'; END IF;
  INSERT INTO public.user_factions(user_id, faction_id)
  VALUES (uid, f.id)
  ON CONFLICT (user_id) DO UPDATE SET faction_id = f.id, rank = 'recruta', loyalty = 0, joined_at = now()
  RETURNING * INTO r;
  RETURN r;
END $$;

-- RPC complete_mission
CREATE OR REPLACE FUNCTION public.complete_mission(p_mission UUID)
RETURNS public.user_faction_missions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  m public.faction_missions;
  r public.user_faction_missions;
  uf public.user_factions;
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Sem autenticação'; END IF;
  SELECT * INTO m FROM public.faction_missions WHERE id = p_mission;
  IF NOT FOUND THEN RAISE EXCEPTION 'Missão não existe'; END IF;
  SELECT * INTO uf FROM public.user_factions WHERE user_id = uid;
  IF NOT FOUND OR uf.faction_id <> m.faction_id THEN RAISE EXCEPTION 'Você não pertence a esta facção'; END IF;
  INSERT INTO public.user_faction_missions(user_id, mission_id) VALUES (uid, p_mission)
  ON CONFLICT (user_id, mission_id) DO NOTHING
  RETURNING * INTO r;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Missão já cumprida'; END IF;
  UPDATE public.user_factions
     SET loyalty = loyalty + m.loyalty_reward,
         rank = CASE
           WHEN loyalty + m.loyalty_reward >= 200 THEN 'comandante'
           WHEN loyalty + m.loyalty_reward >= 100 THEN 'veterano'
           WHEN loyalty + m.loyalty_reward >= 40 THEN 'agente'
           ELSE 'recruta'
         END
   WHERE user_id = uid;
  RETURN r;
END $$;

-- Seeds
INSERT INTO public.dark_spells(slug, name, description, corruption_cost, xp_reward, unforgivable, level_req) VALUES
  ('crucio','Crucio','Maldição da dor — inflige sofrimento.',25,120,true,10),
  ('imperio','Imperio','Maldição do controle — domina o alvo.',20,110,true,12),
  ('avada','Avada Kedavra','A maldição mortal. Ninguém sobrevive.',40,200,true,15),
  ('morsmordre','Morsmordre','Invoca a Marca Negra no céu.',15,80,false,8),
  ('sectumsempra','Sectumsempra','Feitiço cortante de Snape.',10,70,false,7)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.factions(slug, name, alignment, description, motto, hq_name) VALUES
  ('order_phoenix','Ordem da Fênix','light','Sociedade secreta dedicada a deter as forças das trevas.','Onde houver fênix, haverá esperança.','Largo Grimmauld, 12'),
  ('death_eaters','Comensais da Morte','dark','Seguidores leais do Lorde das Trevas.','Sempre puros.','Mansão Malfoy')
ON CONFLICT (slug) DO NOTHING;

DO $$
DECLARE op UUID; de UUID;
BEGIN
  SELECT id INTO op FROM public.factions WHERE slug='order_phoenix';
  SELECT id INTO de FROM public.factions WHERE slug='death_eaters';
  IF NOT EXISTS (SELECT 1 FROM public.faction_missions WHERE faction_id = op) THEN
    INSERT INTO public.faction_missions(faction_id, name, briefing, difficulty, xp_reward, galleon_reward, loyalty_reward) VALUES
      (op,'Vigília no Ministério','Monitorar tentativas de infiltração das trevas.',1,120,80,15),
      (op,'Resgate em Hogsmeade','Salvar civis presos por Comensais infiltrados.',2,200,150,25),
      (op,'Proteger a Profecia','Impedir que a profecia caia em mãos sombrias.',3,350,250,40);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.faction_missions WHERE faction_id = de) THEN
    INSERT INTO public.faction_missions(faction_id, name, briefing, difficulty, xp_reward, galleon_reward, loyalty_reward) VALUES
      (de,'Marcar Trouxas','Espalhar terror em vilarejos trouxas.',1,120,80,15),
      (de,'Caçar Sangue-Ruim','Localizar e capturar nascidos-trouxas em fuga.',2,200,150,25),
      (de,'Invadir a Ordem','Sabotar o quartel-general da Fênix.',3,350,250,40);
  END IF;
END $$;