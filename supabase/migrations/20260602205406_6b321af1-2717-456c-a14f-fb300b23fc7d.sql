
-- ============ CATÁLOGO HOGSMEADE ============
CREATE TABLE public.hogsmeade_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('wand','potion','sweet','robe','pet','book','accessory','broom')),
  emoji text NOT NULL DEFAULT '✨',
  price_galeons integer NOT NULL CHECK (price_galeons >= 0),
  rarity text NOT NULL DEFAULT 'common' CHECK (rarity IN ('common','uncommon','rare','epic','legendary')),
  stock_limit integer,
  tradable boolean NOT NULL DEFAULT true,
  equippable boolean NOT NULL DEFAULT false,
  consumable boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hogsmeade_items TO anon, authenticated;
GRANT ALL ON public.hogsmeade_items TO service_role;
ALTER TABLE public.hogsmeade_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "items_public_read" ON public.hogsmeade_items FOR SELECT USING (active = true OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "items_admin_write" ON public.hogsmeade_items FOR ALL USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- ============ INVENTÁRIO PESSOAL ============
CREATE TABLE public.user_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_id uuid NOT NULL REFERENCES public.hogsmeade_items(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  equipped boolean NOT NULL DEFAULT false,
  obtained_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_inventory TO authenticated;
GRANT ALL ON public.user_inventory TO service_role;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inv_owner_read" ON public.user_inventory FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "inv_owner_update" ON public.user_inventory FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_inv_user ON public.user_inventory(user_id);

-- ============ TROCAS ENTRE ALUNOS ============
CREATE TABLE public.item_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  offered_item_id uuid REFERENCES public.hogsmeade_items(id),
  offered_qty integer NOT NULL DEFAULT 0 CHECK (offered_qty >= 0),
  offered_galeons integer NOT NULL DEFAULT 0 CHECK (offered_galeons >= 0),
  requested_item_id uuid REFERENCES public.hogsmeade_items(id),
  requested_qty integer NOT NULL DEFAULT 0 CHECK (requested_qty >= 0),
  requested_galeons integer NOT NULL DEFAULT 0 CHECK (requested_galeons >= 0),
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','cancelled','expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  CHECK (sender_id <> recipient_id),
  CHECK (offered_item_id IS NOT NULL OR offered_galeons > 0),
  CHECK (requested_item_id IS NOT NULL OR requested_galeons > 0)
);
GRANT SELECT, INSERT, UPDATE ON public.item_trades TO authenticated;
GRANT ALL ON public.item_trades TO service_role;
ALTER TABLE public.item_trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trades_involved_read" ON public.item_trades FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "trades_sender_create" ON public.item_trades FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);
CREATE INDEX idx_trade_recipient ON public.item_trades(recipient_id, status);
CREATE INDEX idx_trade_sender ON public.item_trades(sender_id, status);

-- ============ FUNÇÕES ============
CREATE OR REPLACE FUNCTION public.buy_hogsmeade_item(p_item_id uuid, p_qty integer DEFAULT 1)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid := auth.uid(); v_item record; v_bal int; v_cost int;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF p_qty <= 0 OR p_qty > 99 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
  SELECT * INTO v_item FROM public.hogsmeade_items WHERE id = p_item_id AND active;
  IF NOT FOUND THEN RAISE EXCEPTION 'Item indisponível'; END IF;
  v_cost := v_item.price_galeons * p_qty;
  SELECT COALESCE(galeons,0) INTO v_bal FROM public.profiles WHERE user_id = v_user FOR UPDATE;
  IF v_bal < v_cost THEN RAISE EXCEPTION 'Galeões insuficientes (precisa de %)', v_cost; END IF;
  UPDATE public.profiles SET galeons = galeons - v_cost WHERE user_id = v_user;
  INSERT INTO public.user_inventory(user_id, item_id, quantity)
    VALUES (v_user, p_item_id, p_qty)
    ON CONFLICT (user_id, item_id) DO UPDATE SET quantity = public.user_inventory.quantity + EXCLUDED.quantity;
  INSERT INTO public.currency_ledger(user_id, currency_type, amount, transaction_type, description)
    VALUES (v_user, 'galeons', -v_cost, 'hogsmeade_purchase', 'Comprou ' || p_qty || 'x ' || v_item.name);
  INSERT INTO public.notifications(user_id, title, message, link)
    VALUES (v_user, '🛍️ Compra em Hogsmeade', 'Você adquiriu ' || p_qty || 'x ' || v_item.emoji || ' ' || v_item.name, '/dashboard/inventory');
  RETURN jsonb_build_object('ok', true, 'cost', v_cost);
END $$;

CREATE OR REPLACE FUNCTION public.propose_item_trade(
  p_recipient_id uuid,
  p_offered_item uuid, p_offered_qty int, p_offered_gal int,
  p_requested_item uuid, p_requested_qty int, p_requested_gal int,
  p_message text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid := auth.uid(); v_owned int; v_bal int; v_id uuid; v_item record;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF v_user = p_recipient_id THEN RAISE EXCEPTION 'Não pode trocar consigo mesmo'; END IF;
  IF p_offered_item IS NULL AND p_offered_gal <= 0 THEN RAISE EXCEPTION 'Ofereça algo'; END IF;
  IF p_requested_item IS NULL AND p_requested_gal <= 0 THEN RAISE EXCEPTION 'Peça algo'; END IF;

  IF p_offered_item IS NOT NULL THEN
    SELECT * INTO v_item FROM public.hogsmeade_items WHERE id = p_offered_item;
    IF NOT v_item.tradable THEN RAISE EXCEPTION 'Item não pode ser trocado'; END IF;
    SELECT COALESCE(quantity,0) INTO v_owned FROM public.user_inventory WHERE user_id=v_user AND item_id=p_offered_item;
    IF COALESCE(v_owned,0) < p_offered_qty THEN RAISE EXCEPTION 'Você não possui % dessa quantidade', v_item.name; END IF;
  END IF;
  IF p_offered_gal > 0 THEN
    SELECT COALESCE(galeons,0) INTO v_bal FROM public.profiles WHERE user_id=v_user;
    IF v_bal < p_offered_gal THEN RAISE EXCEPTION 'Galeões insuficientes'; END IF;
  END IF;

  INSERT INTO public.item_trades(sender_id, recipient_id, offered_item_id, offered_qty, offered_galeons,
    requested_item_id, requested_qty, requested_galeons, message)
  VALUES (v_user, p_recipient_id, p_offered_item, COALESCE(p_offered_qty,0), COALESCE(p_offered_gal,0),
    p_requested_item, COALESCE(p_requested_qty,0), COALESCE(p_requested_gal,0), p_message)
  RETURNING id INTO v_id;

  INSERT INTO public.notifications(user_id, title, message, link)
  VALUES (p_recipient_id, '🤝 Nova proposta de troca', 'Um bruxo enviou uma proposta para você.', '/dashboard/item-trades');
  RETURN jsonb_build_object('ok', true, 'id', v_id);
END $$;

CREATE OR REPLACE FUNCTION public.respond_item_trade(p_trade_id uuid, p_accept boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid := auth.uid(); v_t record; v_owned int; v_bal int;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO v_t FROM public.item_trades WHERE id = p_trade_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Troca não encontrada'; END IF;
  IF v_t.recipient_id <> v_user THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF v_t.status <> 'pending' THEN RAISE EXCEPTION 'Troca já respondida'; END IF;
  IF v_t.expires_at < now() THEN
    UPDATE public.item_trades SET status='expired' WHERE id = p_trade_id;
    RAISE EXCEPTION 'Troca expirada';
  END IF;

  IF NOT p_accept THEN
    UPDATE public.item_trades SET status='rejected', resolved_at=now() WHERE id = p_trade_id;
    INSERT INTO public.notifications(user_id,title,message,link)
    VALUES (v_t.sender_id,'❌ Troca recusada','Sua proposta foi recusada.','/dashboard/item-trades');
    RETURN jsonb_build_object('ok',true,'accepted',false);
  END IF;

  -- Validar requisitado (do recipient)
  IF v_t.requested_item_id IS NOT NULL THEN
    SELECT COALESCE(quantity,0) INTO v_owned FROM public.user_inventory WHERE user_id=v_user AND item_id=v_t.requested_item_id;
    IF COALESCE(v_owned,0) < v_t.requested_qty THEN RAISE EXCEPTION 'Você não possui o item pedido na quantidade necessária'; END IF;
  END IF;
  IF v_t.requested_galeons > 0 THEN
    SELECT COALESCE(galeons,0) INTO v_bal FROM public.profiles WHERE user_id=v_user;
    IF v_bal < v_t.requested_galeons THEN RAISE EXCEPTION 'Galeões insuficientes'; END IF;
  END IF;
  -- Re-validar oferecido (do sender)
  IF v_t.offered_item_id IS NOT NULL THEN
    SELECT COALESCE(quantity,0) INTO v_owned FROM public.user_inventory WHERE user_id=v_t.sender_id AND item_id=v_t.offered_item_id;
    IF COALESCE(v_owned,0) < v_t.offered_qty THEN RAISE EXCEPTION 'Proponente não tem mais o item'; END IF;
  END IF;
  IF v_t.offered_galeons > 0 THEN
    SELECT COALESCE(galeons,0) INTO v_bal FROM public.profiles WHERE user_id=v_t.sender_id;
    IF v_bal < v_t.offered_galeons THEN RAISE EXCEPTION 'Proponente sem galeões'; END IF;
  END IF;

  -- Transferir itens oferecidos: sender -> recipient
  IF v_t.offered_item_id IS NOT NULL AND v_t.offered_qty > 0 THEN
    UPDATE public.user_inventory SET quantity = quantity - v_t.offered_qty
      WHERE user_id = v_t.sender_id AND item_id = v_t.offered_item_id;
    DELETE FROM public.user_inventory WHERE user_id=v_t.sender_id AND item_id=v_t.offered_item_id AND quantity <= 0;
    INSERT INTO public.user_inventory(user_id,item_id,quantity)
      VALUES (v_t.recipient_id, v_t.offered_item_id, v_t.offered_qty)
      ON CONFLICT (user_id,item_id) DO UPDATE SET quantity = public.user_inventory.quantity + EXCLUDED.quantity;
  END IF;
  -- Transferir itens pedidos: recipient -> sender
  IF v_t.requested_item_id IS NOT NULL AND v_t.requested_qty > 0 THEN
    UPDATE public.user_inventory SET quantity = quantity - v_t.requested_qty
      WHERE user_id = v_t.recipient_id AND item_id = v_t.requested_item_id;
    DELETE FROM public.user_inventory WHERE user_id=v_t.recipient_id AND item_id=v_t.requested_item_id AND quantity <= 0;
    INSERT INTO public.user_inventory(user_id,item_id,quantity)
      VALUES (v_t.sender_id, v_t.requested_item_id, v_t.requested_qty)
      ON CONFLICT (user_id,item_id) DO UPDATE SET quantity = public.user_inventory.quantity + EXCLUDED.quantity;
  END IF;
  -- Transferir galeões
  IF v_t.offered_galeons > 0 THEN
    UPDATE public.profiles SET galeons = galeons - v_t.offered_galeons WHERE user_id = v_t.sender_id;
    PERFORM public.credit_galeons_atomic(v_t.recipient_id, v_t.offered_galeons);
  END IF;
  IF v_t.requested_galeons > 0 THEN
    UPDATE public.profiles SET galeons = galeons - v_t.requested_galeons WHERE user_id = v_t.recipient_id;
    PERFORM public.credit_galeons_atomic(v_t.sender_id, v_t.requested_galeons);
  END IF;

  UPDATE public.item_trades SET status='accepted', resolved_at=now() WHERE id = p_trade_id;
  INSERT INTO public.notifications(user_id,title,message,link)
  VALUES (v_t.sender_id,'✅ Troca aceita!','Sua proposta foi aceita.','/dashboard/item-trades');
  RETURN jsonb_build_object('ok',true,'accepted',true);
END $$;

CREATE OR REPLACE FUNCTION public.cancel_item_trade(p_trade_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid := auth.uid(); v_t record;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO v_t FROM public.item_trades WHERE id = p_trade_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Troca não encontrada'; END IF;
  IF v_t.sender_id <> v_user AND NOT has_role(v_user,'admin'::app_role) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF v_t.status <> 'pending' THEN RAISE EXCEPTION 'Troca já encerrada'; END IF;
  UPDATE public.item_trades SET status='cancelled', resolved_at=now() WHERE id = p_trade_id;
  RETURN jsonb_build_object('ok', true);
END $$;

-- ============ SEED CATÁLOGO ============
INSERT INTO public.hogsmeade_items (name, description, category, emoji, price_galeons, rarity, equippable, consumable) VALUES
('Varinha de Sabugueiro','Lendária varinha mais poderosa do mundo bruxo','wand','🪄',500,'legendary',true,false),
('Varinha de Carvalho','Robusta e confiável','wand','🪄',80,'common',true,false),
('Varinha de Salgueiro','Flexível e elegante','wand','🪄',120,'uncommon',true,false),
('Poção Polissuco','Transforma você em outra pessoa','potion','🧪',150,'rare',false,true),
('Felix Felicis','Sorte líquida engarrafada','potion','🍀',300,'epic',false,true),
('Poção de Cura','Restaura ferimentos leves','potion','💊',25,'common',false,true),
('Veritaserum','Soro da verdade','potion','💧',200,'rare',false,true),
('Sapos de Chocolate','Doce clássico da Dedosdemel','sweet','🍫',5,'common',false,true),
('Feijõezinhos de Todos os Sabores','Cuidado com o de cera de ouvido!','sweet','🍬',8,'common',false,true),
('Cerveja Amanteigada','Bebida favorita dos bruxos','sweet','🍺',15,'common',false,true),
('Pirulitos Ácidos','Faz a língua arder','sweet','🍭',6,'common',false,true),
('Vestes de Gala','Túnica formal para bailes','robe','🥻',180,'uncommon',true,false),
('Capa de Invisibilidade','Te torna invisível','accessory','🧥',1000,'legendary',true,false),
('Cachecol da Casa','Mostre orgulho da sua casa','robe','🧣',40,'common',true,false),
('Coruja-das-torres','Mascote fiel para entregas','pet','🦉',250,'rare',true,false),
('Gato Pelúcia','Companheiro felpudo','pet','🐱',180,'uncommon',true,false),
('Sapo de Estimação','Companheiro pequeno e calmo','pet','🐸',60,'common',true,false),
('Vassoura Nimbus 2000','Vassoura veloz para Quadribol','broom','🧹',800,'epic',true,false),
('Vassoura Cleansweep','Boa para iniciantes','broom','🧹',200,'uncommon',true,false),
('Quase Sem-Cabeça (Livro)','Crônicas dos fantasmas de Hogwarts','book','📖',35,'common',false,false);
