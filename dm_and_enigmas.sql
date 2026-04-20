-- ================================================
-- DM (Direct Messages) — Mensagens Diretas
-- Execute este script no Supabase SQL Editor
-- ================================================

CREATE TABLE IF NOT EXISTS public.dm_messages (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content     text        NOT NULL CHECK (char_length(content) > 0),
  read        boolean     DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

-- Index para busca rápida de conversas
CREATE INDEX IF NOT EXISTS dm_sender_idx   ON public.dm_messages (sender_id);
CREATE INDEX IF NOT EXISTS dm_receiver_idx ON public.dm_messages (receiver_id);
CREATE INDEX IF NOT EXISTS dm_pair_idx     ON public.dm_messages (sender_id, receiver_id);

-- RLS
ALTER TABLE public.dm_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "DM: users see own messages" ON public.dm_messages;
CREATE POLICY "DM: users see own messages"
  ON public.dm_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "DM: users send messages" ON public.dm_messages;
CREATE POLICY "DM: users send messages"
  ON public.dm_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "DM: mark as read" ON public.dm_messages;
CREATE POLICY "DM: mark as read"
  ON public.dm_messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Realtime (para o chat ao vivo)
ALTER PUBLICATION supabase_realtime ADD TABLE public.dm_messages;

-- ================================================
-- Enigmas de Hogwarts (seed)
-- Adiciona 8 enigmas do universo HP como challenges
-- ================================================

INSERT INTO public.challenges (title, description, xp_reward, type, question, correct_answer, active, created_by)
SELECT
  title, description, xp_reward, 'enigma', question, correct_answer, true,
  (SELECT id FROM auth.users LIMIT 1)
FROM (VALUES
  (
    '🦅 O Guardião da Torre de Ravenclaw',
    'Responda ao enigma da estátua da Águia para entrar na Torre de Ravenclaw e ganhar XP.',
    150,
    'Estou sempre na frente de você, mas nunca posso ser visto. O que sou eu?',
    'futuro'
  ),
  (
    '🐍 Segredo da Câmara',
    'Prove seu conhecimento sobre os segredos mais sombrios de Hogwarts.',
    200,
    'Qual é o nome da cobra-fantasma que habita a Câmara Secreta?',
    'basilisco'
  ),
  (
    '⚡ A Cicatriz de Raio',
    'Todo bruxo conhece a história. Você conhece os detalhes?',
    100,
    'Qual feitiço Voldemort usou em Harry quando ele era bebê?',
    'avada kedavra'
  ),
  (
    '🔮 A Penseira de Dumbledore',
    'Mergulhe nas memórias de Dumbledore para responder esta charada.',
    175,
    'Qual é o nome completo de Dumbledore?',
    'albus percival wulfric brian dumbledore'
  ),
  (
    '📖 Enciclopédia de Feitiços',
    'Prove que você estudou no mínimo na biblioteca de Hogwarts.',
    150,
    'Qual feitiço é usado para Expecto Patronum? (em português)',
    'expecto patronum'
  ),
  (
    '🗺️ O Mapa do Maroto',
    'I solemnly swear that I am up to no good. Quem criou o Mapa do Maroto?',
    200,
    'Quais são os quatro apelidos dos criadores do Mapa do Maroto? (em ordem)',
    'travessura, folhas, pateta, pernas curtas'
  ),
  (
    '🌙 O Enigma do Breu',
    'Uma charada digna da Esfinge do Labirinto do Torneio Tribruxo.',
    250,
    'Tenho cidades, mas não tenho casas. Tenho florestas, mas não tenho árvores. Tenho água, mas não tenho peixe. O que sou eu?',
    'mapa'
  ),
  (
    '🏆 Desafio do Torneio Tribruxo',
    'Apenas o mais preparado dos bruxos consegue responder esta.',
    300,
    'Quais são os três desafios do Torneio Tribruxo no livro O Cálice de Fogo?',
    'dragão, krum, labirinto'
  )
) AS t(title, description, xp_reward, question, correct_answer)
WHERE NOT EXISTS (
  SELECT 1 FROM public.challenges WHERE type = 'enigma' LIMIT 1
);
