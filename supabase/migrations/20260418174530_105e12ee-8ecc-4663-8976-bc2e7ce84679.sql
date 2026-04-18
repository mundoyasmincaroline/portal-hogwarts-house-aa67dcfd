-- 1. Permitir authenticated criar canais (necessário para auto-criação dos salões)
CREATE POLICY "Authenticated can create channels"
ON public.channels
FOR INSERT TO authenticated
WITH CHECK (true);

-- 2. Popular figurinhas (apenas se a tabela estiver vazia)
INSERT INTO public.stickers (character_name, rarity, image_url, level_required)
SELECT * FROM (VALUES
  ('Harry Potter', 'gold', 'https://images.unsplash.com/photo-1618944847823-72c1cce8a8e1?q=80&w=500', 5),
  ('Alvo Dumbledore', 'gold', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=500', 10),
  ('Lord Voldemort', 'gold', 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=500', 15),
  ('Hermione Granger', 'silver', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=500', 3),
  ('Rony Weasley', 'silver', 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=500', 2),
  ('Severo Snape', 'silver', 'https://images.unsplash.com/photo-1528629297340-d1d466945dc5?q=80&w=500', 6),
  ('Minerva McGonagall', 'silver', 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=500', 4),
  ('Draco Malfoy', 'bronze', 'https://images.unsplash.com/photo-1587324438673-56c891e47900?q=80&w=500', 1),
  ('Neville Longbottom', 'bronze', 'https://images.unsplash.com/photo-1593351415075-3bac9f45c877?q=80&w=500', 1),
  ('Luna Lovegood', 'bronze', 'https://images.unsplash.com/photo-1507676184212-d0330a156f88?q=80&w=500', 1),
  ('Gina Weasley', 'bronze', 'https://images.unsplash.com/photo-1500522144261-ea64433bbe27?q=80&w=500', 1),
  ('Rúbeo Hagrid', 'bronze', 'https://images.unsplash.com/photo-1478147427282-58a87a120781?q=80&w=500', 1)
) AS v(character_name, rarity, image_url, level_required)
WHERE NOT EXISTS (SELECT 1 FROM public.stickers);