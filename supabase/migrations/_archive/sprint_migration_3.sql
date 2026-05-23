-- ============================================================
-- MIGRATION 3: Sistema de Monetização — Galeões, Loja, VIP
-- Execute no Supabase SQL Editor
-- ============================================================

-- 1. Saldo de Galeões e VIP no perfil
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS galeons INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vip_plan TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS vip_expires_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Pedidos de compra de Galeões
CREATE TABLE IF NOT EXISTS galeon_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  package_id TEXT NOT NULL,
  amount_brl NUMERIC(10,2) NOT NULL,
  galeons INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','cancelled')),
  payment_link TEXT,
  infinitepay_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

ALTER TABLE galeon_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own orders"   ON galeon_orders;
DROP POLICY IF EXISTS "Users insert own orders" ON galeon_orders;
DROP POLICY IF EXISTS "Users update own orders" ON galeon_orders;
CREATE POLICY "Users view own orders"   ON galeon_orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users insert own orders" ON galeon_orders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own orders" ON galeon_orders FOR UPDATE USING (user_id = auth.uid());

-- 3. Catálogo de itens da loja
CREATE TABLE IF NOT EXISTS store_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('clothing','wand','accessory','skin','decoration','pack')),
  price_galeons INTEGER NOT NULL,
  image_url TEXT,
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common','rare','legendary')),
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE store_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active store items" ON store_items;
CREATE POLICY "Anyone can view active store items" ON store_items FOR SELECT USING (is_active = TRUE);

-- 4. Itens comprados pelos usuários
CREATE TABLE IF NOT EXISTS user_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES store_items(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

ALTER TABLE user_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own items" ON user_items;
DROP POLICY IF EXISTS "Anyone can view user items" ON user_items;
CREATE POLICY "Users manage own items" ON user_items FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Anyone can view user items" ON user_items FOR SELECT USING (TRUE);

-- 5. Assinaturas VIP
CREATE TABLE IF NOT EXISTS vip_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('premium','vip','founder')),
  amount_brl NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','cancelled','expired')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  infinitepay_id TEXT,
  galeons_monthly INTEGER DEFAULT 0
);

ALTER TABLE vip_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own subscriptions" ON vip_subscriptions;
CREATE POLICY "Users view own subscriptions" ON vip_subscriptions FOR SELECT USING (user_id = auth.uid());

-- 6. Seed inicial de itens da loja
INSERT INTO store_items (name, description, category, price_galeons, rarity, is_featured, image_url) VALUES
-- Roupas
('Robe de Grifinória Luxo', 'Robe vermelho e dourado com bordados mágicos exclusivos', 'clothing', 150, 'rare', TRUE, 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400'),
('Robe de Slytherin Dourado', 'Robe verde e prata com detalhes em ouro', 'clothing', 150, 'rare', FALSE, 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400'),
('Robe de Corvinal Encantado', 'Robe azul e bronze com estrelas cintilantes', 'clothing', 150, 'rare', FALSE, 'https://images.unsplash.com/photo-1534361960057-19f4434a337d?w=400'),
('Robe de Lufa-Lufa Dourado', 'Robe amarelo e preto com flores mágicas', 'clothing', 150, 'rare', FALSE, 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400'),
('Robes de Formatura Hogwarts', 'Robes oficiais da cerimônia de formatura', 'clothing', 300, 'legendary', TRUE, 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400'),
('Capa de Baile de Inverno', 'Capa elegante para o Baile de Inverno', 'clothing', 200, 'rare', FALSE, 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400'),

-- Varinhas
('Varinha de Sabugueiro ✨', 'Réplica da Varinha das Varinhas de Dumbledore — brilha dourado', 'wand', 500, 'legendary', TRUE, 'https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=400'),
('Varinha de Oliveira', 'Clássica varinha de oliveira com núcleo de pena de fênix', 'wand', 120, 'common', FALSE, 'https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=400'),
('Varinha Lendária das Trevas', 'Varinha sombria com partículas negras flutuantes', 'wand', 450, 'legendary', TRUE, 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400'),
('Varinha de Vidoeiro', 'Varinha clara e elegante com núcleo de pelo de veela', 'wand', 180, 'rare', FALSE, 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=400'),

-- Acessórios
('Óculos Mágicos Dourados', 'Óculos com lentes mágicas que revelam encantamentos', 'accessory', 200, 'rare', FALSE, 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400'),
('Chapéu Seletor Animado', 'O próprio Chapéu Seletor como acessório do perfil', 'accessory', 350, 'legendary', TRUE, 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400'),
('Capa de Invisibilidade', 'A lendária Capa de Invisibilidade — seu avatar some parcialmente', 'accessory', 600, 'legendary', TRUE, 'https://images.unsplash.com/photo-1535083783855-eba947ebe0ad?w=400'),
('Coruja Dourada Hedwig', 'Uma coruja dourada que acompanha seu perfil', 'accessory', 250, 'rare', FALSE, 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=400'),

-- Skins / Decorações de Perfil
('Moldura VIP Dourada', 'Moldura dourada animada para o avatar', 'skin', 200, 'rare', TRUE, 'https://images.unsplash.com/photo-1618944847823-72c1cce8a8e1?w=400'),
('Partículas Mágicas Roxas', 'Partículas mágicas que flutuam no perfil', 'skin', 150, 'rare', FALSE, 'https://images.unsplash.com/photo-1534361960057-19f4434a337d?w=400'),
('Nome Dourado Brilhante', 'Seu nome exibido em dourado cintilante em todo o portal', 'skin', 300, 'legendary', TRUE, 'https://images.unsplash.com/photo-1618944847823-72c1cce8a8e1?w=400'),
('Background Hogwarts Noturno', 'Fundo do perfil com Hogwarts à noite', 'skin', 180, 'common', FALSE, 'https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=400')

ON CONFLICT DO NOTHING;

-- 7. Índices
CREATE INDEX IF NOT EXISTS idx_galeon_orders_user ON galeon_orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_items_user ON user_items(user_id);
CREATE INDEX IF NOT EXISTS idx_store_items_category ON store_items(category, is_active);
CREATE INDEX IF NOT EXISTS idx_vip_subscriptions_user ON vip_subscriptions(user_id, status);

-- VERIFICAÇÃO
SELECT 'profiles.galeons' AS verificacao, COUNT(*) > 0 AS ok
  FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'galeons'
UNION ALL
SELECT 'store_items count', COUNT(*) > 0 FROM store_items
UNION ALL
SELECT 'galeon_orders table', COUNT(*) > 0 FROM information_schema.tables WHERE table_name = 'galeon_orders'
UNION ALL
SELECT 'user_items table', COUNT(*) > 0 FROM information_schema.tables WHERE table_name = 'user_items'
UNION ALL
SELECT 'vip_subscriptions table', COUNT(*) > 0 FROM information_schema.tables WHERE table_name = 'vip_subscriptions';
