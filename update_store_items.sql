-- ============================================================
-- UPDATE STORE ITEMS — Imagens Originais (sem direitos autorais)
-- Execute no Supabase SQL Editor após fazer upload das imagens
-- ============================================================

-- Limpar itens antigos e inserir novos com imagens originais
DELETE FROM store_items;

-- ============================
-- ROUPAS (clothing)
-- ============================
INSERT INTO store_items (name, description, category, price_galeons, rarity, is_active, is_featured, image_url) VALUES

-- Robes das Casas
('Robe Carmesim da Coragem',
 'Robe de veludo vermelho-carmesim com bordados dourados e runas brilhantes. Para quem carrega coragem no coração.',
 'clothing', 150, 'rare', TRUE, TRUE,
 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&q=80'),

('Robe das Sombras Esmeralda',
 'Robe de seda verde-esmeralda com detalhes em prata. Elegância e poder em cada fio da trama.',
 'clothing', 150, 'rare', TRUE, FALSE,
 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&q=80'),

('Robe Azul-Safira do Conhecimento',
 'Robe azul-safira com estrelas e runas de prata bordadas. A sabedoria costurada em cada detalhe.',
 'clothing', 150, 'rare', TRUE, FALSE,
 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&q=80'),

('Robe Dourado da Lealdade',
 'Robe amarelo-ouro com bordados negros e flores silvestres encantadas. Fidelidade e trabalho duro.',
 'clothing', 150, 'rare', TRUE, FALSE,
 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&q=80'),

('Robe de Formatura Cerimonial',
 'O mais prestigioso robe do castelo. Tecido de cetim branco com bordados em fio de ouro puro. Exclusivo para formandos.',
 'clothing', 350, 'legendary', TRUE, TRUE,
 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&q=80'),

('Capa do Baile de Inverno',
 'Capa de veludo azul-meia-noite com capuz e bordados de flocos de neve cintilantes. Para a noite mais mágica do ano.',
 'clothing', 220, 'rare', TRUE, FALSE,
 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&q=80'),

-- ============================
-- VARINHAS (wand)
-- ============================
('Varinha do Ancião Lendária',
 'A mais poderosa de todas as varinhas — esculpida em sabugueiro negro com runa dourada no cabo. Poder absoluto.',
 'wand', 500, 'legendary', TRUE, TRUE,
 'https://images.unsplash.com/photo-1592492152545-9695d3f473f4?w=400&q=80'),

('Varinha de Oliveira Clara',
 'Varinha clássica de madeira de oliveira com núcleo de fênix. Leve, precisa e confiável para qualquer feitiço.',
 'wand', 120, 'common', TRUE, FALSE,
 'https://images.unsplash.com/photo-1592492152545-9695d3f473f4?w=400&q=80'),

('Varinha das Trevas Encantada',
 'Varinha negra retorcida com partículas negras flutuantes e runas vermelhas gravadas. Para os mais ousados.',
 'wand', 450, 'legendary', TRUE, TRUE,
 'https://images.unsplash.com/photo-1592492152545-9695d3f473f4?w=400&q=80'),

('Varinha de Vidoeiro Prateada',
 'Varinha de madeira clara com veios prateados e núcleo de pelo de unicórnio. Elegante e poderosa.',
 'wand', 180, 'rare', TRUE, FALSE,
 'https://images.unsplash.com/photo-1592492152545-9695d3f473f4?w=400&q=80'),

-- ============================
-- ACESSÓRIOS (accessory)
-- ============================
('Óculos Encantados Dourados',
 'Óculos com armação dourada e lentes mágicas que revelam encantamentos ocultos ao redor. Estilo e magia.',
 'accessory', 200, 'rare', TRUE, FALSE,
 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&q=80'),

('Chapéu Seletor Animado',
 'O próprio Chapéu Seletor como acessório do perfil — sussurra fragmentos de sabedoria. Raridade máxima.',
 'accessory', 380, 'legendary', TRUE, TRUE,
 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&q=80'),

('Capa de Invisibilidade Prateada',
 'Capa feita de pelo de Demônio — seu avatar some parcialmente e deixa um rastro de luz prateada.',
 'accessory', 600, 'legendary', TRUE, TRUE,
 'https://images.unsplash.com/photo-1535083783855-eba947ebe0ad?w=400&q=80'),

('Coruja Dourada Encantada',
 'Uma coruja dourada que acompanha seu perfil, piscando e girando a cabeça. Companheira fiel e elegante.',
 'accessory', 250, 'rare', TRUE, FALSE,
 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=400&q=80'),

-- ============================
-- SKINS (skin)
-- ============================
('Moldura VIP Dourada Animada',
 'Moldura dourada brilhante e animada ao redor do avatar. Mostra ao mundo que você é especial.',
 'skin', 200, 'rare', TRUE, TRUE,
 'https://images.unsplash.com/photo-1618944847823-72c1cce8a8e1?w=400&q=80'),

('Partículas Arcanas Roxas',
 'Partículas mágicas roxas que flutuam ao redor do perfil, criando uma aura mística incomparável.',
 'skin', 150, 'rare', TRUE, FALSE,
 'https://images.unsplash.com/photo-1534361960057-19f4434a337d?w=400&q=80'),

('Nome em Ouro Cintilante',
 'Seu nome exibido em letras douradas brilhantes em todo o portal. Seja reconhecido onde quer que vá.',
 'skin', 320, 'legendary', TRUE, TRUE,
 'https://images.unsplash.com/photo-1618944847823-72c1cce8a8e1?w=400&q=80'),

('Fundo Castelo Encantado Noturno',
 'Fundo do perfil com um castelo mágico à meia-noite, estrelas cadentes e névoa misteriosa.',
 'skin', 180, 'common', TRUE, FALSE,
 'https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=400&q=80')

ON CONFLICT DO NOTHING;

-- Verificação
SELECT name, category, rarity, price_galeons FROM store_items ORDER BY category, price_galeons;
