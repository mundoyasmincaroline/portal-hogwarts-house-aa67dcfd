-- CRIAÇÃO DEFINITIVA DE TODOS OS CANAIS DO CASTELO
-- Como a tabela de canais tem alta segurança (RLS), o painel não consegue criar as salas sozinho se elas não existirem.
-- Este script insere todas as salas oficiais que faltavam no banco de dados.

INSERT INTO public.channels (name, description, category, allowed_houses, is_admin_only) VALUES
  ('Chat ON', 'Conversas gerais dentro do RPG.', 'RPG', NULL, FALSE),
  ('Castelo RPG', 'Exploração e interação pelo castelo de Hogwarts.', 'RPG', NULL, FALSE),
  ('RPF Fora de Hogwarts', 'Roleplay em Hogsmeade, Beco Diagonal, etc.', 'RPG', NULL, FALSE),
  
  ('𝐅𝐢𝐜𝐡𝐚𝐬 𝐏𝐞𝐬𝐬𝐨𝐚𝐢𝐬 ₊ ෆ ˚', 'Envie sua ficha pessoal aqui para o portal conhecer você!', 'Fichas', NULL, FALSE),
  ('𝐅𝐢𝐜𝐡𝐚𝐬 𝐏𝐞𝐫𝐬𝐨𝐧𝐚𝐠𝐞𝐧𝐬 ₊ ෆ ˚', 'Envie a ficha do seu personagem do RPG aqui.', 'Fichas', NULL, FALSE),

  ('Comunal da Grifinória', 'Acesso exclusivo aos corajosos da Grifinória.', 'Comunais', ARRAY['gryffindor'], FALSE),
  ('Comunal da Sonserina', 'Acesso exclusivo aos astutos da Sonserina.', 'Comunais', ARRAY['slytherin'], FALSE),
  ('Comunal da Corvinal', 'Acesso exclusivo aos sábios da Corvinal.', 'Comunais', ARRAY['ravenclaw'], FALSE),
  ('Comunal da Lufa-Lufa', 'Acesso exclusivo aos leais da Lufa-Lufa.', 'Comunais', ARRAY['hufflepuff'], FALSE)
ON CONFLICT DO NOTHING;
