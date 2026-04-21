-- ============================================================
-- PREMIUM STICKERS — Álbum Oficial de Fidelidade
-- Revertendo para imagens da saga (HP-API)
-- ============================================================

TRUNCATE TABLE public.stickers CASCADE;

INSERT INTO public.stickers (character_name, rarity, image_url, level_required) VALUES

-- GOLD (Nível 4-5)
('Harry Potter',       'gold',   '/sticker_harry_gold.png',         4),
('Alvo Dumbledore',    'gold',   'https://hp-api.herokuapp.com/images/dumbledore.jpg',    5),
('Lord Voldemort',     'gold',   'https://hp-api.herokuapp.com/images/voldemort.jpg',     5),
('Minerva McGonagall', 'gold',   'https://hp-api.herokuapp.com/images/mcgonagall.jpg',   5),

-- SILVER (Nível 2-3)
('Hermione Granger',   'silver', 'https://hp-api.herokuapp.com/images/hermione.jpg',     3),
('Ronald Weasley',     'silver', 'https://hp-api.herokuapp.com/images/ron.jpg',          3),
('Severo Snape',       'silver', 'https://hp-api.herokuapp.com/images/snape.jpg',        3),
('Draco Malfoy',       'silver', 'https://hp-api.herokuapp.com/images/draco.jpg',        2),
('Sirius Black',       'silver', 'https://hp-api.herokuapp.com/images/sirius.jpg',       3),

-- BRONZE (Nível 1)
('Rúbeo Hagrid',       'bronze', 'https://hp-api.herokuapp.com/images/hagrid.jpg',       1),
('Dobby',              'bronze', 'https://www.hp-api.herokuapp.com/images/dobby.jpg',     1),
('Luna Lovegood',      'bronze', 'https://hp-api.herokuapp.com/images/luna.jpg',         1);
