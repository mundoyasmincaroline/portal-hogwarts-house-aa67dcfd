-- Adicionar quantidade em user_stickers para permitir troca de repetidas
ALTER TABLE public.user_stickers ADD COLUMN IF NOT EXISTS quantity int NOT NULL DEFAULT 1 CHECK (quantity >= 0);

-- Atualizar buy_marketplace_listing para lidar com quantity
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
  UPDATE public.user_stickers SET quantity = quantity - 1 WHERE user_id = v_l.seller_id AND sticker_id = v_l.sticker_id;
  DELETE FROM public.user_stickers WHERE user_id = v_l.seller_id AND sticker_id = v_l.sticker_id AND quantity <= 0;
  
  INSERT INTO public.user_stickers(user_id, sticker_id, quantity) VALUES (v_user, v_l.sticker_id, 1)
    ON CONFLICT (user_id, sticker_id) DO UPDATE SET quantity = public.user_stickers.quantity + 1;

  UPDATE public.marketplace_listings SET status='sold', buyer_id=v_user, fee_galeons=v_fee, sold_at=now()
   WHERE id = p_listing_id;

  INSERT INTO public.currency_ledger(user_id, currency_type, amount, transaction_type, description)
  VALUES
    (v_user, 'galeon', -v_l.price_galeons, 'sticker_pack', 'Compra mercado'),
    (v_l.seller_id, 'galeon', v_net, 'sticker_pack', 'Venda mercado (líquido)');

  INSERT INTO public.notifications(user_id, title, message, link)
  VALUES (v_l.seller_id, '🪙 Figurinha vendida!', 'Você recebeu ' || v_net || ' Galeões.', '/dashboard/marketplace');

  RETURN jsonb_build_object('ok', true, 'fee', v_fee, 'net', v_net);
END $$;


-- Atualizar accept_sticker_trade para lidar com quantity
CREATE OR REPLACE FUNCTION public.accept_sticker_trade(_trade_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _acceptor uuid := auth.uid(); _trade record;
BEGIN
  IF _acceptor IS NULL THEN RETURN jsonb_build_object('success', false, 'message', 'Não autenticado'); END IF;
  SELECT * INTO _trade FROM public.sticker_trades WHERE id = _trade_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Troca não encontrada'); END IF;
  IF _trade.status <> 'open' THEN RETURN jsonb_build_object('success', false, 'message', 'Troca não está mais disponível'); END IF;
  IF _trade.offerer_id = _acceptor THEN RETURN jsonb_build_object('success', false, 'message', 'Você não pode aceitar sua própria troca'); END IF;

  -- Verifica posse do ofertante
  IF NOT EXISTS (SELECT 1 FROM public.user_stickers WHERE user_id = _trade.offerer_id AND sticker_id = _trade.offered_sticker_id) THEN
    UPDATE public.sticker_trades SET status = 'cancelled' WHERE id = _trade_id;
    RETURN jsonb_build_object('success', false, 'message', 'Ofertante não possui mais a figurinha');
  END IF;

  IF _trade.wanted_sticker_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.user_stickers WHERE user_id = _acceptor AND sticker_id = _trade.wanted_sticker_id) THEN
      RETURN jsonb_build_object('success', false, 'message', 'Você não possui a figurinha pedida');
    END IF;
    -- Move wanted -> offerer
    UPDATE public.user_stickers SET quantity = quantity - 1 WHERE user_id = _acceptor AND sticker_id = _trade.wanted_sticker_id;
    DELETE FROM public.user_stickers WHERE user_id = _acceptor AND sticker_id = _trade.wanted_sticker_id AND quantity <= 0;
    
    INSERT INTO public.user_stickers(user_id, sticker_id, quantity) VALUES (_trade.offerer_id, _trade.wanted_sticker_id, 1)
      ON CONFLICT (user_id, sticker_id) DO UPDATE SET quantity = public.user_stickers.quantity + 1;
  END IF;

  -- Move offered -> acceptor
  UPDATE public.user_stickers SET quantity = quantity - 1 WHERE user_id = _trade.offerer_id AND sticker_id = _trade.offered_sticker_id;
  DELETE FROM public.user_stickers WHERE user_id = _trade.offerer_id AND sticker_id = _trade.offered_sticker_id AND quantity <= 0;
  
  INSERT INTO public.user_stickers(user_id, sticker_id, quantity) VALUES (_acceptor, _trade.offered_sticker_id, 1)
    ON CONFLICT (user_id, sticker_id) DO UPDATE SET quantity = public.user_stickers.quantity + 1;

  UPDATE public.sticker_trades
     SET status = 'accepted', accepted_by_id = _acceptor, accepted_at = now()
   WHERE id = _trade_id;

  RETURN jsonb_build_object('success', true);
END;
$$;


-- Remover o limite de figurinhas novas no pacote surpresa (permitindo repetidas)
CREATE OR REPLACE FUNCTION public.open_sticker_pack(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_balance INTEGER;
  v_pack_cost INTEGER := 120;
  v_picked RECORD;
BEGIN
  IF _user_id IS NULL OR auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Não autorizado');
  END IF;

  SELECT COALESCE(galeons, 0) INTO v_balance FROM public.profiles WHERE user_id = _user_id FOR UPDATE;
  IF v_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Perfil não encontrado');
  END IF;
  IF v_balance < v_pack_cost THEN
    RETURN jsonb_build_object('success', false, 'message', 'Galeões insuficientes');
  END IF;

  -- Remove a verificação "NOT EXISTS" para permitir repetidas
  WITH weighted AS (
    SELECT id, character_name, rarity, image_url, house,
      CASE rarity WHEN 'gold' THEN 1 WHEN 'silver' THEN 3 ELSE 6 END AS weight,
      SUM(CASE rarity WHEN 'gold' THEN 1 WHEN 'silver' THEN 3 ELSE 6 END) OVER (ORDER BY id) AS cumulative,
      SUM(CASE rarity WHEN 'gold' THEN 1 WHEN 'silver' THEN 3 ELSE 6 END) OVER () AS total
    FROM public.stickers
  )
  SELECT id, character_name, rarity, image_url, house INTO v_picked
  FROM weighted
  WHERE cumulative >= (random() * total)
  ORDER BY cumulative
  LIMIT 1;

  IF v_picked.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Nenhuma figurinha disponível.');
  END IF;

  UPDATE public.profiles
     SET galeons = galeons - v_pack_cost, updated_at = now()
   WHERE user_id = _user_id;

  INSERT INTO public.currency_ledger(user_id, currency_type, amount, transaction_type, description)
  VALUES (_user_id, 'galeon', -v_pack_cost, 'sticker_pack', 'Pacote Surpresa de Figurinhas');

  INSERT INTO public.user_stickers (user_id, sticker_id, quantity)
  VALUES (_user_id, v_picked.id, 1)
  ON CONFLICT (user_id, sticker_id) DO UPDATE SET quantity = public.user_stickers.quantity + 1;

  RETURN jsonb_build_object(
    'success', true,
    'sticker', jsonb_build_object(
      'id', v_picked.id,
      'character_name', v_picked.character_name,
      'rarity', v_picked.rarity,
      'image_url', v_picked.image_url,
      'house', v_picked.house
    )
  );
END;
$$;

-- Tarefa 3: Criar um RPC para garantir que quem faz uma proposta realmente tem a figurinha
CREATE OR REPLACE FUNCTION public.propose_sticker_trade(p_offered_sticker_id uuid, p_wanted_sticker_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('success', false, 'message', 'Não autenticado'); END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.user_stickers WHERE user_id = v_user AND sticker_id = p_offered_sticker_id) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Você não possui esta figurinha para oferecer');
  END IF;

  INSERT INTO public.sticker_trades(offerer_id, offered_sticker_id, wanted_sticker_id, status)
  VALUES (v_user, p_offered_sticker_id, p_wanted_sticker_id, 'open');

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.propose_sticker_trade(uuid, uuid) TO authenticated;
