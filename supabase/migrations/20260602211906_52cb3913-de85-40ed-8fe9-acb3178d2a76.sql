-- Phase 16: Magical Nature & Alchemy

-- 16.A Magical Creatures
CREATE TABLE public.creature_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  species text NOT NULL,
  description text,
  icon text DEFAULT '🐾',
  rarity text DEFAULT 'common',
  adopt_cost integer NOT NULL DEFAULT 50,
  food_preference text DEFAULT 'generic',
  max_bond integer NOT NULL DEFAULT 100,
  active boolean DEFAULT true
);
GRANT SELECT ON public.creature_catalog TO anon, authenticated;
GRANT ALL ON public.creature_catalog TO service_role;
ALTER TABLE public.creature_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Catalog public" ON public.creature_catalog FOR SELECT USING (true);
CREATE POLICY "Admins manage catalog" ON public.creature_catalog FOR ALL USING (has_role(auth.uid(),'admin'::app_role));

CREATE TABLE public.user_creatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  creature_id uuid NOT NULL REFERENCES public.creature_catalog(id) ON DELETE CASCADE,
  nickname text NOT NULL,
  bond integer NOT NULL DEFAULT 10,
  hunger integer NOT NULL DEFAULT 50,
  training_level integer NOT NULL DEFAULT 1,
  last_fed_at timestamptz DEFAULT now(),
  last_trained_at timestamptz DEFAULT now(),
  adopted_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_creatures TO authenticated;
GRANT ALL ON public.user_creatures TO service_role;
ALTER TABLE public.user_creatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own creatures read" ON public.user_creatures FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own creatures insert" ON public.user_creatures FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own creatures update" ON public.user_creatures FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Own creatures delete" ON public.user_creatures FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.adopt_creature(p_creature_id uuid, p_nickname text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid := auth.uid(); v_c record; v_bal int;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO v_c FROM public.creature_catalog WHERE id = p_creature_id AND active;
  IF NOT FOUND THEN RAISE EXCEPTION 'Criatura indisponível'; END IF;
  SELECT COALESCE(galeons,0) INTO v_bal FROM public.profiles WHERE user_id = v_user;
  IF v_bal < v_c.adopt_cost THEN RAISE EXCEPTION 'Galeões insuficientes'; END IF;
  UPDATE public.profiles SET galeons = galeons - v_c.adopt_cost WHERE user_id = v_user;
  INSERT INTO public.user_creatures(user_id, creature_id, nickname) VALUES (v_user, p_creature_id, p_nickname);
  INSERT INTO public.notifications(user_id, title, message)
  VALUES (v_user, '🐾 Nova criatura adotada!', p_nickname || ' agora faz parte da sua reserva.');
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.feed_creature(p_user_creature_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid := auth.uid(); v_uc record;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO v_uc FROM public.user_creatures WHERE id = p_user_creature_id AND user_id = v_user FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Criatura não encontrada'; END IF;
  IF v_uc.hunger >= 90 THEN RAISE EXCEPTION 'Está saciada'; END IF;
  UPDATE public.user_creatures
     SET hunger = LEAST(100, hunger + 25),
         bond = LEAST(100, bond + 3),
         last_fed_at = now()
   WHERE id = p_user_creature_id;
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.train_creature(p_user_creature_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid := auth.uid(); v_uc record;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO v_uc FROM public.user_creatures WHERE id = p_user_creature_id AND user_id = v_user FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Criatura não encontrada'; END IF;
  IF v_uc.hunger < 20 THEN RAISE EXCEPTION 'Alimente antes de treinar'; END IF;
  IF EXTRACT(EPOCH FROM (now() - v_uc.last_trained_at)) < 3600 THEN RAISE EXCEPTION 'Treine novamente em 1h'; END IF;
  UPDATE public.user_creatures
     SET training_level = LEAST(10, training_level + 1),
         bond = LEAST(100, bond + 5),
         hunger = GREATEST(0, hunger - 15),
         last_trained_at = now()
   WHERE id = p_user_creature_id;
  PERFORM public.award_xp_action('creature_train', v_user, 15);
  RETURN jsonb_build_object('ok', true);
END $$;

-- 16.B Herbology Greenhouse
CREATE TABLE public.plant_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  icon text DEFAULT '🌱',
  rarity text DEFAULT 'common',
  seed_cost integer NOT NULL DEFAULT 10,
  grow_hours integer NOT NULL DEFAULT 4,
  yield_min integer NOT NULL DEFAULT 1,
  yield_max integer NOT NULL DEFAULT 3,
  active boolean DEFAULT true
);
GRANT SELECT ON public.plant_catalog TO anon, authenticated;
GRANT ALL ON public.plant_catalog TO service_role;
ALTER TABLE public.plant_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plants public" ON public.plant_catalog FOR SELECT USING (true);
CREATE POLICY "Admins manage plants" ON public.plant_catalog FOR ALL USING (has_role(auth.uid(),'admin'::app_role));

CREATE TABLE public.greenhouse_plots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plant_id uuid REFERENCES public.plant_catalog(id) ON DELETE SET NULL,
  planted_at timestamptz,
  ready_at timestamptz,
  watered_at timestamptz,
  slot_number integer NOT NULL,
  UNIQUE(user_id, slot_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.greenhouse_plots TO authenticated;
GRANT ALL ON public.greenhouse_plots TO service_role;
ALTER TABLE public.greenhouse_plots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own plots" ON public.greenhouse_plots FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.user_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ingredient_slug text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  UNIQUE(user_id, ingredient_slug)
);
GRANT SELECT, INSERT, UPDATE ON public.user_ingredients TO authenticated;
GRANT ALL ON public.user_ingredients TO service_role;
ALTER TABLE public.user_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own ingredients" ON public.user_ingredients FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.plant_seed(p_slot integer, p_plant_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid := auth.uid(); v_p record; v_bal int;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF p_slot < 1 OR p_slot > 6 THEN RAISE EXCEPTION 'Slot inválido (1-6)'; END IF;
  SELECT * INTO v_p FROM public.plant_catalog WHERE id = p_plant_id AND active;
  IF NOT FOUND THEN RAISE EXCEPTION 'Planta indisponível'; END IF;
  SELECT COALESCE(galeons,0) INTO v_bal FROM public.profiles WHERE user_id = v_user;
  IF v_bal < v_p.seed_cost THEN RAISE EXCEPTION 'Galeões insuficientes'; END IF;
  IF EXISTS (SELECT 1 FROM public.greenhouse_plots WHERE user_id=v_user AND slot_number=p_slot AND plant_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Slot já ocupado';
  END IF;
  UPDATE public.profiles SET galeons = galeons - v_p.seed_cost WHERE user_id = v_user;
  INSERT INTO public.greenhouse_plots(user_id, plant_id, planted_at, ready_at, watered_at, slot_number)
  VALUES (v_user, p_plant_id, now(), now() + (v_p.grow_hours||' hours')::interval, now(), p_slot)
  ON CONFLICT (user_id, slot_number) DO UPDATE
    SET plant_id = EXCLUDED.plant_id, planted_at = EXCLUDED.planted_at,
        ready_at = EXCLUDED.ready_at, watered_at = EXCLUDED.watered_at;
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.water_plot(p_slot integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid := auth.uid(); v_plot record;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO v_plot FROM public.greenhouse_plots WHERE user_id=v_user AND slot_number=p_slot FOR UPDATE;
  IF NOT FOUND OR v_plot.plant_id IS NULL THEN RAISE EXCEPTION 'Slot vazio'; END IF;
  IF EXTRACT(EPOCH FROM (now() - v_plot.watered_at)) < 1800 THEN RAISE EXCEPTION 'Já regada recentemente'; END IF;
  UPDATE public.greenhouse_plots
     SET watered_at = now(),
         ready_at = ready_at - INTERVAL '15 minutes'
   WHERE id = v_plot.id;
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.harvest_plot(p_slot integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid := auth.uid(); v_plot record; v_p record; v_yield int;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO v_plot FROM public.greenhouse_plots WHERE user_id=v_user AND slot_number=p_slot FOR UPDATE;
  IF NOT FOUND OR v_plot.plant_id IS NULL THEN RAISE EXCEPTION 'Slot vazio'; END IF;
  IF now() < v_plot.ready_at THEN RAISE EXCEPTION 'Ainda não está pronta'; END IF;
  SELECT * INTO v_p FROM public.plant_catalog WHERE id = v_plot.plant_id;
  v_yield := v_p.yield_min + floor(random() * (v_p.yield_max - v_p.yield_min + 1))::int;
  INSERT INTO public.user_ingredients(user_id, ingredient_slug, quantity)
  VALUES (v_user, v_p.slug, v_yield)
  ON CONFLICT (user_id, ingredient_slug) DO UPDATE SET quantity = public.user_ingredients.quantity + v_yield;
  UPDATE public.greenhouse_plots SET plant_id = NULL, planted_at = NULL, ready_at = NULL, watered_at = NULL WHERE id = v_plot.id;
  PERFORM public.award_xp_action('harvest', v_user, 10);
  RETURN jsonb_build_object('ok', true, 'yield', v_yield, 'ingredient', v_p.name);
END $$;

-- 16.C Potions Lab
CREATE TABLE public.potion_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  icon text DEFAULT '🧪',
  difficulty integer NOT NULL DEFAULT 1,
  brew_minutes integer NOT NULL DEFAULT 30,
  ingredients jsonb NOT NULL,
  xp_reward integer NOT NULL DEFAULT 50,
  galeon_reward integer NOT NULL DEFAULT 20,
  min_level integer NOT NULL DEFAULT 1,
  active boolean DEFAULT true
);
GRANT SELECT ON public.potion_recipes TO anon, authenticated;
GRANT ALL ON public.potion_recipes TO service_role;
ALTER TABLE public.potion_recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recipes public" ON public.potion_recipes FOR SELECT USING (true);
CREATE POLICY "Admins manage recipes" ON public.potion_recipes FOR ALL USING (has_role(auth.uid(),'admin'::app_role));

CREATE TABLE public.user_potions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  recipe_id uuid NOT NULL REFERENCES public.potion_recipes(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'brewing',
  started_at timestamptz DEFAULT now(),
  ready_at timestamptz NOT NULL,
  collected_at timestamptz,
  success boolean
);
GRANT SELECT, INSERT, UPDATE ON public.user_potions TO authenticated;
GRANT ALL ON public.user_potions TO service_role;
ALTER TABLE public.user_potions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own potions" ON public.user_potions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.brew_potion(p_recipe_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid := auth.uid(); v_r record; v_ing record; v_lvl int; v_have int;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO v_r FROM public.potion_recipes WHERE id = p_recipe_id AND active;
  IF NOT FOUND THEN RAISE EXCEPTION 'Receita indisponível'; END IF;
  SELECT level INTO v_lvl FROM public.profiles WHERE user_id = v_user;
  IF COALESCE(v_lvl,1) < v_r.min_level THEN RAISE EXCEPTION 'Nível mínimo: %', v_r.min_level; END IF;
  IF EXISTS (SELECT 1 FROM public.user_potions WHERE user_id=v_user AND status='brewing') THEN
    RAISE EXCEPTION 'Você já tem uma poção em fervura';
  END IF;
  -- check & deduct ingredients
  FOR v_ing IN SELECT key AS slug, (value)::int AS qty FROM jsonb_each_text(v_r.ingredients) LOOP
    SELECT COALESCE(quantity,0) INTO v_have FROM public.user_ingredients WHERE user_id=v_user AND ingredient_slug=v_ing.slug;
    IF COALESCE(v_have,0) < v_ing.qty THEN RAISE EXCEPTION 'Ingrediente insuficiente: %', v_ing.slug; END IF;
  END LOOP;
  FOR v_ing IN SELECT key AS slug, (value)::int AS qty FROM jsonb_each_text(v_r.ingredients) LOOP
    UPDATE public.user_ingredients SET quantity = quantity - v_ing.qty WHERE user_id=v_user AND ingredient_slug=v_ing.slug;
  END LOOP;
  INSERT INTO public.user_potions(user_id, recipe_id, ready_at)
  VALUES (v_user, p_recipe_id, now() + (v_r.brew_minutes||' minutes')::interval);
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.collect_potion(p_potion_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid := auth.uid(); v_up record; v_r record; v_success boolean; v_chance int;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO v_up FROM public.user_potions WHERE id=p_potion_id AND user_id=v_user FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Poção não encontrada'; END IF;
  IF v_up.status <> 'brewing' THEN RAISE EXCEPTION 'Já coletada'; END IF;
  IF now() < v_up.ready_at THEN RAISE EXCEPTION 'Ainda em fervura'; END IF;
  SELECT * INTO v_r FROM public.potion_recipes WHERE id = v_up.recipe_id;
  v_chance := 100 - (v_r.difficulty * 10);
  v_success := (floor(random()*100)::int < v_chance);
  UPDATE public.user_potions SET status = CASE WHEN v_success THEN 'success' ELSE 'failed' END,
    success = v_success, collected_at = now() WHERE id = p_potion_id;
  IF v_success THEN
    PERFORM public.award_xp_action('brew', v_user, v_r.xp_reward);
    PERFORM public.credit_galeons_atomic(v_user, v_r.galeon_reward);
    INSERT INTO public.notifications(user_id, title, message)
    VALUES (v_user, '🧪 Poção pronta!', v_r.name || ' fervida com sucesso (+' || v_r.xp_reward || ' XP)');
  ELSE
    INSERT INTO public.notifications(user_id, title, message)
    VALUES (v_user, '💥 Poção arruinada', v_r.name || ' explodiu no caldeirão!');
  END IF;
  RETURN jsonb_build_object('ok', true, 'success', v_success);
END $$;

-- Seeds
INSERT INTO public.creature_catalog(slug, name, species, description, icon, rarity, adopt_cost) VALUES
  ('niffler', 'Niffler', 'Fofo & Tagarela', 'Criatura peluda obcecada por objetos brilhantes.', '🦔', 'common', 80),
  ('hipogrifo', 'Hipogrifo', 'Híbrido', 'Metade águia, metade cavalo. Exige reverência.', '🦅', 'rare', 250),
  ('dragonete', 'Dragonete', 'Réptil', 'Filhote de dragão norueguês. Cuspe brasas.', '🐉', 'epic', 500),
  ('puffskein', 'Puffskein', 'Esponja Viva', 'Bola fofa que come ranho. Inofensivo.', '🟡', 'common', 40),
  ('fenix', 'Fênix Filhote', 'Ave Mística', 'Renasce das cinzas. Lágrimas curam.', '🔥', 'legendary', 1000),
  ('crup', 'Crup', 'Canino', 'Parece Jack Russell, mas tem cauda bifurcada.', '🐕', 'common', 60);

INSERT INTO public.plant_catalog(slug, name, description, icon, rarity, seed_cost, grow_hours, yield_min, yield_max) VALUES
  ('mandragora', 'Mandrágora', 'O choro derruba qualquer um. Use abafadores.', '🌿', 'rare', 50, 8, 1, 2),
  ('visgo_diabo', 'Visgo do Diabo', 'Enroscadora mortal. Cresce nas trevas.', '🌑', 'rare', 60, 6, 1, 3),
  ('dittany', 'Dittany', 'Cura ferimentos profundos quase instantaneamente.', '🌸', 'epic', 80, 12, 1, 2),
  ('asfodelo', 'Asfódelo', 'Lírio dos mortos. Base para Filtro dos Mortos-Vivos.', '🌼', 'common', 20, 4, 2, 4),
  ('losna', 'Losna', 'Amargo herbal. Essencial em poções fortes.', '🌾', 'common', 15, 3, 2, 5),
  ('valeriana', 'Raiz de Valeriana', 'Induz sono profundo.', '🌱', 'common', 18, 4, 2, 4),
  ('belladona', 'Beladona', 'Bela e mortífera. Manejo cuidadoso.', '🟣', 'rare', 70, 10, 1, 2);

INSERT INTO public.potion_recipes(slug, name, description, icon, difficulty, brew_minutes, ingredients, xp_reward, galeon_reward, min_level) VALUES
  ('cura_pequena', 'Poção de Cura Menor', 'Restaura ferimentos leves.', '🧪', 1, 15, '{"dittany":1,"losna":2}'::jsonb, 50, 20, 1),
  ('mortos_vivos', 'Filtro dos Mortos-Vivos', 'Sono profundo, quase morte.', '⚗️', 3, 60, '{"asfodelo":2,"losna":3,"valeriana":1}'::jsonb, 200, 100, 8),
  ('polissuco', 'Poção Polissuco', 'Assume aparência de outra pessoa.', '🧬', 4, 90, '{"mandragora":1,"belladona":1,"dittany":2}'::jsonb, 400, 250, 12),
  ('felix_felicis', 'Felix Felicis', 'Sorte líquida. Tudo dá certo.', '✨', 5, 120, '{"mandragora":2,"dittany":2,"belladona":1,"valeriana":2}'::jsonb, 800, 500, 18),
  ('veritaserum', 'Veritaserum', 'Soro da verdade. 3 gotas bastam.', '💧', 4, 75, '{"belladona":2,"valeriana":2,"asfodelo":1}'::jsonb, 500, 300, 14),
  ('crescimento', 'Poção de Crescimento Capilar', 'Faz cabelo crescer rapidamente.', '🧴', 1, 10, '{"losna":2,"valeriana":1}'::jsonb, 30, 15, 1);