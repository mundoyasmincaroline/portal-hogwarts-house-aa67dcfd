-- SCRIPT DE CORREÇÃO DAS FIGURINHAS (HOGWARTS IMAGES)

-- Remove figurinhas genéricas antigas
TRUNCATE TABLE public.stickers CASCADE;

-- Insere figurinhas oficiais com URLs válidas
INSERT INTO public.stickers (character_name, rarity, image_url, level_required) VALUES
('Harry Potter', 'gold', 'https://i.pinimg.com/736x/8d/62/72/8d62725f09cb8d9e61c390558197c36a.jpg', 5),
('Alvo Dumbledore', 'gold', 'https://i.pinimg.com/736x/71/34/00/713400a4db6e56846f4144365da98495.jpg', 5),
('Lord Voldemort', 'gold', 'https://i.pinimg.com/736x/51/e0/75/51e075d9e5a873132fcb9f56e9c6128d.jpg', 4),
('Hermione Granger', 'silver', 'https://i.pinimg.com/736x/21/df/b8/21dfb8c2d1b88e6308ba0f0c0da53b52.jpg', 3),
('Ron Weasley', 'silver', 'https://i.pinimg.com/736x/f6/cb/35/f6cb35d252f5ee66dbcebd67ea2c2197.jpg', 3),
('Severus Snape', 'silver', 'https://i.pinimg.com/736x/c5/d1/9b/c5d19b33a5da1f1fb6b22ebce27abda3.jpg', 3),
('Draco Malfoy', 'bronze', 'https://i.pinimg.com/736x/d6/0e/db/d60edba4895ee54452140cda3d4d38dc.jpg', 1),
('Neville Longbottom', 'bronze', 'https://i.pinimg.com/736x/7d/54/22/7d5422894582f34ee69002242131b790.jpg', 1),
('Rúbeo Hagrid', 'bronze', 'https://i.pinimg.com/736x/74/4e/1b/744e1bad59b92ed50099689408034dbf.jpg', 1);
