-- 1. Garante que a coluna has_seen_intro existe corretamente
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_seen_intro BOOLEAN DEFAULT false;

-- 2. Limpa e recria os Canais (Chat Rooms) com codificação 100% limpa (sem caracteres corrompidos)
DELETE FROM public.channels;
INSERT INTO public.channels (name, description, category, allowed_houses, is_admin_only) VALUES
  ('Chat Off', 'Conversas fora do RPG (Off-topic).', 'Geral', NULL, FALSE),
  ('Eventos', 'Avisos e cobertura de eventos do portal.', 'Geral', NULL, FALSE),
  ('Profeta Diário', 'Notícias do mundo bruxo.', 'Geral', NULL, FALSE),
  
  ('Chat ON', 'Conversas gerais dentro do RPG.', 'RPG', NULL, FALSE),
  ('Castelo RPG', 'Exploração e interação pelo castelo de Hogwarts.', 'RPG', NULL, FALSE),
  ('RPF Fora de Hogwarts', 'Roleplay de locais fora da escola (Hogsmeade, Beco Diagonal, etc).', 'RPG', NULL, FALSE),
  
  ('Comunal da Grifinória', 'Acesso exclusivo aos corajosos da Grifinória.', 'Comunais', ARRAY['gryffindor'], FALSE),
  ('Comunal da Sonserina', 'Acesso exclusivo aos astutos da Sonserina.', 'Comunais', ARRAY['slytherin'], FALSE),
  ('Comunal da Corvinal', 'Acesso exclusivo aos sábios da Corvinal.', 'Comunais', ARRAY['ravenclaw'], FALSE),
  ('Comunal da Lufa-Lufa', 'Acesso exclusivo aos leais da Lufa-Lufa.', 'Comunais', ARRAY['hufflepuff'], FALSE),
  
  ('Ordem da Fênix', 'Reuniões da moderação e administração.', 'Admin', NULL, TRUE),
  ('𝐅𝐢𝐜𝐡𝐚𝐬 𝐏𝐞𝐬𝐬𝐨𝐚𝐢𝐬 ₊ ෆ ˚', 'Envie sua ficha pessoal aqui para o portal conhecer você!', 'Fichas', NULL, FALSE),
  ('𝐅𝐢𝐜𝐡𝐚𝐬 𝐏𝐞𝐫𝐬𝐨𝐧𝐚𝐠𝐞𝐧𝐬 ₊ ෆ ˚', 'Envie a ficha do seu personagem do RPG aqui.', 'Fichas', NULL, FALSE);

-- 3. Garante que a tabela de figurinhas existe e insere as figurinhas mágicas no álbum
CREATE TABLE IF NOT EXISTS public.stickers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_name TEXT NOT NULL,
    rarity TEXT NOT NULL CHECK (rarity IN ('bronze', 'silver', 'gold')),
    image_url TEXT NOT NULL,
    level_required INTEGER DEFAULT 1
);

DELETE FROM public.stickers;
INSERT INTO public.stickers (character_name, rarity, image_url, level_required) VALUES
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
  ('Rúbeo Hagrid', 'bronze', 'https://images.unsplash.com/photo-1478147427282-58a87a120781?q=80&w=500', 1);

-- 4. Atualiza a política de update para ter certeza que has_seen_intro consegue ser atualizado
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Recarrega o schema na API do Supabase para refletir as mudanças imediatamente
NOTIFY pgrst, 'reload schema';
