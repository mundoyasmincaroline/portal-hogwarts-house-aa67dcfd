-- ============================================================
-- PREMIUM STICKERS — Álbum de Elite v1
-- Execute no Supabase SQL Editor
-- ============================================================

TRUNCATE TABLE public.stickers CASCADE;

INSERT INTO public.stickers (character_name, rarity, image_url, level_required) VALUES

-- GOLD (Nível 4-5)
('Harry Potter',       'gold',   '/sticker_harry_gold.png',         4),
('Alvo Dumbledore',    'gold',   'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80',    5),
('Lord Voldemort',     'gold',   'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80',    5),
('Minerva McGonagall', 'gold',   'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=800&q=80',    5),

-- SILVER (Nível 2-3)
('Hermione Granger',   'silver', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&q=80',    3),
('Ronald Weasley',     'silver', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80',    3),
('Severo Snape',       'silver', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&q=80',    3),
('Draco Malfoy',       'silver', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',    2),
('Sirius Black',       'silver', 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=800&q=80',    3),

-- BRONZE (Nível 1)
('Rúbeo Hagrid',       'bronze', 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=800&q=80',    1),
('Dobby',              'bronze', 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=800&q=80',    1),
('Luna Lovegood',      'bronze', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80',    1);
