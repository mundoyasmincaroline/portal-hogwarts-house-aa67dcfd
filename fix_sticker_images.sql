-- SCRIPT FINAL DE CORREÇÃO DAS FIGURINHAS
-- Utiliza um proxy oficial de imagens (wsrv.nl) para burlar completamente o bloqueio do Pinterest.

TRUNCATE TABLE public.stickers CASCADE;

INSERT INTO public.stickers (character_name, rarity, image_url, level_required) VALUES
('Harry Potter', 'gold', 'https://wsrv.nl/?url=i.pinimg.com/736x/8d/62/72/8d62725f09cb8d9e61c390558197c36a.jpg', 4),
('Alvo Dumbledore', 'gold', 'https://wsrv.nl/?url=i.pinimg.com/736x/71/34/00/713400a4db6e56846f4144365da98495.jpg', 5),
('Lord Voldemort', 'gold', 'https://wsrv.nl/?url=i.pinimg.com/736x/51/e0/75/51e075d9e5a873132fcb9f56e9c6128d.jpg', 5),
('Minerva McGonagall', 'gold', 'https://wsrv.nl/?url=i.pinimg.com/736x/07/dc/fc/07dcfc7865239e26da7e9eecdb3672d4.jpg', 5),

('Hermione Granger', 'silver', 'https://wsrv.nl/?url=i.pinimg.com/736x/21/df/b8/21dfb8c2d1b88e6308ba0f0c0da53b52.jpg', 3),
('Ronald Weasley', 'silver', 'https://wsrv.nl/?url=i.pinimg.com/736x/f6/cb/35/f6cb35d252f5ee66dbcebd67ea2c2197.jpg', 3),
('Severo Snape', 'silver', 'https://wsrv.nl/?url=i.pinimg.com/736x/c5/d1/9b/c5d19b33a5da1f1fb6b22ebce27abda3.jpg', 3),
('Draco Malfoy', 'silver', 'https://wsrv.nl/?url=i.pinimg.com/736x/d6/0e/db/d60edba4895ee54452140cda3d4d38dc.jpg', 2),
('Sirius Black', 'silver', 'https://wsrv.nl/?url=i.pinimg.com/736x/0c/b5/d9/0cb5d985a9ed7a71a3980df96556fdb4.jpg', 3),

('Rúbeo Hagrid', 'bronze', 'https://wsrv.nl/?url=i.pinimg.com/736x/74/4e/1b/744e1bad59b92ed50099689408034dbf.jpg', 1),
('Dobby', 'bronze', 'https://wsrv.nl/?url=i.pinimg.com/736x/b2/2f/78/b22f788b13c721c60f224f2b968c9288.jpg', 1),
('Neville Longbottom', 'bronze', 'https://wsrv.nl/?url=i.pinimg.com/736x/7d/54/22/7d5422894582f34ee69002242131b790.jpg', 1),
('Luna Lovegood', 'bronze', 'https://wsrv.nl/?url=i.pinimg.com/736x/bd/ec/04/bdec048e421ef8e60a35db4057881c1c.jpg', 1),
('Gina Weasley', 'bronze', 'https://wsrv.nl/?url=i.pinimg.com/736x/eb/6f/a6/eb6fa6b0e98031d683e351f0412808ad.jpg', 1);
