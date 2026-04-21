-- ============================================================
-- UPDATE STORE ITEMS — Imagens Únicas e Premium v4 (Elite Collection)
-- Execute no Supabase SQL Editor para atualizar a vitrine
-- ============================================================

DELETE FROM store_items;

-- ============================
-- ROUPAS (clothing)
-- ============================
INSERT INTO store_items (name, description, category, price_galeons, rarity, is_active, is_featured, image_url) VALUES

('Robe Carmesim da Coragem', 
 'Robe de veludo vermelho-carmesim com bordados dourados e runas brilhantes.', 
 'clothing', 150, 'rare', TRUE, TRUE, 
 '/robe_carmesim.png'),

('Robe das Sombras Esmeralda', 
 'Robe de seda verde-esmeralda com detalhes em prata. Elegância e astúcia.', 
 'clothing', 150, 'rare', TRUE, FALSE, 
 'https://images.unsplash.com/photo-1603251578711-3290ca1a0187?w=800&q=80'),

('Robe Azul-Safira do Conhecimento', 
 'Robe azul-safira com estrelas e runas de prata bordadas.', 
 'clothing', 150, 'rare', TRUE, FALSE, 
 '/robe_safira.png'),

('Robe Dourado da Lealdade', 
 'Robe amarelo-ouro com bordados negros e flores silvestres encantadas.', 
 'clothing', 150, 'rare', TRUE, FALSE, 
 'https://images.unsplash.com/photo-1586075010633-2a44ed678e0c?w=800&q=80'),

('Robe de Formatura Cerimonial', 
 'O mais prestigioso robe do castelo. Tecido de cetim branco com bordados em fio de ouro puro.', 
 'clothing', 350, 'legendary', TRUE, TRUE, 
 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=800&q=80'),

('Capa do Baile de Inverno', 
 'Capa de veludo azul-meia-noite com capuz e bordados de flocos de neve.', 
 'clothing', 220, 'rare', TRUE, FALSE, 
 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=800&q=80');

-- ============================
-- VARINHAS (wand)
-- ============================
INSERT INTO store_items (name, description, category, price_galeons, rarity, is_active, is_featured, image_url) VALUES

('Varinha do Ancião Lendária', 
 'A mais poderosa de todas as varinhas — esculpida em sabugueiro negro.', 
 'wand', 500, 'legendary', TRUE, TRUE, 
 'https://images.unsplash.com/photo-1626245911244-671e16f31627?w=800&q=80'),

('Varinha Rúnica Ancestral', 
 'Madeira escura entalhada com runas brilhantes. Um artefato de poder imensurável.', 
 'wand', 2500, 'legendary', TRUE, TRUE, 
 'https://images.unsplash.com/photo-1616423642775-690a424266c2?w=800&q=80'),

('Varinha de Oliveira Clara', 
 'Varinha clássica de madeira de oliveira com núcleo de fênix.', 
 'wand', 120, 'common', TRUE, FALSE, 
 'https://images.unsplash.com/photo-1632733711679-5292d6997782?w=800&q=80'),

('Varinha de Vidoeiro Prateada', 
 'Varinha de madeira clara com veios prateados e núcleo de pelo de unicórnio.', 
 'wand', 180, 'rare', TRUE, FALSE, 
 'https://images.unsplash.com/photo-1618331835717-801e976710b2?w=800&q=80');

-- ============================
-- ACESSÓRIOS (accessory)
-- ============================
INSERT INTO store_items (name, description, category, price_galeons, rarity, is_active, is_featured, image_url) VALUES

('Moldura VIP Dourada Animada', 
 'Moldura dourada brilhante e animada ao redor do avatar.', 
 'accessory', 200, 'rare', TRUE, TRUE, 
 '/vip_coroa.png'),

('Coruja Dourada Encantada', 
 'Uma coruja dourada que acompanha seu perfil, piscando e girando a cabeça.', 
 'accessory', 250, 'rare', TRUE, FALSE, 
 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=800&q=80');
