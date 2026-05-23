-- ================================================
-- PORTAL HOGWARTS HOUSE - SCRIPT COMPLETO
-- Cole no Supabase SQL Editor e clique RUN
-- ================================================


-- ================================================
-- 1. DM - Mensagens Diretas em tempo real
-- ================================================

CREATE TABLE IF NOT EXISTS public.dm_messages (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content     text        NOT NULL CHECK (char_length(content) > 0),
  read        boolean     DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dm_sender_idx   ON public.dm_messages (sender_id);
CREATE INDEX IF NOT EXISTS dm_receiver_idx ON public.dm_messages (receiver_id);
CREATE INDEX IF NOT EXISTS dm_pair_idx     ON public.dm_messages (sender_id, receiver_id);

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

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.dm_messages;
EXCEPTION WHEN others THEN NULL; END $$;


-- ================================================
-- 2. InstaHogwarts - character_id nos posts
-- ================================================

ALTER TABLE public.insta_posts
  ADD COLUMN IF NOT EXISTS character_id uuid REFERENCES public.characters(id) ON DELETE SET NULL;


-- ================================================
-- 3. InstaHogwarts - Sistema de Seguidores
-- ================================================

CREATE TABLE IF NOT EXISTS public.insta_follows (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followed_user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at        timestamptz DEFAULT now(),
  UNIQUE(follower_user_id, followed_user_id)
);

ALTER TABLE public.insta_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Follows: ver todos" ON public.insta_follows;
CREATE POLICY "Follows: ver todos" ON public.insta_follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "Follows: seguir" ON public.insta_follows;
CREATE POLICY "Follows: seguir" ON public.insta_follows FOR INSERT WITH CHECK (auth.uid() = follower_user_id);

DROP POLICY IF EXISTS "Follows: deixar de seguir" ON public.insta_follows;
CREATE POLICY "Follows: deixar de seguir" ON public.insta_follows FOR DELETE USING (auth.uid() = follower_user_id);

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.insta_follows;
EXCEPTION WHEN others THEN NULL; END $$;


-- ================================================
-- 4. Stories - Quem Visualizou
-- ================================================

CREATE TABLE IF NOT EXISTS public.story_views (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id   uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at  timestamptz DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "StoryViews: dono ve seus" ON public.story_views;
CREATE POLICY "StoryViews: dono ve seus" ON public.story_views FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_id AND s.user_id = auth.uid())
    OR viewer_id = auth.uid()
  );

DROP POLICY IF EXISTS "StoryViews: registrar view" ON public.story_views;
CREATE POLICY "StoryViews: registrar view" ON public.story_views FOR INSERT
  WITH CHECK (auth.uid() = viewer_id);

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.story_views;
EXCEPTION WHEN others THEN NULL; END $$;


-- ================================================
-- 5. Enigmas de Hogwarts - 8 charadas HP
-- ================================================

INSERT INTO public.challenges (title, description, xp_reward, type, question, correct_answer, active, created_by)
SELECT
  title, description, xp_reward, 'enigma', question, correct_answer, true,
  (SELECT id FROM auth.users LIMIT 1)
FROM (VALUES
  (
    'O Guardiao da Torre de Ravenclaw',
    'Responda ao enigma da estatua da Aguia para entrar na Torre de Ravenclaw e ganhar XP.',
    150,
    'Estou sempre na frente de voce, mas nunca posso ser visto. O que sou eu?',
    'futuro'
  ),
  (
    'Segredo da Camara',
    'Prove seu conhecimento sobre os segredos mais sombrios de Hogwarts.',
    200,
    'Qual e o nome da criatura que habita a Camara Secreta?',
    'basilisco'
  ),
  (
    'A Cicatriz de Raio',
    'Todo bruxo conhece a historia. Voce conhece os detalhes?',
    100,
    'Qual feitico Voldemort usou em Harry quando ele era bebe?',
    'avada kedavra'
  ),
  (
    'A Penseira de Dumbledore',
    'Mergulhe nas memorias de Dumbledore para responder esta charada.',
    175,
    'Qual e o nome completo de Dumbledore?',
    'albus percival wulfric brian dumbledore'
  ),
  (
    'Enciclopedia de Feiticos',
    'Prove que voce estudou na biblioteca de Hogwarts.',
    150,
    'Qual feitico e usado para convocar objetos a distancia?',
    'accio'
  ),
  (
    'O Mapa do Maroto',
    'Solenemente juro que minhas intencoes nao sao boas. Quem criou o Mapa do Maroto?',
    200,
    'Quais sao os quatro apelidos dos criadores do Mapa do Maroto separados por virgula?',
    'travessura, folhas, pateta, pernas curtas'
  ),
  (
    'O Enigma do Breu',
    'Uma charada digna da Esfinge do Labirinto do Torneio Tribruxo.',
    250,
    'Tenho cidades mas nao tenho casas, tenho florestas mas nao tenho arvores, tenho agua mas nao tenho peixe. O que sou eu?',
    'mapa'
  ),
  (
    'Desafio do Torneio Tribruxo',
    'Apenas o mais preparado dos bruxos consegue responder esta.',
    300,
    'Quais sao os tres desafios do Torneio Tribruxo no Calice de Fogo separados por virgula?',
    'dragao, krum, labirinto'
  )
) AS t(title, description, xp_reward, question, correct_answer)
WHERE NOT EXISTS (
  SELECT 1 FROM public.challenges WHERE type = 'enigma' LIMIT 1
);
