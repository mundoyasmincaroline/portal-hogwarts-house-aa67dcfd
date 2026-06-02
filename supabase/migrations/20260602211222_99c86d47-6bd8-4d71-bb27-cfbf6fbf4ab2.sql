-- Phase 15: Expanded Magical World

-- 15.A Diagon Alley shops
CREATE TABLE public.diagon_shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  icon text DEFAULT '🏪',
  banner_color text DEFAULT '#c9a84c',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.diagon_shops TO anon, authenticated;
GRANT ALL ON public.diagon_shops TO service_role;
ALTER TABLE public.diagon_shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shops visible to all" ON public.diagon_shops FOR SELECT USING (true);
CREATE POLICY "Admins manage shops" ON public.diagon_shops FOR ALL USING (has_role(auth.uid(),'admin'::app_role));

CREATE TABLE public.diagon_shop_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.diagon_shops(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  icon text DEFAULT '✨',
  price_galeons integer NOT NULL DEFAULT 10,
  rarity text DEFAULT 'common',
  exclusive boolean DEFAULT false,
  stock integer DEFAULT -1,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.diagon_shop_items TO anon, authenticated;
GRANT ALL ON public.diagon_shop_items TO service_role;
ALTER TABLE public.diagon_shop_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shop items visible" ON public.diagon_shop_items FOR SELECT USING (true);
CREATE POLICY "Admins manage shop items" ON public.diagon_shop_items FOR ALL USING (has_role(auth.uid(),'admin'::app_role));

CREATE TABLE public.diagon_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_id uuid NOT NULL REFERENCES public.diagon_shop_items(id) ON DELETE CASCADE,
  price_paid integer NOT NULL,
  purchased_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT ON public.diagon_purchases TO authenticated;
GRANT ALL ON public.diagon_purchases TO service_role;
ALTER TABLE public.diagon_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User reads own purchases" ON public.diagon_purchases FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.buy_diagon_item(p_item_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid := auth.uid(); v_it record; v_bal int;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO v_it FROM public.diagon_shop_items WHERE id = p_item_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Item não encontrado'; END IF;
  IF v_it.stock = 0 THEN RAISE EXCEPTION 'Esgotado'; END IF;
  SELECT COALESCE(galeons,0) INTO v_bal FROM public.profiles WHERE user_id = v_user;
  IF v_bal < v_it.price_galeons THEN RAISE EXCEPTION 'Galeões insuficientes'; END IF;
  UPDATE public.profiles SET galeons = galeons - v_it.price_galeons WHERE user_id = v_user;
  IF v_it.stock > 0 THEN UPDATE public.diagon_shop_items SET stock = stock - 1 WHERE id = p_item_id; END IF;
  INSERT INTO public.diagon_purchases(user_id, item_id, price_paid) VALUES (v_user, p_item_id, v_it.price_galeons);
  INSERT INTO public.notifications(user_id, title, message) VALUES (v_user, '🛍️ Compra no Beco Diagonal', 'Você adquiriu: ' || v_it.name);
  RETURN jsonb_build_object('ok', true);
END $$;

-- 15.B Gringotts vaults
CREATE TABLE public.gringotts_vaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  vault_number integer NOT NULL,
  balance integer NOT NULL DEFAULT 0,
  interest_rate numeric NOT NULL DEFAULT 0.02,
  last_interest_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.gringotts_vaults TO authenticated;
GRANT ALL ON public.gringotts_vaults TO service_role;
ALTER TABLE public.gringotts_vaults ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own vault read" ON public.gringotts_vaults FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own vault insert" ON public.gringotts_vaults FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.gringotts_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id uuid NOT NULL REFERENCES public.gringotts_vaults(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  type text NOT NULL,
  amount integer NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT ON public.gringotts_transactions TO authenticated;
GRANT ALL ON public.gringotts_transactions TO service_role;
ALTER TABLE public.gringotts_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own tx read" ON public.gringotts_transactions FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.open_vault()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid := auth.uid(); v_num int; v_id uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF EXISTS (SELECT 1 FROM public.gringotts_vaults WHERE user_id = v_user) THEN
    RAISE EXCEPTION 'Você já possui um cofre';
  END IF;
  SELECT COALESCE(MAX(vault_number), 700) + 1 INTO v_num FROM public.gringotts_vaults;
  INSERT INTO public.gringotts_vaults(user_id, vault_number) VALUES (v_user, v_num) RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok', true, 'vault_number', v_num);
END $$;

CREATE OR REPLACE FUNCTION public.vault_deposit(p_amount integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid := auth.uid(); v_v record; v_bal int;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Valor inválido'; END IF;
  SELECT * INTO v_v FROM public.gringotts_vaults WHERE user_id = v_user FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Abra um cofre primeiro'; END IF;
  SELECT COALESCE(galeons,0) INTO v_bal FROM public.profiles WHERE user_id = v_user;
  IF v_bal < p_amount THEN RAISE EXCEPTION 'Galeões insuficientes'; END IF;
  UPDATE public.profiles SET galeons = galeons - p_amount WHERE user_id = v_user;
  UPDATE public.gringotts_vaults SET balance = balance + p_amount WHERE id = v_v.id;
  INSERT INTO public.gringotts_transactions(vault_id, user_id, type, amount, description)
  VALUES (v_v.id, v_user, 'deposit', p_amount, 'Depósito no cofre #' || v_v.vault_number);
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.vault_withdraw(p_amount integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid := auth.uid(); v_v record;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Valor inválido'; END IF;
  SELECT * INTO v_v FROM public.gringotts_vaults WHERE user_id = v_user FOR UPDATE;
  IF NOT FOUND OR v_v.balance < p_amount THEN RAISE EXCEPTION 'Saldo insuficiente'; END IF;
  UPDATE public.gringotts_vaults SET balance = balance - p_amount WHERE id = v_v.id;
  PERFORM public.credit_galeons_atomic(v_user, p_amount);
  INSERT INTO public.gringotts_transactions(vault_id, user_id, type, amount, description)
  VALUES (v_v.id, v_user, 'withdraw', p_amount, 'Saque do cofre #' || v_v.vault_number);
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.vault_claim_interest()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid := auth.uid(); v_v record; v_days int; v_int int;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO v_v FROM public.gringotts_vaults WHERE user_id = v_user FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sem cofre'; END IF;
  v_days := EXTRACT(EPOCH FROM (now() - v_v.last_interest_at)) / 86400;
  IF v_days < 1 THEN RAISE EXCEPTION 'Aguarde 24h entre cobranças'; END IF;
  v_int := FLOOR(v_v.balance * v_v.interest_rate * v_days);
  IF v_int <= 0 THEN RAISE EXCEPTION 'Sem juros a receber'; END IF;
  UPDATE public.gringotts_vaults SET balance = balance + v_int, last_interest_at = now() WHERE id = v_v.id;
  INSERT INTO public.gringotts_transactions(vault_id, user_id, type, amount, description)
  VALUES (v_v.id, v_user, 'interest', v_int, 'Juros de ' || v_days || ' dias');
  RETURN jsonb_build_object('ok', true, 'interest', v_int);
END $$;

-- 15.C Ministry of Magic
CREATE TYPE public.ministry_dept AS ENUM ('aurores','misterios','cooperacao','transportes','jogos','controle_criaturas','justica');

CREATE TABLE public.ministry_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  department public.ministry_dept NOT NULL,
  description text,
  min_level integer NOT NULL DEFAULT 5,
  salary_galeons integer NOT NULL DEFAULT 10,
  icon text DEFAULT '🏛️',
  active boolean DEFAULT true
);
GRANT SELECT ON public.ministry_positions TO anon, authenticated;
GRANT ALL ON public.ministry_positions TO service_role;
ALTER TABLE public.ministry_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Positions public" ON public.ministry_positions FOR SELECT USING (true);
CREATE POLICY "Admins manage positions" ON public.ministry_positions FOR ALL USING (has_role(auth.uid(),'admin'::app_role));

CREATE TABLE public.ministry_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  position_id uuid NOT NULL REFERENCES public.ministry_positions(id) ON DELETE CASCADE,
  hired_at timestamptz DEFAULT now(),
  active boolean DEFAULT true,
  UNIQUE(user_id, position_id)
);
GRANT SELECT, INSERT, UPDATE ON public.ministry_employees TO authenticated;
GRANT ALL ON public.ministry_employees TO service_role;
ALTER TABLE public.ministry_employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees public read" ON public.ministry_employees FOR SELECT USING (true);
CREATE POLICY "Own apply" ON public.ministry_employees FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own resign" ON public.ministry_employees FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE public.ministry_laws (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  penalty text,
  enacted_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.ministry_laws TO anon, authenticated;
GRANT ALL ON public.ministry_laws TO service_role;
ALTER TABLE public.ministry_laws ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Laws public" ON public.ministry_laws FOR SELECT USING (true);
CREATE POLICY "Admins manage laws" ON public.ministry_laws FOR ALL USING (has_role(auth.uid(),'admin'::app_role));

CREATE TABLE public.ministry_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  department public.ministry_dept NOT NULL,
  difficulty integer NOT NULL DEFAULT 1,
  xp_reward integer NOT NULL DEFAULT 100,
  galeon_reward integer NOT NULL DEFAULT 50,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.ministry_missions TO anon, authenticated;
GRANT ALL ON public.ministry_missions TO service_role;
ALTER TABLE public.ministry_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Missions public" ON public.ministry_missions FOR SELECT USING (true);
CREATE POLICY "Admins manage missions" ON public.ministry_missions FOR ALL USING (has_role(auth.uid(),'admin'::app_role));

CREATE TABLE public.ministry_mission_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mission_id uuid NOT NULL REFERENCES public.ministry_missions(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'in_progress',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);
GRANT SELECT, INSERT, UPDATE ON public.ministry_mission_attempts TO authenticated;
GRANT ALL ON public.ministry_mission_attempts TO service_role;
ALTER TABLE public.ministry_mission_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own attempts read" ON public.ministry_mission_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own attempts insert" ON public.ministry_mission_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own attempts update" ON public.ministry_mission_attempts FOR UPDATE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.apply_ministry_position(p_position_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid := auth.uid(); v_p record; v_lvl int;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO v_p FROM public.ministry_positions WHERE id = p_position_id AND active;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cargo indisponível'; END IF;
  SELECT level INTO v_lvl FROM public.profiles WHERE user_id = v_user;
  IF COALESCE(v_lvl,1) < v_p.min_level THEN RAISE EXCEPTION 'Nível mínimo: %', v_p.min_level; END IF;
  INSERT INTO public.ministry_employees(user_id, position_id) VALUES (v_user, p_position_id)
    ON CONFLICT (user_id, position_id) DO UPDATE SET active = true;
  INSERT INTO public.notifications(user_id, title, message)
  VALUES (v_user, '🏛️ Contratado pelo Ministério!', 'Você agora é ' || v_p.name);
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.complete_ministry_mission(p_mission_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid := auth.uid(); v_m record;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO v_m FROM public.ministry_missions WHERE id = p_mission_id AND active;
  IF NOT FOUND THEN RAISE EXCEPTION 'Missão indisponível'; END IF;
  INSERT INTO public.ministry_mission_attempts(user_id, mission_id, status, completed_at)
  VALUES (v_user, p_mission_id, 'completed', now());
  PERFORM public.award_xp_action('ministry_mission', v_user, v_m.xp_reward);
  PERFORM public.credit_galeons_atomic(v_user, v_m.galeon_reward);
  INSERT INTO public.notifications(user_id, title, message)
  VALUES (v_user, '🏛️ Missão Ministerial concluída', v_m.title || ' (+' || v_m.xp_reward || ' XP, +' || v_m.galeon_reward || ' G)');
  RETURN jsonb_build_object('ok', true);
END $$;

-- Seeds
INSERT INTO public.diagon_shops(slug, name, description, icon) VALUES
  ('olivaras', 'Olivaras: Fabricantes de Varinhas Finas', 'A varinha escolhe o bruxo, Sr. Potter.', '🪄'),
  ('floreios_borroes', 'Floreios & Borrões', 'A maior livraria mágica de Londres.', '📚'),
  ('florean_fortescue', 'Sorveteria Florean Fortescue', 'Sorvetes mágicos de sabores impossíveis.', '🍨'),
  ('madame_malkin', 'Madame Malkin - Roupas para Todas as Ocasiões', 'Vestes a rigor e uniformes Hogwarts.', '🧥'),
  ('caldeirao_furado', 'Caldeirão Furado', 'O famoso pub que conecta os dois mundos.', '🍺');

INSERT INTO public.diagon_shop_items(shop_id, name, description, icon, price_galeons, rarity, exclusive)
SELECT id, 'Varinha de Teixo & Pena de Fênix', 'Madeira nobre, núcleo lendário.', '🪄', 250, 'legendary', true FROM public.diagon_shops WHERE slug='olivaras'
UNION ALL
SELECT id, 'Varinha de Carvalho & Crina de Unicórnio', 'Equilibrada e confiável.', '🪄', 120, 'rare', false FROM public.diagon_shops WHERE slug='olivaras'
UNION ALL
SELECT id, 'Histórico de Hogwarts', 'Edição comemorativa em couro.', '📖', 80, 'rare', false FROM public.diagon_shops WHERE slug='floreios_borroes'
UNION ALL
SELECT id, 'Monstruoso Livro dos Monstros', 'Cuidado ao abrir.', '📕', 150, 'epic', true FROM public.diagon_shops WHERE slug='floreios_borroes'
UNION ALL
SELECT id, 'Sundae Manteiga de Amendoim & Chocolate', 'Especialidade da casa.', '🍨', 15, 'common', false FROM public.diagon_shops WHERE slug='florean_fortescue'
UNION ALL
SELECT id, 'Sorvete de Polissuco', 'Você se transforma em quem comer junto!', '🍦', 75, 'rare', true FROM public.diagon_shops WHERE slug='florean_fortescue'
UNION ALL
SELECT id, 'Vestes de Gala Bordadas', 'Para o Baile de Inverno.', '👗', 200, 'epic', true FROM public.diagon_shops WHERE slug='madame_malkin'
UNION ALL
SELECT id, 'Manto de Viagem Padrão', 'Resistente à chuva.', '🧥', 45, 'common', false FROM public.diagon_shops WHERE slug='madame_malkin'
UNION ALL
SELECT id, 'Cerveja Amanteigada', 'Quentinha e espumante.', '🍺', 8, 'common', false FROM public.diagon_shops WHERE slug='caldeirao_furado'
UNION ALL
SELECT id, 'Quarto Privativo (1 noite)', 'Descanso seguro.', '🛏️', 60, 'rare', false FROM public.diagon_shops WHERE slug='caldeirao_furado';

INSERT INTO public.ministry_positions(name, department, description, min_level, salary_galeons, icon) VALUES
  ('Auror Aprendiz', 'aurores', 'Caça bruxos das trevas em formação.', 8, 30, '⚔️'),
  ('Inefável Júnior', 'misterios', 'Estuda os mistérios profundos da magia.', 12, 40, '🔮'),
  ('Embaixador Bruxo', 'cooperacao', 'Relações com outras escolas e ministérios.', 6, 20, '🌍'),
  ('Regulador de Vassouras', 'transportes', 'Fiscaliza voos e Chave de Portal.', 4, 15, '🧹'),
  ('Árbitro de Quadribol', 'jogos', 'Apita partidas oficiais.', 5, 18, '🏆'),
  ('Tratador de Criaturas', 'controle_criaturas', 'Cuida de hipogrifos, dragões e mais.', 7, 25, '🐉'),
  ('Promotor da Wizengamot', 'justica', 'Acusa criminosos perante o tribunal.', 15, 50, '⚖️');

INSERT INTO public.ministry_laws(code, title, description, penalty) VALUES
  ('DUM-1692', 'Decreto Internacional de Sigilo Mágico', 'Proíbe a revelação do mundo bruxo aos trouxas.', 'Obliviação e multa de 500 G'),
  ('DEC-26', 'Decreto Educacional N.º 26', 'Regulamenta o uso de magia por menores fora de Hogwarts.', 'Advertência e detenção'),
  ('LEI-MAR', 'Convenção de Magia Marcial', 'Restringe Maldições Imperdoáveis.', 'Azkaban perpétua'),
  ('LEI-CRT', 'Lei das Criaturas Mágicas', 'Classifica e protege seres mágicos.', 'Multa de 100-1000 G'),
  ('LEI-POÇ', 'Restrição de Poções Controladas', 'Proíbe a venda livre de Veritaserum e Polissuco.', 'Confisco e multa');

INSERT INTO public.ministry_missions(title, description, department, difficulty, xp_reward, galeon_reward) VALUES
  ('Patrulha no Beco Diagonal', 'Vigie atividades suspeitas durante o turno noturno.', 'aurores', 1, 100, 40),
  ('Captura do Bruxo Foragido', 'Recapture um criminoso evadido de Azkaban.', 'aurores', 3, 300, 150),
  ('Catalogar Esfera do Tempo', 'Estude e classifique uma esfera recém-descoberta.', 'misterios', 2, 200, 80),
  ('Negociação com Beauxbatons', 'Represente a Inglaterra em assembleia europeia.', 'cooperacao', 2, 150, 70),
  ('Inspeção de Vassouras Comerciais', 'Verifique a segurança de novos modelos.', 'transportes', 1, 80, 30),
  ('Resgate de Hipogrifo Ferido', 'Trate e liberte criatura em reserva.', 'controle_criaturas', 2, 180, 75),
  ('Processo no Wizengamot', 'Apresente acusação formal em julgamento público.', 'justica', 3, 350, 200);