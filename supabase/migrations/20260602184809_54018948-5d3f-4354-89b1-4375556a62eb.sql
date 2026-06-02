
-- ============== TOURNAMENTS ==============
CREATE TABLE public.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  format text NOT NULL DEFAULT 'single_elimination',
  status text NOT NULL DEFAULT 'open', -- open | running | finished
  max_participants integer NOT NULL DEFAULT 16,
  xp_prize integer NOT NULL DEFAULT 500,
  galeon_prize integer NOT NULL DEFAULT 200,
  starts_at timestamptz,
  ends_at timestamptz,
  banner_url text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tournaments TO authenticated;
GRANT ALL ON public.tournaments TO service_role;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tournaments_select" ON public.tournaments FOR SELECT TO authenticated USING (true);
CREATE POLICY "tournaments_admin" ON public.tournaments FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE TABLE public.tournament_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  character_id uuid,
  seed integer,
  eliminated boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, user_id)
);
GRANT SELECT, INSERT ON public.tournament_participants TO authenticated;
GRANT ALL ON public.tournament_participants TO service_role;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tp_select" ON public.tournament_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "tp_insert" ON public.tournament_participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tp_admin" ON public.tournament_participants FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE TABLE public.tournament_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round integer NOT NULL,
  slot integer NOT NULL,
  player_a uuid,
  player_b uuid,
  winner uuid,
  status text NOT NULL DEFAULT 'pending', -- pending | reported | done
  scheduled_at timestamptz,
  reported_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tournament_matches TO authenticated;
GRANT ALL ON public.tournament_matches TO service_role;
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tm_select" ON public.tournament_matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "tm_admin" ON public.tournament_matches FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- RPC join_tournament
CREATE OR REPLACE FUNCTION public.join_tournament(p_tournament_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid := auth.uid(); v_count int; v_max int; v_status text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT status, max_participants INTO v_status, v_max FROM public.tournaments WHERE id = p_tournament_id;
  IF v_status IS NULL THEN RAISE EXCEPTION 'Torneio não encontrado'; END IF;
  IF v_status <> 'open' THEN RAISE EXCEPTION 'Inscrições encerradas'; END IF;
  SELECT count(*) INTO v_count FROM public.tournament_participants WHERE tournament_id = p_tournament_id;
  IF v_count >= v_max THEN RAISE EXCEPTION 'Torneio lotado'; END IF;
  INSERT INTO public.tournament_participants(tournament_id, user_id, seed)
    VALUES (p_tournament_id, v_user, v_count + 1)
    ON CONFLICT (tournament_id, user_id) DO NOTHING;
  INSERT INTO public.notifications(user_id, title, message, link)
  VALUES (v_user, '🏆 Inscrito no torneio!', 'Aguarde o início da próxima rodada.', '/dashboard/tournaments');
  RETURN jsonb_build_object('ok', true);
END $$;

-- RPC report_match_result (admin/participants)
CREATE OR REPLACE FUNCTION public.report_match_result(p_match_id uuid, p_winner uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid := auth.uid(); v_m record; v_xp int; v_gal int;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO v_m FROM public.tournament_matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Partida inválida'; END IF;
  IF v_m.status = 'done' THEN RAISE EXCEPTION 'Partida já finalizada'; END IF;
  IF NOT (has_role(v_user,'admin'::app_role) OR v_user = v_m.player_a OR v_user = v_m.player_b) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;
  IF p_winner NOT IN (v_m.player_a, v_m.player_b) THEN RAISE EXCEPTION 'Vencedor inválido'; END IF;
  UPDATE public.tournament_matches SET winner = p_winner, status='done', reported_at = now() WHERE id = p_match_id;
  UPDATE public.tournament_participants SET eliminated = true
    WHERE tournament_id = v_m.tournament_id AND user_id IN (v_m.player_a, v_m.player_b) AND user_id <> p_winner;
  SELECT xp_prize, galeon_prize INTO v_xp, v_gal FROM public.tournaments WHERE id = v_m.tournament_id;
  PERFORM public.award_xp_action('tournament_win', p_winner, COALESCE(v_xp/4,50));
  PERFORM public.award_galeons(p_winner, COALESCE(v_gal/4,20), 'Vitória de partida');
  INSERT INTO public.notifications(user_id, title, message, link)
  VALUES (p_winner, '⚔️ Vitória no torneio!', 'Avançou para a próxima fase.', '/dashboard/tournaments');
  RETURN jsonb_build_object('ok', true);
END $$;

-- ============== MARKETPLACE ==============
CREATE TABLE public.marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  sticker_id uuid NOT NULL,
  price_galeons integer NOT NULL CHECK (price_galeons > 0),
  status text NOT NULL DEFAULT 'active', -- active | sold | cancelled
  buyer_id uuid,
  fee_galeons integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  sold_at timestamptz
);
GRANT SELECT ON public.marketplace_listings TO authenticated;
GRANT ALL ON public.marketplace_listings TO service_role;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ml_select" ON public.marketplace_listings FOR SELECT TO authenticated USING (true);
CREATE POLICY "ml_seller_update" ON public.marketplace_listings FOR UPDATE TO authenticated
  USING (auth.uid() = seller_id);

CREATE INDEX ON public.marketplace_listings(status, created_at DESC);

CREATE OR REPLACE FUNCTION public.create_marketplace_listing(p_sticker_id uuid, p_price integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid := auth.uid(); v_owned int;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF p_price <= 0 THEN RAISE EXCEPTION 'Preço inválido'; END IF;
  SELECT count(*) INTO v_owned FROM public.user_stickers WHERE user_id = v_user AND sticker_id = p_sticker_id;
  IF v_owned = 0 THEN RAISE EXCEPTION 'Você não possui essa figurinha'; END IF;
  IF EXISTS (SELECT 1 FROM public.marketplace_listings WHERE seller_id=v_user AND sticker_id=p_sticker_id AND status='active') THEN
    RAISE EXCEPTION 'Já existe um anúncio ativo dessa figurinha';
  END IF;
  INSERT INTO public.marketplace_listings(seller_id, sticker_id, price_galeons)
  VALUES (v_user, p_sticker_id, p_price);
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.buy_marketplace_listing(p_listing_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid := auth.uid(); v_l record; v_bal int; v_fee int; v_net int;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO v_l FROM public.marketplace_listings WHERE id = p_listing_id FOR UPDATE;
  IF NOT FOUND OR v_l.status <> 'active' THEN RAISE EXCEPTION 'Anúncio indisponível'; END IF;
  IF v_l.seller_id = v_user THEN RAISE EXCEPTION 'Não pode comprar o próprio anúncio'; END IF;
  SELECT COALESCE(galeons,0) INTO v_bal FROM public.profiles WHERE user_id = v_user FOR UPDATE;
  IF v_bal < v_l.price_galeons THEN RAISE EXCEPTION 'Galeões insuficientes'; END IF;

  v_fee := GREATEST(1, (v_l.price_galeons * 10)/100);
  v_net := v_l.price_galeons - v_fee;

  UPDATE public.profiles SET galeons = galeons - v_l.price_galeons WHERE user_id = v_user;
  PERFORM public.credit_galeons_atomic(v_l.seller_id, v_net);

  -- Transfere figurinha
  DELETE FROM public.user_stickers WHERE user_id = v_l.seller_id AND sticker_id = v_l.sticker_id;
  INSERT INTO public.user_stickers(user_id, sticker_id) VALUES (v_user, v_l.sticker_id)
    ON CONFLICT DO NOTHING;

  UPDATE public.marketplace_listings SET status='sold', buyer_id=v_user, fee_galeons=v_fee, sold_at=now()
   WHERE id = p_listing_id;

  INSERT INTO public.currency_ledger(user_id, currency_type, amount, transaction_type, description)
  VALUES
    (v_user, 'galeon', v_l.price_galeons, 'debit', 'Compra mercado'),
    (v_l.seller_id, 'galeon', v_net, 'credit', 'Venda mercado (líquido)');

  INSERT INTO public.notifications(user_id, title, message, link)
  VALUES (v_l.seller_id, '🪙 Figurinha vendida!', 'Você recebeu ' || v_net || ' Galeões.', '/dashboard/marketplace');

  RETURN jsonb_build_object('ok', true, 'fee', v_fee, 'net', v_net);
END $$;

CREATE OR REPLACE FUNCTION public.cancel_marketplace_listing(p_listing_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid := auth.uid(); v_l record;
BEGIN
  SELECT * INTO v_l FROM public.marketplace_listings WHERE id = p_listing_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Anúncio não encontrado'; END IF;
  IF v_l.seller_id <> v_user AND NOT has_role(v_user,'admin'::app_role) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF v_l.status <> 'active' THEN RAISE EXCEPTION 'Anúncio não está ativo'; END IF;
  UPDATE public.marketplace_listings SET status='cancelled' WHERE id = p_listing_id;
  RETURN jsonb_build_object('ok', true);
END $$;

-- ============== NOTIFICATION PREFERENCES ==============
CREATE TABLE public.notification_preferences (
  user_id uuid PRIMARY KEY,
  in_app boolean NOT NULL DEFAULT true,
  daily_digest boolean NOT NULL DEFAULT true,
  email_enabled boolean NOT NULL DEFAULT false,
  push_enabled boolean NOT NULL DEFAULT false,
  quiet_hours_start integer DEFAULT 22,
  quiet_hours_end integer DEFAULT 7,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "np_select" ON public.notification_preferences FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "np_upsert" ON public.notification_preferences FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "np_update" ON public.notification_preferences FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- ============== ADMIN KPIs view ==============
CREATE OR REPLACE VIEW public.admin_kpis AS
SELECT
  (SELECT count(*) FROM public.profiles) AS total_wizards,
  (SELECT count(*) FROM public.profiles WHERE approved = true) AS approved_wizards,
  (SELECT count(*) FROM public.profiles WHERE created_at > now() - interval '7 days') AS new_week,
  (SELECT count(*) FROM public.moderation_log WHERE created_at > now() - interval '7 days') AS flags_week,
  (SELECT count(*) FROM public.marketplace_listings WHERE status='active') AS market_active,
  (SELECT count(*) FROM public.tournaments WHERE status IN ('open','running')) AS tournaments_active,
  (SELECT COALESCE(sum(amount_brl),0) FROM public.galeon_orders WHERE status='paid' AND paid_at > date_trunc('month', now())) AS revenue_month_brl;

GRANT SELECT ON public.admin_kpis TO authenticated;
