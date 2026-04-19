-- =====================================================
-- CORREÇÃO COMPLETA DAS FIGURINHAS
-- Substitui todas as URLs do Pinterest (que bloqueiam
-- hotlink) por URLs públicas que funcionam no browser.
-- =====================================================

-- Limpa e repopula a tabela de stickers com URLs válidas
TRUNCATE TABLE public.stickers CASCADE;

INSERT INTO public.stickers (character_name, rarity, image_url, level_required) VALUES

-- ====== GOLD ======
('Harry Potter', 'gold',
 'https://static.wikia.nocookie.net/harrypotter/images/7/7e/HarryPotter_HBP.jpg',
 4),

('Alvo Dumbledore', 'gold',
 'https://static.wikia.nocookie.net/harrypotter/images/e/e3/Dumbledore_profile.jpg',
 5),

('Lord Voldemort', 'gold',
 'https://static.wikia.nocookie.net/harrypotter/images/b/b6/Voldemort.jpg',
 5),

('Minerva McGonagall', 'gold',
 'https://static.wikia.nocookie.net/harrypotter/images/5/55/McGonagall_profile.jpg',
 5),

-- ====== SILVER ======
('Hermione Granger', 'silver',
 'https://static.wikia.nocookie.net/harrypotter/images/8/83/Hermione_Granger_poster.jpg',
 3),

('Ronald Weasley', 'silver',
 'https://static.wikia.nocookie.net/harrypotter/images/5/5e/Ron_poster.jpg',
 3),

('Severo Snape', 'silver',
 'https://static.wikia.nocookie.net/harrypotter/images/5/53/Snapeprofile.jpg',
 3),

('Draco Malfoy', 'silver',
 'https://static.wikia.nocookie.net/harrypotter/images/e/e6/Draco_Malfoy_poster.jpg',
 2),

('Sirius Black', 'silver',
 'https://static.wikia.nocookie.net/harrypotter/images/5/5c/Sirius_Black.jpg',
 3),

-- ====== BRONZE ======
('Rúbeo Hagrid', 'bronze',
 'https://static.wikia.nocookie.net/harrypotter/images/3/32/Rubeus_Hagrid_poster.jpg',
 1),

('Dobby', 'bronze',
 'https://static.wikia.nocookie.net/harrypotter/images/e/e8/Dobble_poster.jpg',
 1),

('Neville Longbottom', 'bronze',
 'https://static.wikia.nocookie.net/harrypotter/images/e/e1/Neville_Longbottom_poster.jpg',
 1),

('Luna Lovegood', 'bronze',
 'https://static.wikia.nocookie.net/harrypotter/images/a/a9/Luna_Lovegood_poster.jpg',
 1),

('Gina Weasley', 'bronze',
 'https://static.wikia.nocookie.net/harrypotter/images/7/77/Ginny_poster.jpg',
 1);
