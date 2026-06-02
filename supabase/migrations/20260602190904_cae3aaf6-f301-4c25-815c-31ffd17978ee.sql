
-- =====================================================================
-- FASE 9: Guildas/Guerra, Economia Avançada, UGC, Ranqueado
-- =====================================================================

-- ---------- GUILDS / WAR / RAID ----------
CREATE TABLE public.guilds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  house public.house_type NOT NULL,
  emblem text DEFAULT '⚔️',
  description text DEFAULT '',
  leader_id uuid NOT NULL,
  total_xp integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.guilds TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.guilds TO authenticated;
GRANT ALL ON public.guilds TO service_role;
ALTER TABLE public.guilds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guilds_select" ON public.guilds FOR SELECT USING (true);
CREATE POLICY "guilds_admin" ON public.guilds FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR leader_id = auth.uid())
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR leader_id = auth.uid());

CREATE TABLE public.guild_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id uuid NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  contributed_xp integer NOT NULL DEFAULT 0,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(guild_id, user_id)
);
GRANT SELECT ON public.guild_members TO anon, authenticated;
GRANT INSERT, DELETE ON public.guild_members TO authenticated;
GRANT ALL ON public.guild_members TO service_role;
ALTER TABLE public.guild_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gm_select" ON public.guild_members FOR SELECT USING (true);
CREATE POLICY "gm_self_insert" ON public.guild_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "gm_self_delete" ON public.guild_members FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.house_wars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL,
  week_end date NOT NULL,
  status text NOT NULL DEFAULT 'open',
  winner_house public.house_type,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.house_wars TO anon, authenticated;
GRANT ALL ON public.house_wars TO service_role;
ALTER TABLE public.house_wars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hw_select" ON public.house_wars FOR SELECT USING (true);
CREATE POLICY "hw_admin" ON public.house_wars FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

CREATE TABLE public.house_war_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  war_id uuid NOT NULL REFERENCES public.house_wars(id) ON DELETE CASCADE,
  house public.house_type NOT NULL,
  points integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(war_id, house)
);
GRANT SELECT ON public.house_war_scores TO anon, authenticated;
GRANT ALL ON public.house_war_scores TO service_role;
ALTER TABLE public.house_war_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hws_select" ON public.house_war_scores FOR SELECT USING (true);

CREATE TABLE public.raid_bosses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text,
  description text DEFAULT '',
  max_hp integer NOT NULL DEFAULT 10000,
  current_hp integer NOT NULL DEFAULT 10000,
  xp_pool integer NOT NULL DEFAULT 5000,
  galeon_pool integer NOT NULL DEFAULT 1000,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.raid_bosses TO authenticated;
GRANT ALL ON public.raid_bosses TO service_role;
ALTER TABLE public.raid_bosses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rb_select" ON public.raid_bosses FOR SELECT TO authenticated USING (true);
CREATE POLICY "rb_admin" ON public.raid_bosses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

CREATE TABLE public.raid_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  boss_id uuid NOT NULL REFERENCES public.raid_bosses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  damage_dealt integer NOT NULL DEFAULT 0,
  last_attack_at timestamptz NOT NULL DEFAULT now(),
  rewarded boolean NOT NULL DEFAULT false,
  UNIQUE(boss_id, user_id)
);
GRANT SELECT ON public.raid_participants TO authenticated;
GRANT ALL ON public.raid_participants TO service_role;
ALTER TABLE public.raid_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rp_select" ON public.raid_participants FOR SELECT TO authenticated USING (true);

-- ---------- AUCTIONS ----------
CREATE TABLE public.auctions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  sticker_id uuid,
  title text NOT NULL,
  description text DEFAULT '',
  starting_bid integer NOT NULL DEFAULT 10,
  current_bid integer NOT NULL DEFAULT 0,
  current_winner uuid,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.auctions TO authenticated;
GRANT INSERT, UPDATE ON public.auctions TO authenticated;
GRANT ALL ON public.auctions TO service_role;
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auc_select" ON public.auctions FOR SELECT TO authenticated USING (true);
CREATE POLICY "auc_self_insert" ON public.auctions FOR INSERT TO authenticated WITH CHECK (seller_id = auth.uid());
CREATE POLICY "auc_self_update" ON public.auctions FOR UPDATE TO authenticated USING (seller_id = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role));

CREATE TABLE public.auction_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id uuid NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  bidder_id uuid NOT NULL,
  amount integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.auction_bids TO authenticated;
GRANT ALL ON public.auction_bids TO service_role;
ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ab_select" ON public.auction_bids FOR SELECT TO authenticated USING (true);
CREATE POLICY "ab_insert" ON public.auction_bids FOR INSERT TO authenticated WITH CHECK (bidder_id = auth.uid());

-- ---------- BANK LOANS ----------
CREATE TABLE public.bank_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  interest_pct integer NOT NULL DEFAULT 15,
  total_due integer NOT NULL,
  due_at timestamptz NOT NULL,
  paid integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.bank_loans TO authenticated;
GRANT ALL ON public.bank_loans TO service_role;
ALTER TABLE public.bank_loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bl_self" ON public.bank_loans FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (user_id = auth.uid());

-- ---------- STOCKS ----------
CREATE TABLE public.wizard_stocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text NOT NULL UNIQUE,
  company text NOT NULL,
  description text DEFAULT '',
  price integer NOT NULL DEFAULT 100,
  volatility integer NOT NULL DEFAULT 5,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wizard_stocks TO authenticated;
GRANT ALL ON public.wizard_stocks TO service_role;
ALTER TABLE public.wizard_stocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_select" ON public.wizard_stocks FOR SELECT TO authenticated USING (true);
CREATE POLICY "ws_admin" ON public.wizard_stocks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

CREATE TABLE public.stock_holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stock_id uuid NOT NULL REFERENCES public.wizard_stocks(id) ON DELETE CASCADE,
  shares integer NOT NULL DEFAULT 0,
  avg_price integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, stock_id)
);
GRANT SELECT, INSERT, UPDATE ON public.stock_holdings TO authenticated;
GRANT ALL ON public.stock_holdings TO service_role;
ALTER TABLE public.stock_holdings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sh_self" ON public.stock_holdings FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (user_id = auth.uid());

CREATE TABLE public.stock_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id uuid NOT NULL REFERENCES public.wizard_stocks(id) ON DELETE CASCADE,
  price integer NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stock_history TO authenticated;
GRANT ALL ON public.stock_history TO service_role;
ALTER TABLE public.stock_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sh_hist_select" ON public.stock_history FOR SELECT TO authenticated USING (true);

-- ---------- UGC ----------
CREATE TABLE public.ugc_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  theme text DEFAULT 'general',
  status text NOT NULL DEFAULT 'pending',
  votes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.ugc_rooms TO authenticated;
GRANT ALL ON public.ugc_rooms TO service_role;
ALTER TABLE public.ugc_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ucr_select" ON public.ugc_rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "ucr_self" ON public.ugc_rooms FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid());
CREATE POLICY "ucr_self_upd" ON public.ugc_rooms FOR UPDATE TO authenticated USING (creator_id = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role));

CREATE TABLE public.ugc_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  difficulty integer NOT NULL DEFAULT 1,
  xp_reward integer NOT NULL DEFAULT 25,
  galeon_reward integer NOT NULL DEFAULT 5,
  status text NOT NULL DEFAULT 'pending',
  votes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.ugc_missions TO authenticated;
GRANT ALL ON public.ugc_missions TO service_role;
ALTER TABLE public.ugc_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ucm_select" ON public.ugc_missions FOR SELECT TO authenticated USING (true);
CREATE POLICY "ucm_self" ON public.ugc_missions FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid());
CREATE POLICY "ucm_self_upd" ON public.ugc_missions FOR UPDATE TO authenticated USING (creator_id = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role));

CREATE TABLE public.ugc_spells (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  incantation text NOT NULL,
  effect text NOT NULL,
  power integer NOT NULL DEFAULT 10,
  status text NOT NULL DEFAULT 'pending',
  votes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.ugc_spells TO authenticated;
GRANT ALL ON public.ugc_spells TO service_role;
ALTER TABLE public.ugc_spells ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ucs_select" ON public.ugc_spells FOR SELECT TO authenticated USING (true);
CREATE POLICY "ucs_self" ON public.ugc_spells FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid());
CREATE POLICY "ucs_self_upd" ON public.ugc_spells FOR UPDATE TO authenticated USING (creator_id = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role));

CREATE TABLE public.ugc_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  value integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_type, target_id)
);
GRANT SELECT, INSERT, DELETE ON public.ugc_votes TO authenticated;
GRANT ALL ON public.ugc_votes TO service_role;
ALTER TABLE public.ugc_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ucv_select" ON public.ugc_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "ucv_self" ON public.ugc_votes FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ---------- RANKED ----------
CREATE TABLE public.ranked_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ranked_seasons TO authenticated;
GRANT ALL ON public.ranked_seasons TO service_role;
ALTER TABLE public.ranked_seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rs_select" ON public.ranked_seasons FOR SELECT TO authenticated USING (true);
CREATE POLICY "rs_admin" ON public.ranked_seasons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

CREATE TABLE public.ranked_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.ranked_seasons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  mmr integer NOT NULL DEFAULT 1000,
  division text NOT NULL DEFAULT 'Bronze',
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(season_id, user_id)
);
GRANT SELECT ON public.ranked_players TO authenticated;
GRANT INSERT, UPDATE ON public.ranked_players TO authenticated;
GRANT ALL ON public.ranked_players TO service_role;
ALTER TABLE public.ranked_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rp_sel" ON public.ranked_players FOR SELECT TO authenticated USING (true);
CREATE POLICY "rp_self_ins" ON public.ranked_players FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TABLE public.ranked_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.ranked_seasons(id) ON DELETE CASCADE,
  player_a uuid NOT NULL,
  player_b uuid NOT NULL,
  winner uuid,
  mmr_change integer NOT NULL DEFAULT 0,
  replay jsonb DEFAULT '[]'::jsonb,
  reported_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ranked_matches TO authenticated;
GRANT ALL ON public.ranked_matches TO service_role;
ALTER TABLE public.ranked_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rm_sel" ON public.ranked_matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "rm_ins" ON public.ranked_matches FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (player_a, player_b) OR public.has_role(auth.uid(),'admin'::app_role));

-- ===================== FUNCTIONS =====================

-- Guilds
CREATE OR REPLACE FUNCTION public.create_guild(p_name text, p_emblem text DEFAULT '⚔️', p_description text DEFAULT '')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); v_house public.house_type; v_id uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT house INTO v_house FROM public.profiles WHERE user_id = v_user;
  IF v_house IS NULL THEN RAISE EXCEPTION 'Casa não definida'; END IF;
  INSERT INTO public.guilds(name, house, emblem, description, leader_id)
  VALUES (p_name, v_house, p_emblem, p_description, v_user) RETURNING id INTO v_id;
  INSERT INTO public.guild_members(guild_id, user_id, role) VALUES (v_id, v_user, 'leader');
  RETURN jsonb_build_object('ok', true, 'id', v_id);
END $$;

CREATE OR REPLACE FUNCTION public.join_guild(p_guild_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); v_house public.house_type; v_guild_house public.house_type;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT house INTO v_house FROM public.profiles WHERE user_id = v_user;
  SELECT house INTO v_guild_house FROM public.guilds WHERE id = p_guild_id AND active;
  IF v_guild_house IS NULL THEN RAISE EXCEPTION 'Guilda não encontrada'; END IF;
  IF v_house <> v_guild_house THEN RAISE EXCEPTION 'Você só pode entrar em guildas da sua casa'; END IF;
  INSERT INTO public.guild_members(guild_id, user_id) VALUES (p_guild_id, v_user)
    ON CONFLICT (guild_id, user_id) DO NOTHING;
  RETURN jsonb_build_object('ok', true);
END $$;

-- Raid
CREATE OR REPLACE FUNCTION public.damage_raid_boss(p_boss_id uuid, p_damage integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); v_b record;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF p_damage <= 0 OR p_damage > 500 THEN RAISE EXCEPTION 'Dano inválido'; END IF;
  SELECT * INTO v_b FROM public.raid_bosses WHERE id = p_boss_id FOR UPDATE;
  IF NOT FOUND OR v_b.status <> 'active' THEN RAISE EXCEPTION 'Chefe indisponível'; END IF;
  IF v_b.current_hp <= 0 THEN RAISE EXCEPTION 'Chefe já foi derrotado'; END IF;
  UPDATE public.raid_bosses SET current_hp = GREATEST(0, current_hp - p_damage) WHERE id = p_boss_id;
  INSERT INTO public.raid_participants(boss_id, user_id, damage_dealt, last_attack_at)
    VALUES (p_boss_id, v_user, p_damage, now())
    ON CONFLICT (boss_id, user_id) DO UPDATE SET damage_dealt = public.raid_participants.damage_dealt + p_damage, last_attack_at = now();
  IF v_b.current_hp - p_damage <= 0 THEN
    UPDATE public.raid_bosses SET status='defeated' WHERE id = p_boss_id;
  END IF;
  RETURN jsonb_build_object('ok', true, 'remaining_hp', GREATEST(0, v_b.current_hp - p_damage));
END $$;

-- Auctions
CREATE OR REPLACE FUNCTION public.place_auction_bid(p_auction_id uuid, p_amount integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); v_a record; v_bal int;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO v_a FROM public.auctions WHERE id = p_auction_id FOR UPDATE;
  IF NOT FOUND OR v_a.status <> 'open' THEN RAISE EXCEPTION 'Leilão indisponível'; END IF;
  IF v_a.ends_at < now() THEN RAISE EXCEPTION 'Leilão encerrado'; END IF;
  IF v_a.seller_id = v_user THEN RAISE EXCEPTION 'Você não pode dar lance no próprio leilão'; END IF;
  IF p_amount <= GREATEST(v_a.current_bid, v_a.starting_bid) THEN
    RAISE EXCEPTION 'Lance deve ser maior que %', GREATEST(v_a.current_bid, v_a.starting_bid);
  END IF;
  SELECT COALESCE(galeons,0) INTO v_bal FROM public.profiles WHERE user_id = v_user;
  IF v_bal < p_amount THEN RAISE EXCEPTION 'Galeões insuficientes'; END IF;
  INSERT INTO public.auction_bids(auction_id, bidder_id, amount) VALUES (p_auction_id, v_user, p_amount);
  UPDATE public.auctions SET current_bid = p_amount, current_winner = v_user WHERE id = p_auction_id;
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.finalize_auction(p_auction_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_a record;
BEGIN
  SELECT * INTO v_a FROM public.auctions WHERE id = p_auction_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Leilão não encontrado'; END IF;
  IF v_a.status <> 'open' THEN RAISE EXCEPTION 'Já finalizado'; END IF;
  IF v_a.ends_at > now() AND NOT public.has_role(auth.uid(),'admin'::app_role) THEN RAISE EXCEPTION 'Leilão ainda aberto'; END IF;
  IF v_a.current_winner IS NULL THEN
    UPDATE public.auctions SET status='expired' WHERE id = p_auction_id;
    RETURN jsonb_build_object('ok', true, 'sold', false);
  END IF;
  UPDATE public.profiles SET galeons = galeons - v_a.current_bid WHERE user_id = v_a.current_winner;
  PERFORM public.credit_galeons_atomic(v_a.seller_id, v_a.current_bid);
  IF v_a.sticker_id IS NOT NULL THEN
    DELETE FROM public.user_stickers WHERE user_id = v_a.seller_id AND sticker_id = v_a.sticker_id;
    INSERT INTO public.user_stickers(user_id, sticker_id) VALUES (v_a.current_winner, v_a.sticker_id) ON CONFLICT DO NOTHING;
  END IF;
  UPDATE public.auctions SET status='closed' WHERE id = p_auction_id;
  INSERT INTO public.notifications(user_id, title, message, link)
  VALUES (v_a.current_winner, '🏆 Você venceu o leilão!', v_a.title, '/dashboard/auctions'),
         (v_a.seller_id, '🪙 Item leiloado!', v_a.title || ' por ' || v_a.current_bid || ' G', '/dashboard/auctions');
  RETURN jsonb_build_object('ok', true, 'sold', true);
END $$;

-- Bank
CREATE OR REPLACE FUNCTION public.take_bank_loan(p_amount integer, p_days integer DEFAULT 7)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); v_total int; v_existing int;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF p_amount < 10 OR p_amount > 1000 THEN RAISE EXCEPTION 'Valor entre 10 e 1000 G'; END IF;
  SELECT count(*) INTO v_existing FROM public.bank_loans WHERE user_id = v_user AND status='open';
  IF v_existing > 0 THEN RAISE EXCEPTION 'Você já tem um empréstimo em aberto'; END IF;
  v_total := p_amount + (p_amount * 15)/100;
  INSERT INTO public.bank_loans(user_id, amount, total_due, due_at)
  VALUES (v_user, p_amount, v_total, now() + (p_days||' days')::interval);
  PERFORM public.credit_galeons_atomic(v_user, p_amount);
  INSERT INTO public.notifications(user_id, title, message, link)
  VALUES (v_user, '🏦 Empréstimo aprovado', 'Gringotts liberou ' || p_amount || ' G. Devolva ' || v_total || ' G em ' || p_days || ' dias.', '/dashboard/bank');
  RETURN jsonb_build_object('ok', true, 'total_due', v_total);
END $$;

CREATE OR REPLACE FUNCTION public.repay_bank_loan(p_loan_id uuid, p_amount integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); v_l record; v_bal int;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO v_l FROM public.bank_loans WHERE id = p_loan_id AND user_id = v_user FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Empréstimo não encontrado'; END IF;
  IF v_l.status <> 'open' THEN RAISE EXCEPTION 'Empréstimo já encerrado'; END IF;
  SELECT COALESCE(galeons,0) INTO v_bal FROM public.profiles WHERE user_id = v_user;
  IF v_bal < p_amount THEN RAISE EXCEPTION 'Galeões insuficientes'; END IF;
  UPDATE public.profiles SET galeons = galeons - p_amount WHERE user_id = v_user;
  UPDATE public.bank_loans SET paid = paid + p_amount,
    status = CASE WHEN paid + p_amount >= total_due THEN 'paid' ELSE 'open' END
    WHERE id = p_loan_id;
  RETURN jsonb_build_object('ok', true);
END $$;

-- Stocks
CREATE OR REPLACE FUNCTION public.buy_stock(p_stock_id uuid, p_shares integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); v_s record; v_cost int; v_bal int; v_h record;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF p_shares <= 0 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
  SELECT * INTO v_s FROM public.wizard_stocks WHERE id = p_stock_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ação não encontrada'; END IF;
  v_cost := v_s.price * p_shares;
  SELECT COALESCE(galeons,0) INTO v_bal FROM public.profiles WHERE user_id = v_user;
  IF v_bal < v_cost THEN RAISE EXCEPTION 'Galeões insuficientes'; END IF;
  UPDATE public.profiles SET galeons = galeons - v_cost WHERE user_id = v_user;
  SELECT * INTO v_h FROM public.stock_holdings WHERE user_id=v_user AND stock_id=p_stock_id FOR UPDATE;
  IF FOUND THEN
    UPDATE public.stock_holdings SET
      avg_price = ((avg_price * shares) + v_cost) / (shares + p_shares),
      shares = shares + p_shares, updated_at = now()
      WHERE id = v_h.id;
  ELSE
    INSERT INTO public.stock_holdings(user_id, stock_id, shares, avg_price)
    VALUES (v_user, p_stock_id, p_shares, v_s.price);
  END IF;
  RETURN jsonb_build_object('ok', true, 'cost', v_cost);
END $$;

CREATE OR REPLACE FUNCTION public.sell_stock(p_stock_id uuid, p_shares integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); v_s record; v_h record; v_gain int;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF p_shares <= 0 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
  SELECT * INTO v_s FROM public.wizard_stocks WHERE id = p_stock_id;
  SELECT * INTO v_h FROM public.stock_holdings WHERE user_id=v_user AND stock_id=p_stock_id FOR UPDATE;
  IF NOT FOUND OR v_h.shares < p_shares THEN RAISE EXCEPTION 'Ações insuficientes'; END IF;
  v_gain := v_s.price * p_shares;
  PERFORM public.credit_galeons_atomic(v_user, v_gain);
  UPDATE public.stock_holdings SET shares = shares - p_shares, updated_at = now() WHERE id = v_h.id;
  RETURN jsonb_build_object('ok', true, 'received', v_gain);
END $$;

-- UGC vote helper
CREATE OR REPLACE FUNCTION public.vote_ugc(p_target_type text, p_target_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  INSERT INTO public.ugc_votes(user_id, target_type, target_id) VALUES (v_user, p_target_type, p_target_id)
    ON CONFLICT (user_id, target_type, target_id) DO NOTHING;
  IF p_target_type = 'room' THEN UPDATE public.ugc_rooms SET votes = votes + 1 WHERE id = p_target_id;
  ELSIF p_target_type = 'mission' THEN UPDATE public.ugc_missions SET votes = votes + 1 WHERE id = p_target_id;
  ELSIF p_target_type = 'spell' THEN UPDATE public.ugc_spells SET votes = votes + 1 WHERE id = p_target_id;
  END IF;
  RETURN jsonb_build_object('ok', true);
END $$;

-- Ranked match report (Elo K=32)
CREATE OR REPLACE FUNCTION public.report_ranked_match(p_season_id uuid, p_opponent uuid, p_won boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); v_a int; v_b int; v_exp_a numeric; v_change int;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF v_user = p_opponent THEN RAISE EXCEPTION 'Adversário inválido'; END IF;
  INSERT INTO public.ranked_players(season_id, user_id) VALUES (p_season_id, v_user) ON CONFLICT DO NOTHING;
  INSERT INTO public.ranked_players(season_id, user_id) VALUES (p_season_id, p_opponent) ON CONFLICT DO NOTHING;
  SELECT mmr INTO v_a FROM public.ranked_players WHERE season_id=p_season_id AND user_id=v_user;
  SELECT mmr INTO v_b FROM public.ranked_players WHERE season_id=p_season_id AND user_id=p_opponent;
  v_exp_a := 1.0 / (1.0 + pow(10, (v_b - v_a)::numeric / 400));
  v_change := round(32 * ((CASE WHEN p_won THEN 1 ELSE 0 END) - v_exp_a));
  UPDATE public.ranked_players SET mmr = mmr + v_change,
    wins = wins + (CASE WHEN p_won THEN 1 ELSE 0 END),
    losses = losses + (CASE WHEN p_won THEN 0 ELSE 1 END),
    division = CASE
      WHEN mmr + v_change >= 2200 THEN 'Auror'
      WHEN mmr + v_change >= 1800 THEN 'Mestre'
      WHEN mmr + v_change >= 1500 THEN 'Diamante'
      WHEN mmr + v_change >= 1300 THEN 'Ouro'
      WHEN mmr + v_change >= 1100 THEN 'Prata'
      ELSE 'Bronze' END,
    updated_at = now()
    WHERE season_id=p_season_id AND user_id=v_user;
  UPDATE public.ranked_players SET mmr = GREATEST(0, mmr - v_change),
    wins = wins + (CASE WHEN p_won THEN 0 ELSE 1 END),
    losses = losses + (CASE WHEN p_won THEN 1 ELSE 0 END),
    updated_at = now()
    WHERE season_id=p_season_id AND user_id=p_opponent;
  INSERT INTO public.ranked_matches(season_id, player_a, player_b, winner, mmr_change)
  VALUES (p_season_id, v_user, p_opponent, CASE WHEN p_won THEN v_user ELSE p_opponent END, abs(v_change));
  RETURN jsonb_build_object('ok', true, 'mmr_change', v_change);
END $$;
