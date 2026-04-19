-- SCRIPT DEFINITIVO - Imagens do Harry Potter Fandom Wiki (sem bloqueio de hotlink)
TRUNCATE TABLE public.stickers CASCADE;

INSERT INTO public.stickers (character_name, rarity, image_url, level_required) VALUES
-- BRONZE (Nível 1)
('Rúbeo Hagrid',       'bronze', 'https://static.wikia.nocookie.net/harrypotter/images/3/31/Rubeus_Hagrid.jpg',           1),
('Dobby',              'bronze', 'https://static.wikia.nocookie.net/harrypotter/images/7/73/Dobby.jpg',                    1),
('Neville Longbottom', 'bronze', 'https://static.wikia.nocookie.net/harrypotter/images/9/9e/Neville_Longbottom.jpg',       1),
('Luna Lovegood',      'bronze', 'https://static.wikia.nocookie.net/harrypotter/images/4/4f/LunaLovegood.jpg',             1),
('Gina Weasley',       'bronze', 'https://static.wikia.nocookie.net/harrypotter/images/2/27/GinnyFull.jpg',                1),

-- SILVER (Nível 2-3)
('Draco Malfoy',       'silver', 'https://static.wikia.nocookie.net/harrypotter/images/1/15/Dracomalfoy.jpg',              2),
('Hermione Granger',   'silver', 'https://static.wikia.nocookie.net/harrypotter/images/6/6e/Hermione_Granger_poster.jpg',  3),
('Ronald Weasley',     'silver', 'https://static.wikia.nocookie.net/harrypotter/images/5/5e/Ron_Weasley.jpg',              3),
('Severo Snape',       'silver', 'https://static.wikia.nocookie.net/harrypotter/images/2/2e/Snape_fl.jpg',                 3),
('Sirius Black',       'silver', 'https://static.wikia.nocookie.net/harrypotter/images/2/24/Sirius_Black_OOTP.jpg',        3),

-- GOLD (Nível 4-5)
('Harry Potter',       'gold',   'https://static.wikia.nocookie.net/harrypotter/images/7/7e/Harry_Potter_Movie_poster.jpg', 4),
('Alvo Dumbledore',    'gold',   'https://static.wikia.nocookie.net/harrypotter/images/9/93/Dumbledore_and_Elder_Wand.jpg', 5),
('Lord Voldemort',     'gold',   'https://static.wikia.nocookie.net/harrypotter/images/b/b7/Voldemort_poster.jpg',          5),
('Minerva McGonagall', 'gold',   'https://static.wikia.nocookie.net/harrypotter/images/6/61/McGonagall-PM.jpg',             5);
