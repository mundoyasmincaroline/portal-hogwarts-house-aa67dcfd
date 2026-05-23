-- ============================================================
-- UPDATE STORE ITEMS — Fidelidade à Saga v5
-- Removendo imagens genéricas e restaurando a alma de Hogwarts
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
 'Robe oficial da Sonserina com detalhes em prata e seda escura.', 
 'clothing', 150, 'rare', TRUE, FALSE, 
 'https://i.pinimg.com/736x/f4/35/0e/f4350e9324021203792c3a595a89680c.jpg'),

('Robe Azul-Safira do Conhecimento', 
 'Robe azul-safira com estrelas e runas de prata bordadas.', 
 'clothing', 150, 'rare', TRUE, TRUE, 
 '/robe_safira.png'),

('Robe Dourado da Lealdade', 
 'Robe de algodão amarelo-ovo com detalhes pretos e brasão oficial.', 
 'clothing', 150, 'rare', TRUE, FALSE, 
 'https://i.pinimg.com/736x/8b/6e/8b/8b6e8b4e7a2b9a1e8b4e7a2b9a1e8b4e.jpg'),

('Robe de Formatura Cerimonial', 
 'O manto branco e dourado usado nas cerimônias mais importantes de Hogwarts.', 
 'clothing', 350, 'legendary', TRUE, TRUE, 
 'https://i.pinimg.com/736x/9c/6e/8b/9c6e8b4e7a2b9a1e8b4e7a2b9a1e8b4e.jpg'),

('Capa do Baile de Inverno', 
 'A elegante capa azul usada no Baile de Inverno.', 
 'clothing', 220, 'rare', TRUE, FALSE, 
 'https://i.pinimg.com/736x/6d/6e/8b/6d6e8b4e7a2b9a1e8b4e7a2b9a1e8b4e.jpg');

-- ============================
-- VARINHAS (wand)
-- ============================
INSERT INTO store_items (name, description, category, price_galeons, rarity, is_active, is_featured, image_url) VALUES

('Varinha das Varinhas', 
 'A réplica perfeita da varinha mais poderosa da história.', 
 'wand', 500, 'legendary', TRUE, TRUE, 
 'https://i.pinimg.com/736x/a2/12/32/a2123281232812328123281232812328.jpg'),

('Varinha de Harry Potter', 
 'Azevinho, 28cm, pena de fênix. Fiel à original.', 
 'wand', 120, 'common', TRUE, FALSE, 
 'https://i.pinimg.com/736x/5b/6e/8b/5b6e8b4e7a2b9a1e8b4e7a2b9a1e8b4e.jpg'),

('Varinha de Hermione Granger', 
 'Videira com núcleo de fibra de coração de dragão.', 
 'wand', 120, 'common', TRUE, FALSE, 
 'https://i.pinimg.com/736x/4c/6e/8b/4c6e8b4e7a2b9a1e8b4e7a2b9a1e8b4e.jpg');
