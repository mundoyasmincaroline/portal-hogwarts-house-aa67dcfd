-- SCRIPT DEFINITIVO v3 — HP-API CDN (CORS livre, sem bloqueio de hotlink)
-- Fonte: hp-api.onrender.com / ImageKit CDN oficial
TRUNCATE TABLE public.stickers CASCADE;

INSERT INTO public.stickers (character_name, rarity, image_url, level_required) VALUES
-- BRONZE (Nível 1)
('Rúbeo Hagrid',       'bronze', 'https://ik.imagekit.io/hpapi/hagrid.jpg',       1),
('Dobby',              'bronze', 'https://ik.imagekit.io/hpapi/dobby.jpg',         1),
('Neville Longbottom', 'bronze', 'https://ik.imagekit.io/hpapi/neville.jpg',       1),
('Luna Lovegood',      'bronze', 'https://ik.imagekit.io/hpapi/luna.jpeg',         1),
('Gina Weasley',       'bronze', 'https://ik.imagekit.io/hpapi/ginny.jpg',         1),

-- SILVER (Nível 2-3)
('Draco Malfoy',       'silver', 'https://ik.imagekit.io/hpapi/draco.jpg',         2),
('Hermione Granger',   'silver', 'https://ik.imagekit.io/hpapi/hermione.jpeg',     3),
('Ronald Weasley',     'silver', 'https://ik.imagekit.io/hpapi/ron.jpg',           3),
('Severo Snape',       'silver', 'https://ik.imagekit.io/hpapi/snape.jpeg',        3),
('Sirius Black',       'silver', 'https://ik.imagekit.io/hpapi/sirius.jpg',        3),

-- GOLD (Nível 4-5)
('Harry Potter',       'gold',   'https://ik.imagekit.io/hpapi/harry.jpg',         4),
('Alvo Dumbledore',    'gold',   'https://ik.imagekit.io/hpapi/dumbledore.jpg',    5),
('Lord Voldemort',     'gold',   'https://ik.imagekit.io/hpapi/voldemort.jpg',     5),
('Minerva McGonagall', 'gold',   'https://ik.imagekit.io/hpapi/mcgonagall.jpeg',   5);
