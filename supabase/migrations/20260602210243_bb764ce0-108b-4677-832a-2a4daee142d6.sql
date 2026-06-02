
-- 14.A: Praticar feitiço (extensão)
ALTER TABLE public.user_spells
  ADD COLUMN IF NOT EXISTS times_practiced int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_practiced_at timestamptz;

CREATE TABLE public.spell_combos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  emoji text NOT NULL DEFAULT '✨',
  spell_sequence text[] NOT NULL,
  bonus_xp int NOT NULL DEFAULT 50,
  bonus_galeons int NOT NULL DEFAULT 10,
  rarity text NOT NULL DEFAULT 'rare',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.spell_combos TO anon, authenticated;
GRANT ALL ON public.spell_combos TO service_role;
ALTER TABLE public.spell_combos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "combos_public_read" ON public.spell_combos FOR SELECT USING (active = true);
CREATE POLICY "combos_admin_write" ON public.spell_combos FOR ALL USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- 14.B: Exames oficiais
CREATE TABLE public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  title text NOT NULL,
  description text,
  exam_type text NOT NULL DEFAULT 'NOM' CHECK (exam_type IN ('NOM','NIEM','quiz')),
  min_year int NOT NULL DEFAULT 1,
  duration_minutes int NOT NULL DEFAULT 30,
  passing_percentage int NOT NULL DEFAULT 60,
  xp_reward int NOT NULL DEFAULT 100,
  galeons_reward int NOT NULL DEFAULT 20,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.exams TO authenticated;
GRANT ALL ON public.exams TO service_role;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exams_read" ON public.exams FOR SELECT TO authenticated USING (active = true OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "exams_admin_write" ON public.exams FOR ALL USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE TABLE public.exam_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_index int NOT NULL,
  explanation text,
  order_idx int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.exam_questions TO authenticated;
GRANT ALL ON public.exam_questions TO service_role;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions_read" ON public.exam_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "questions_admin_write" ON public.exam_questions FOR ALL USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE TABLE public.exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  score int NOT NULL DEFAULT 0,
  total int NOT NULL DEFAULT 0,
  percentage int NOT NULL DEFAULT 0,
  grade text NOT NULL,
  passed boolean NOT NULL DEFAULT false,
  answers jsonb,
  taken_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.exam_attempts TO authenticated;
GRANT ALL ON public.exam_attempts TO service_role;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attempts_owner_read" ON public.exam_attempts FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'::app_role));
CREATE INDEX idx_attempts_user ON public.exam_attempts(user_id, taken_at DESC);

-- 14.C: Detenções & Méritos
CREATE TABLE public.detentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  assigned_by uuid,
  reason text NOT NULL,
  hours int NOT NULL DEFAULT 1 CHECK (hours BETWEEN 1 AND 24),
  task_description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','pardoned')),
  points_deducted int NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
GRANT SELECT, UPDATE ON public.detentions TO authenticated;
GRANT ALL ON public.detentions TO service_role;
ALTER TABLE public.detentions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "detentions_read" ON public.detentions FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "detentions_admin_write" ON public.detentions FOR ALL USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE TABLE public.merits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  given_by uuid,
  reason text NOT NULL,
  points int NOT NULL DEFAULT 5 CHECK (points BETWEEN 1 AND 100),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.merits TO authenticated;
GRANT ALL ON public.merits TO service_role;
ALTER TABLE public.merits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "merits_read" ON public.merits FOR SELECT TO authenticated USING (true);
CREATE POLICY "merits_admin_write" ON public.merits FOR ALL USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- ========== RPC ==========
CREATE OR REPLACE FUNCTION public.practice_spell(p_spell_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid := auth.uid(); v_row record; v_xp int := 5;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO v_row FROM public.user_spells WHERE user_id = v_user AND spell_id = p_spell_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Você ainda não aprendeu este feitiço'; END IF;
  IF v_row.last_practiced_at IS NOT NULL AND now() - v_row.last_practiced_at < interval '30 seconds' THEN
    RAISE EXCEPTION 'Aguarde alguns segundos antes de praticar novamente';
  END IF;
  UPDATE public.user_spells SET
    times_practiced = times_practiced + 1,
    last_practiced_at = now(),
    mastery_level = LEAST(5, mastery_level + CASE WHEN (times_practiced + 1) % 10 = 0 THEN 1 ELSE 0 END)
  WHERE id = v_row.id;
  PERFORM public.award_xp_action('spell_practice', v_user, v_xp);
  RETURN jsonb_build_object('ok', true, 'xp', v_xp);
END $$;

CREATE OR REPLACE FUNCTION public.submit_exam(p_exam_id uuid, p_answers jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_exam record; v_q record; v_score int := 0; v_total int := 0;
  v_pct int; v_grade text; v_passed boolean; v_idx int;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO v_exam FROM public.exams WHERE id = p_exam_id AND active;
  IF NOT FOUND THEN RAISE EXCEPTION 'Exame indisponível'; END IF;
  FOR v_q IN SELECT * FROM public.exam_questions WHERE exam_id = p_exam_id LOOP
    v_total := v_total + 1;
    v_idx := COALESCE((p_answers->>v_q.id::text)::int, -1);
    IF v_idx = v_q.correct_index THEN v_score := v_score + 1; END IF;
  END LOOP;
  IF v_total = 0 THEN RAISE EXCEPTION 'Exame sem perguntas'; END IF;
  v_pct := (v_score * 100) / v_total;
  v_passed := v_pct >= v_exam.passing_percentage;
  v_grade := CASE
    WHEN v_pct >= 90 THEN 'O'   -- Ótimo
    WHEN v_pct >= 75 THEN 'E'   -- Excede Expectativas
    WHEN v_pct >= 60 THEN 'A'   -- Aceitável
    WHEN v_pct >= 40 THEN 'P'   -- Péssimo
    WHEN v_pct >= 20 THEN 'D'   -- Desastroso
    ELSE 'T'                    -- Trasgo
  END;
  INSERT INTO public.exam_attempts(user_id, exam_id, score, total, percentage, grade, passed, answers)
  VALUES (v_user, p_exam_id, v_score, v_total, v_pct, v_grade, v_passed, p_answers);
  IF v_passed THEN
    PERFORM public.award_xp_action('exam_pass', v_user, v_exam.xp_reward);
    PERFORM public.credit_galeons_atomic(v_user, v_exam.galeons_reward);
    INSERT INTO public.notifications(user_id, title, message, link)
    VALUES (v_user, '📜 Exame aprovado!', v_exam.title || ' — Nota: ' || v_grade, '/dashboard/exams');
  ELSE
    INSERT INTO public.notifications(user_id, title, message, link)
    VALUES (v_user, '📕 Exame reprovado', v_exam.title || ' — Nota: ' || v_grade, '/dashboard/exams');
  END IF;
  RETURN jsonb_build_object('ok', true, 'score', v_score, 'total', v_total, 'percentage', v_pct, 'grade', v_grade, 'passed', v_passed);
END $$;

CREATE OR REPLACE FUNCTION public.complete_detention(p_detention_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid := auth.uid(); v_d record;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO v_d FROM public.detentions WHERE id = p_detention_id FOR UPDATE;
  IF NOT FOUND OR v_d.user_id <> v_user THEN RAISE EXCEPTION 'Detenção não encontrada'; END IF;
  IF v_d.status <> 'pending' THEN RAISE EXCEPTION 'Detenção já encerrada'; END IF;
  UPDATE public.detentions SET status='completed', completed_at=now() WHERE id = p_detention_id;
  INSERT INTO public.notifications(user_id, title, message, link)
  VALUES (v_user, '🧹 Detenção cumprida', 'Você cumpriu sua punição. Comporte-se!', '/dashboard/discipline');
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.grant_merit(p_user_id uuid, p_reason text, p_points int DEFAULT 5)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_admin uuid := auth.uid(); v_house public.house_type;
BEGIN
  IF NOT has_role(v_admin,'admin'::app_role) THEN RAISE EXCEPTION 'Apenas administradores'; END IF;
  INSERT INTO public.merits(user_id, given_by, reason, points) VALUES (p_user_id, v_admin, p_reason, p_points);
  SELECT house INTO v_house FROM public.profiles WHERE user_id = p_user_id;
  IF v_house IS NOT NULL THEN
    INSERT INTO public.house_points(house, points, reason, awarded_by) VALUES (v_house, p_points, 'Mérito: ' || p_reason, v_admin);
  END IF;
  INSERT INTO public.notifications(user_id, title, message, link)
  VALUES (p_user_id, '🏆 Mérito recebido!', p_reason || ' (+' || p_points || ' pts)', '/dashboard/discipline');
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.assign_detention(p_user_id uuid, p_reason text, p_hours int DEFAULT 1, p_task text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_admin uuid := auth.uid(); v_house public.house_type; v_pts int;
BEGIN
  IF NOT has_role(v_admin,'admin'::app_role) THEN RAISE EXCEPTION 'Apenas administradores'; END IF;
  v_pts := p_hours * 10;
  INSERT INTO public.detentions(user_id, assigned_by, reason, hours, task_description, points_deducted)
  VALUES (p_user_id, v_admin, p_reason, p_hours, p_task, v_pts);
  SELECT house INTO v_house FROM public.profiles WHERE user_id = p_user_id;
  IF v_house IS NOT NULL THEN
    INSERT INTO public.house_points(house, points, reason, awarded_by) VALUES (v_house, -v_pts, 'Detenção: ' || p_reason, v_admin);
  END IF;
  INSERT INTO public.notifications(user_id, title, message, link)
  VALUES (p_user_id, '🧹 Detenção aplicada', p_reason || ' (' || p_hours || 'h, -' || v_pts || ' pts)', '/dashboard/discipline');
  RETURN jsonb_build_object('ok', true);
END $$;

-- ========== SEEDS ==========
INSERT INTO public.exams (subject, title, description, exam_type, min_year, duration_minutes, passing_percentage, xp_reward, galeons_reward) VALUES
('Feitiços','N.O.M. de Feitiços','Avalia conhecimento dos feitiços básicos','NOM',5,30,60,150,30),
('Poções','N.O.M. de Poções','Reconhecimento de poções e ingredientes','NOM',5,30,60,150,30),
('Defesa Contra as Artes das Trevas','N.O.M. de DCAT','Criaturas e maldições','NOM',5,30,60,150,30),
('Transfiguração','N.O.M. de Transfiguração','Princípios da transfiguração','NOM',5,30,60,150,30),
('História da Magia','Quiz: História da Magia','Eventos do mundo bruxo','quiz',1,15,50,50,10);

WITH e AS (SELECT id, title FROM public.exams)
INSERT INTO public.exam_questions (exam_id, question, options, correct_index, order_idx)
SELECT id,
  'Qual feitiço faz objetos levitarem?',
  '["Lumos","Wingardium Leviosa","Expelliarmus","Alohomora"]'::jsonb, 1, 1
FROM e WHERE title = 'N.O.M. de Feitiços'
UNION ALL
SELECT id, 'Qual feitiço desarma o oponente?',
  '["Stupefy","Expelliarmus","Petrificus Totalus","Crucio"]'::jsonb, 1, 2
FROM e WHERE title = 'N.O.M. de Feitiços'
UNION ALL
SELECT id, 'Qual feitiço produz luz na ponta da varinha?',
  '["Nox","Incendio","Lumos","Sonorus"]'::jsonb, 2, 3
FROM e WHERE title = 'N.O.M. de Feitiços'
UNION ALL
SELECT id, 'Qual feitiço destranca portas?',
  '["Colloportus","Alohomora","Reducto","Bombarda"]'::jsonb, 1, 4
FROM e WHERE title = 'N.O.M. de Feitiços'
UNION ALL
SELECT id, 'Qual o ingrediente principal da Poção Polissuco?',
  '["Asfódelo","Pelo da pessoa-alvo","Sangue de dragão","Mandrágora"]'::jsonb, 1, 1
FROM e WHERE title = 'N.O.M. de Poções'
UNION ALL
SELECT id, 'Quantas voltas no sentido horário ao preparar Felix Felicis?',
  '["3","7","13","21"]'::jsonb, 1, 2
FROM e WHERE title = 'N.O.M. de Poções'
UNION ALL
SELECT id, 'Bezoar é encontrado em qual animal?',
  '["Estômago de cabra","Ovo de fênix","Sangue de unicórnio","Pele de basilisco"]'::jsonb, 0, 3
FROM e WHERE title = 'N.O.M. de Poções'
UNION ALL
SELECT id, 'Qual o feitiço para conjurar um Patrono?',
  '["Riddikulus","Expecto Patronum","Lumos Maxima","Protego"]'::jsonb, 1, 1
FROM e WHERE title = 'N.O.M. de DCAT'
UNION ALL
SELECT id, 'O que enfrenta um Bicho-Papão?',
  '["Riddikulus","Stupefy","Reducto","Expelliarmus"]'::jsonb, 0, 2
FROM e WHERE title = 'N.O.M. de DCAT'
UNION ALL
SELECT id, 'Quantas Maldições Imperdoáveis existem?',
  '["2","3","4","5"]'::jsonb, 1, 3
FROM e WHERE title = 'N.O.M. de DCAT'
UNION ALL
SELECT id, 'Quem é o professor padrão de Transfiguração?',
  '["Snape","McGonagall","Flitwick","Sprout"]'::jsonb, 1, 1
FROM e WHERE title = 'N.O.M. de Transfiguração'
UNION ALL
SELECT id, 'Animago é alguém que:',
  '["Fala com cobras","Transforma-se em animal","Cria poções","Lê mentes"]'::jsonb, 1, 2
FROM e WHERE title = 'N.O.M. de Transfiguração'
UNION ALL
SELECT id, 'Em que ano Hogwarts foi fundada (aprox.)?',
  '["Século IX","Século X","Século XII","Século XV"]'::jsonb, 1, 1
FROM e WHERE title = 'Quiz: História da Magia'
UNION ALL
SELECT id, 'Quem fundou a casa Sonserina?',
  '["Godric Gryffindor","Salazar Slytherin","Helga Hufflepuff","Rowena Ravenclaw"]'::jsonb, 1, 2
FROM e WHERE title = 'Quiz: História da Magia'
UNION ALL
SELECT id, 'Qual foi a primeira guerra bruxa?',
  '["Contra Grindelwald","Contra Voldemort I","Contra trasgos","Goblins de 1612"]'::jsonb, 0, 3
FROM e WHERE title = 'Quiz: História da Magia';

INSERT INTO public.spell_combos (name, description, emoji, spell_sequence, bonus_xp, bonus_galeons, rarity) VALUES
('Defesa Total','Protego seguido de Stupefy','🛡️',ARRAY['Protego','Stupefy'],75,15,'rare'),
('Cura Veloz','Episkey + Vulnera Sanentur','💚',ARRAY['Episkey','Vulnera Sanentur'],100,25,'epic'),
('Luz e Fogo','Lumos + Incendio','🔥',ARRAY['Lumos','Incendio'],50,10,'uncommon'),
('Combo do Auror','Expelliarmus + Stupefy + Incarcerous','⚔️',ARRAY['Expelliarmus','Stupefy','Incarcerous'],200,50,'legendary');
