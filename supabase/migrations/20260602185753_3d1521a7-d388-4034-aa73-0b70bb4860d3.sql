
-- =============== QUESTS (estende existente) ===============
ALTER TABLE public.quests
  ADD COLUMN IF NOT EXISTS slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS region text NOT NULL DEFAULT 'castelo',
  ADD COLUMN IF NOT EXISTS difficulty integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS galeon_reward integer NOT NULL DEFAULT 25,
  ADD COLUMN IF NOT EXISTS cover_url text;

-- Garantir grants/RLS na quests existente
DO $$ BEGIN
  EXECUTE 'GRANT SELECT ON public.quests TO authenticated';
  EXECUTE 'GRANT ALL ON public.quests TO service_role';
END $$;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='quests' AND policyname='quests_select_v2') THEN
    EXECUTE 'CREATE POLICY quests_select_v2 ON public.quests FOR SELECT TO authenticated USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='quests' AND policyname='quests_admin_v2') THEN
    EXECUTE 'CREATE POLICY quests_admin_v2 ON public.quests FOR ALL TO authenticated USING (has_role(auth.uid(),''admin''::app_role)) WITH CHECK (has_role(auth.uid(),''admin''::app_role))';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.quest_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id uuid NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  step_order integer NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  narrative text NOT NULL DEFAULT '',
  action_hint text DEFAULT '',
  xp_reward integer NOT NULL DEFAULT 25,
  galeon_reward integer NOT NULL DEFAULT 5,
  UNIQUE (quest_id, step_order)
);
GRANT SELECT ON public.quest_steps TO authenticated;
GRANT ALL ON public.quest_steps TO service_role;
ALTER TABLE public.quest_steps ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='quest_steps' AND policyname='qs_select') THEN
    EXECUTE 'CREATE POLICY qs_select ON public.quest_steps FOR SELECT TO authenticated USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='quest_steps' AND policyname='qs_admin') THEN
    EXECUTE 'CREATE POLICY qs_admin ON public.quest_steps FOR ALL TO authenticated USING (has_role(auth.uid(),''admin''::app_role)) WITH CHECK (has_role(auth.uid(),''admin''::app_role))';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quest_id uuid NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  current_step integer NOT NULL DEFAULT 1,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  started_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, quest_id)
);
GRANT SELECT, INSERT, UPDATE ON public.user_quests TO authenticated;
GRANT ALL ON public.user_quests TO service_role;
ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_quests' AND policyname='uq_select') THEN
    EXECUTE 'CREATE POLICY uq_select ON public.user_quests FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(),''admin''::app_role))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_quests' AND policyname='uq_insert') THEN
    EXECUTE 'CREATE POLICY uq_insert ON public.user_quests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_quests' AND policyname='uq_update') THEN
    EXECUTE 'CREATE POLICY uq_update ON public.user_quests FOR UPDATE TO authenticated USING (user_id = auth.uid())';
  END IF;
END $$;

-- RPCs
CREATE OR REPLACE FUNCTION public.start_quest(p_quest_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid := auth.uid(); v_lvl int; v_min int; v_active boolean;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT min_level, active INTO v_min, v_active FROM public.quests WHERE id = p_quest_id;
  IF v_min IS NULL THEN RAISE EXCEPTION 'Quest não encontrada'; END IF;
  IF NOT v_active THEN RAISE EXCEPTION 'Quest indisponível'; END IF;
  SELECT level INTO v_lvl FROM public.profiles WHERE user_id = v_user;
  IF COALESCE(v_lvl,1) < v_min THEN RAISE EXCEPTION 'Você precisa do nível % para iniciar', v_min; END IF;
  INSERT INTO public.user_quests(user_id, quest_id) VALUES (v_user, p_quest_id)
    ON CONFLICT (user_id, quest_id) DO NOTHING;
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.complete_quest_step(p_quest_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid := auth.uid(); v_uq record; v_step record; v_total int; v_q record;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO v_uq FROM public.user_quests WHERE user_id=v_user AND quest_id=p_quest_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Inicie a quest primeiro'; END IF;
  IF v_uq.completed THEN RAISE EXCEPTION 'Quest já concluída'; END IF;
  SELECT * INTO v_step FROM public.quest_steps WHERE quest_id=p_quest_id AND step_order=v_uq.current_step;
  IF NOT FOUND THEN RAISE EXCEPTION 'Etapa inválida'; END IF;
  PERFORM public.award_xp_action('quest_step', v_user, v_step.xp_reward);
  PERFORM public.award_galeons(v_user, v_step.galeon_reward, 'Etapa: ' || v_step.title);

  SELECT count(*) INTO v_total FROM public.quest_steps WHERE quest_id = p_quest_id;
  IF v_uq.current_step >= v_total THEN
    SELECT * INTO v_q FROM public.quests WHERE id = p_quest_id;
    PERFORM public.award_xp_action('quest_complete', v_user, v_q.xp_reward);
    PERFORM public.award_galeons(v_user, COALESCE(v_q.galeon_reward,25), 'Quest concluída: ' || v_q.title);
    UPDATE public.user_quests SET completed=true, completed_at=now(), current_step=v_total
      WHERE id = v_uq.id;
    INSERT INTO public.notifications(user_id,title,message,link)
    VALUES (v_user, '🗺️ Quest concluída!', 'Você terminou: ' || v_q.title, '/dashboard/quests');
    RETURN jsonb_build_object('ok',true,'completed',true);
  ELSE
    UPDATE public.user_quests SET current_step = current_step + 1 WHERE id = v_uq.id;
    RETURN jsonb_build_object('ok',true,'completed',false,'next_step',v_uq.current_step+1);
  END IF;
END $$;

-- =============== PROPHET ARTICLES ===============
CREATE TABLE IF NOT EXISTS public.prophet_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'geral',
  image_url text,
  generated_at timestamptz NOT NULL DEFAULT now(),
  published boolean NOT NULL DEFAULT true
);
GRANT SELECT ON public.prophet_articles TO authenticated;
GRANT ALL ON public.prophet_articles TO service_role;
ALTER TABLE public.prophet_articles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='prophet_articles' AND policyname='prophet_select') THEN
    EXECUTE 'CREATE POLICY prophet_select ON public.prophet_articles FOR SELECT TO authenticated USING (published)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='prophet_articles' AND policyname='prophet_admin') THEN
    EXECUTE 'CREATE POLICY prophet_admin ON public.prophet_articles FOR ALL TO authenticated USING (has_role(auth.uid(),''admin''::app_role)) WITH CHECK (has_role(auth.uid(),''admin''::app_role))';
  END IF;
END $$;

-- =============== ANALYTICS VIEWS ===============
CREATE OR REPLACE VIEW public.analytics_daily_active AS
SELECT date_trunc('day', last_seen)::date AS day, count(*) AS active_users
FROM public.profiles
WHERE last_seen > now() - interval '30 days'
GROUP BY 1 ORDER BY 1;

CREATE OR REPLACE VIEW public.analytics_house_distribution AS
SELECT house::text AS house, count(*) AS total
FROM public.profiles
WHERE approved = true
GROUP BY house;

CREATE OR REPLACE VIEW public.analytics_retention_cohorts AS
SELECT
  date_trunc('week', created_at)::date AS cohort_week,
  count(*) AS signups,
  count(*) FILTER (WHERE last_seen > now() - interval '7 days') AS still_active
FROM public.profiles
WHERE created_at > now() - interval '90 days'
GROUP BY 1 ORDER BY 1;

CREATE OR REPLACE VIEW public.analytics_vip_funnel AS
SELECT
  (SELECT count(*) FROM public.profiles) AS total_users,
  (SELECT count(*) FROM public.profiles WHERE vip_plan IS NOT NULL) AS vip_users,
  (SELECT count(*) FROM public.galeon_orders WHERE status='paid') AS paid_orders,
  (SELECT COALESCE(sum(amount_brl),0) FROM public.galeon_orders WHERE status='paid') AS lifetime_revenue_brl;

GRANT SELECT ON public.analytics_daily_active TO authenticated;
GRANT SELECT ON public.analytics_house_distribution TO authenticated;
GRANT SELECT ON public.analytics_retention_cohorts TO authenticated;
GRANT SELECT ON public.analytics_vip_funnel TO authenticated;

-- =============== SEED 3 QUESTS ===============
INSERT INTO public.quests(slug,title,description,region,difficulty,min_level,xp_reward,galeon_reward,active)
VALUES
  ('floresta-aranhas','Aranhas da Floresta Proibida','Hagrid pediu ajuda: as aranhas estão inquietas. Investigue a clareira.','floresta',3,5,250,60,true),
  ('beco-noturna','Mistério na Travessa do Tranco','Sombras estranhas circulam pelo Beco. Descubra quem move os comensais.','beco',4,8,350,90,true),
  ('hogsmeade-bicho','Trasgo solto em Hogsmeade','Um trasgo apareceu no Três Vassouras. Acalme os moradores e contenha a fera.','hogsmeade',2,3,180,40,true)
ON CONFLICT (slug) DO NOTHING;

WITH q AS (SELECT id, slug FROM public.quests WHERE slug IN ('floresta-aranhas','beco-noturna','hogsmeade-bicho'))
INSERT INTO public.quest_steps(quest_id, step_order, title, description, narrative, action_hint, xp_reward, galeon_reward)
SELECT q.id, s.step_order, s.title, s.description, s.narrative, s.action_hint, s.xp_reward, s.galeon_reward
FROM q
JOIN (VALUES
  ('floresta-aranhas',1,'Encontrar Hagrid','Vá até a cabana e ouça o pedido.','Hagrid recebe você com sorriso preocupado e um bolo de pedra.','Conversar com Hagrid',30,5),
  ('floresta-aranhas',2,'Rastrear a clareira','Siga as marcas de teia.','Você se embrenha na mata; ramos rangem.','Lançar Lumos',50,10),
  ('floresta-aranhas',3,'Confrontar Aragog','Apresente-se com respeito.','Os olhos enormes brilham no escuro.','Provar respeito',80,20),
  ('beco-noturna',1,'Entrar no Beco','Use sua capa.','O ar pesa, lampiões piscam.','Esconder-se',40,8),
  ('beco-noturna',2,'Espiar a loja Borgin','Observe os clientes.','Sussurros em código antigo.','Decifrar bilhete',60,15),
  ('beco-noturna',3,'Recuperar o medalhão','Fuja antes que percebam.','Passos atrás de você ecoam.','Aparatar',100,30),
  ('hogsmeade-bicho',1,'Avisar Madame Rosmerta','Acalme a clientela.','Cervejas amanteigadas voam pelos ares.','Falar com clientes',40,8),
  ('hogsmeade-bicho',2,'Conter o trasgo','Use um feitiço estuporante.','O trasgo gira a maça.','Lançar Stupefy',80,20)
) s(slug,step_order,title,description,narrative,action_hint,xp_reward,galeon_reward) ON s.slug = q.slug
ON CONFLICT (quest_id, step_order) DO NOTHING;
