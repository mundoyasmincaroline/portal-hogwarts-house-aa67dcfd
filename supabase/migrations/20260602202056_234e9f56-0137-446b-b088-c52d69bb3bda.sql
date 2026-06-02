
-- =====================================================
-- FASE 11: Narrativa & Lore (Capítulos, NPCs, Diário, Profecias, Mapa)
-- =====================================================

-- 11.A — STORY CHAPTERS (Capítulos interativos)
CREATE TABLE public.story_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  arc TEXT NOT NULL DEFAULT 'main',
  chapter_order INT NOT NULL DEFAULT 0,
  summary TEXT,
  content TEXT NOT NULL,
  requires_level INT NOT NULL DEFAULT 1,
  rewards_xp INT NOT NULL DEFAULT 50,
  rewards_galeons INT NOT NULL DEFAULT 25,
  cover_emoji TEXT DEFAULT '📖',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.story_chapters TO anon, authenticated;
GRANT ALL ON public.story_chapters TO service_role;
ALTER TABLE public.story_chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chapters_public_read" ON public.story_chapters FOR SELECT USING (true);
CREATE POLICY "chapters_admin_all" ON public.story_chapters FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.story_choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.story_chapters(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  outcome_text TEXT,
  next_chapter_slug TEXT,
  xp_bonus INT NOT NULL DEFAULT 0,
  attribute_effect JSONB DEFAULT '{}'::jsonb,
  display_order INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.story_choices TO anon, authenticated;
GRANT ALL ON public.story_choices TO service_role;
ALTER TABLE public.story_choices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "choices_public_read" ON public.story_choices FOR SELECT USING (true);
CREATE POLICY "choices_admin_all" ON public.story_choices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.story_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  chapter_id UUID NOT NULL REFERENCES public.story_chapters(id) ON DELETE CASCADE,
  choice_id UUID REFERENCES public.story_choices(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, chapter_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.story_progress TO authenticated;
GRANT ALL ON public.story_progress TO service_role;
ALTER TABLE public.story_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "progress_own" ON public.story_progress FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 11.A — NPCS (Personagens conversacionais)
CREATE TABLE public.npcs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  house TEXT,
  personality TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  avatar_emoji TEXT DEFAULT '🧙',
  location TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.npcs TO anon, authenticated;
GRANT ALL ON public.npcs TO service_role;
ALTER TABLE public.npcs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "npcs_public_read" ON public.npcs FOR SELECT USING (is_active = true);
CREATE POLICY "npcs_admin_all" ON public.npcs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.npc_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  npc_id UUID NOT NULL REFERENCES public.npcs(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, npc_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.npc_conversations TO authenticated;
GRANT ALL ON public.npc_conversations TO service_role;
ALTER TABLE public.npc_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "npc_conv_own" ON public.npc_conversations FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 11.B — DIÁRIO PESSOAL
CREATE TABLE public.diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  character_id UUID,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  mood TEXT DEFAULT 'neutral',
  is_private BOOLEAN NOT NULL DEFAULT true,
  ai_reflection TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diary_entries TO authenticated;
GRANT ALL ON public.diary_entries TO service_role;
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "diary_own" ON public.diary_entries FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 11.B — PROFECIAS
CREATE TABLE public.prophecies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  prompt TEXT,
  prophecy_text TEXT NOT NULL,
  symbol TEXT DEFAULT '🔮',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.prophecies TO authenticated;
GRANT ALL ON public.prophecies TO service_role;
ALTER TABLE public.prophecies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prophecies_own" ON public.prophecies FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 11.C — MAPA DO CASTELO
CREATE TABLE public.castle_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  room_type TEXT NOT NULL DEFAULT 'hall',
  pos_x NUMERIC NOT NULL DEFAULT 50,
  pos_y NUMERIC NOT NULL DEFAULT 50,
  emoji TEXT DEFAULT '🏰',
  unlock_level INT NOT NULL DEFAULT 1,
  event_chance NUMERIC NOT NULL DEFAULT 0.3,
  event_payload JSONB DEFAULT '{}'::jsonb
);
GRANT SELECT ON public.castle_rooms TO anon, authenticated;
GRANT ALL ON public.castle_rooms TO service_role;
ALTER TABLE public.castle_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rooms_public_read" ON public.castle_rooms FOR SELECT USING (true);
CREATE POLICY "rooms_admin_all" ON public.castle_rooms FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.room_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  room_id UUID NOT NULL REFERENCES public.castle_rooms(id) ON DELETE CASCADE,
  visit_count INT NOT NULL DEFAULT 1,
  last_visited TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, room_id)
);
GRANT SELECT, INSERT, UPDATE ON public.room_visits TO authenticated;
GRANT ALL ON public.room_visits TO service_role;
ALTER TABLE public.room_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "visits_own" ON public.room_visits FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- =====================================================
-- SEED CONTENT
-- =====================================================

-- Seed NPCs principais
INSERT INTO public.npcs (slug, name, role, house, personality, system_prompt, avatar_emoji, location) VALUES
('dumbledore', 'Alvo Dumbledore', 'Diretor de Hogwarts', 'gryffindor',
 'Sábio, enigmático, gentil. Fala com metáforas e cita doces trouxas.',
 'Você é Alvo Dumbledore, diretor de Hogwarts. Responda em português (PT-BR) com sabedoria gentil, metáforas mágicas, e ocasionalmente mencione balas de limão. Mantenha respostas com 2-4 parágrafos curtos. Nunca quebre o personagem.',
 '🧙‍♂️', 'Sala do Diretor'),
('mcgonagall', 'Minerva McGonagall', 'Vice-Diretora & Professora de Transfiguração', 'gryffindor',
 'Rigorosa, justa, protetora. Tom firme mas carinhoso.',
 'Você é Minerva McGonagall. Responda em português (PT-BR) de forma firme, direta e justa. Use vocabulário acadêmico e referencie regras de Hogwarts. 2-3 parágrafos. Nunca quebre o personagem.',
 '🐈‍⬛', 'Torre da Grifinória'),
('snape', 'Severo Snape', 'Mestre de Poções', 'slytherin',
 'Sarcástico, frio na superfície, intenso. Fala devagar e com peso.',
 'Você é Severo Snape. Responda em português (PT-BR) com sarcasmo refinado, frases curtas e cortantes, e uma pitada de desdém aristocrático. 2-3 parágrafos. Nunca quebre o personagem.',
 '🦇', 'Masmorras'),
('hagrid', 'Rúbeo Hagrid', 'Guarda-Caça', 'gryffindor',
 'Caloroso, emotivo, fala de forma informal e gigante. Ama criaturas mágicas.',
 'Você é Rúbeo Hagrid. Responda em português (PT-BR) de forma calorosa, informal, com erros de português ocasionais e muito amor por criaturas mágicas. 2-3 parágrafos. Nunca quebre o personagem.',
 '🦣', 'Cabana de Hagrid'),
('luna', 'Luna Lovegood', 'Estudante - Corvinal', 'ravenclaw',
 'Sonhadora, fala coisas estranhas como se fossem normais. Acredita em tudo.',
 'Você é Luna Lovegood. Responda em português (PT-BR) de forma serena e excêntrica, mencionando criaturas raras (zonzóbulos, narguilés) com naturalidade. 2-3 parágrafos. Nunca quebre o personagem.',
 '🌙', 'Sala Comunal da Corvinal'),
('chapeu', 'Chapéu Seletor', 'Artefato Senciente', NULL,
 'Antigo, observador, vê dentro da mente. Fala em rimas ocasionais.',
 'Você é o Chapéu Seletor. Responda em português (PT-BR) com sabedoria milenar, ocasionalmente em versos, analisando traços da personalidade do usuário. 2 parágrafos. Nunca quebre o personagem.',
 '🎩', 'Salão Principal');

-- Seed Capítulos iniciais
INSERT INTO public.story_chapters (slug, title, arc, chapter_order, summary, content, requires_level, rewards_xp, rewards_galeons, cover_emoji) VALUES
('despertar', 'O Despertar Mágico', 'main', 1,
 'A primeira chama da magia se acende em você.',
 E'Você acorda numa manhã comum. Mas há algo diferente — a luz da janela parece dançar, sussurrando seu nome.\n\nNa cabeceira, uma coruja bate o bico no vidro. Carrega um envelope dourado, selado com cera vermelha brilhante. Seu coração acelera.\n\nVocê abre o envelope. O pergaminho exala fumaça lilás, e palavras se desenham sozinhas: "Hogwarts te espera."',
 1, 100, 50, '✨'),
('escolha', 'O Cruzamento dos Caminhos', 'main', 2,
 'Toda jornada começa com uma escolha.',
 E'À frente da estação King''s Cross, você encontra o muro entre as plataformas 9 e 10. Mas há três caminhos visíveis apenas para olhos mágicos.\n\nUm brilho dourado à esquerda. Uma sombra prateada à direita. E no centro, um portal de fumaça verde-esmeralda.\n\nQual caminho chama mais alto?',
 2, 150, 75, '🚂'),
('biblioteca', 'Segredos da Biblioteca Proibida', 'main', 3,
 'Conhecimento tem um preço.',
 E'A Biblioteca de Hogwarts à meia-noite é outro mundo. As estantes sussurram, os livros se viram sozinhos.\n\nVocê encontra a Seção Restrita, isolada por correntes. Um livro pulsa em vermelho, chamando seu nome. Madame Pince ronca à distância.\n\nO risco é grande. A recompensa pode ser maior.',
 5, 200, 100, '📚'),
('floresta', 'A Floresta Proibida', 'main', 4,
 'Nem todo herói volta inteiro.',
 E'A Floresta Proibida começa logo após a cabana de Hagrid. Você vê pegadas estranhas na lama — não humanas, não totalmente animais.\n\nUma centelha azul flutua entre as árvores. Pode ser uma fada. Pode ser algo muito pior. À distância, ouve cascos de centauro.',
 8, 300, 150, '🌲');

-- Seed Choices
WITH c1 AS (SELECT id FROM public.story_chapters WHERE slug='despertar'),
     c2 AS (SELECT id FROM public.story_chapters WHERE slug='escolha'),
     c3 AS (SELECT id FROM public.story_chapters WHERE slug='biblioteca'),
     c4 AS (SELECT id FROM public.story_chapters WHERE slug='floresta')
INSERT INTO public.story_choices (chapter_id, label, outcome_text, next_chapter_slug, xp_bonus, display_order) VALUES
((SELECT id FROM c1), 'Abrir a janela e responder à coruja', 'A coruja entra majestosamente e pousa em seu ombro.', 'escolha', 30, 1),
((SELECT id FROM c1), 'Esconder a carta debaixo do travesseiro', 'A carta arde sozinha — não pode ser ignorada.', 'escolha', 10, 2),
((SELECT id FROM c2), 'Caminho dourado (Grifinória)', 'Coragem te guia. O ouro brilha para os bravos.', 'biblioteca', 40, 1),
((SELECT id FROM c2), 'Caminho prateado (Corvinal/Lufa)', 'Sabedoria e lealdade te abraçam.', 'biblioteca', 40, 2),
((SELECT id FROM c2), 'Portal esmeralda (Sonserina)', 'Ambição corre em suas veias.', 'biblioteca', 40, 3),
((SELECT id FROM c3), 'Pegar o livro e sair correndo', 'Você sente o peso do conhecimento proibido.', 'floresta', 80, 1),
((SELECT id FROM c3), 'Anotar o título e voltar depois', 'A prudência também é uma forma de coragem.', 'floresta', 50, 2),
((SELECT id FROM c4), 'Seguir a centelha azul', 'A fada te leva a um claro luminoso. Ouro mágico aparece.', NULL, 100, 1),
((SELECT id FROM c4), 'Voltar para o castelo', 'Você sobrevive. Mas algo te observou.', NULL, 30, 2);

-- Seed Castle Rooms
INSERT INTO public.castle_rooms (slug, name, description, room_type, pos_x, pos_y, emoji, unlock_level, event_chance) VALUES
('salao-principal', 'Salão Principal', 'O coração de Hogwarts. Velas flutuam, tetos espelham o céu.', 'hall', 50, 60, '🕯️', 1, 0.2),
('torre-astronomia', 'Torre de Astronomia', 'O ponto mais alto do castelo. Estrelas dançam para você.', 'tower', 85, 15, '🔭', 3, 0.4),
('biblioteca', 'Biblioteca', 'Madame Pince vigia. Os livros sussurram.', 'library', 70, 40, '📚', 2, 0.3),
('masmorras', 'Masmorras', 'Frio, úmido. Cheiro de poções e secretos.', 'dungeon', 25, 80, '⚗️', 4, 0.5),
('jardim', 'Jardins de Hogwarts', 'O sol filtra pelos arcos. Vasos d''água conversam.', 'garden', 15, 50, '🌿', 1, 0.25),
('cabana-hagrid', 'Cabana de Hagrid', 'Aroma de chá e biscoitos duros como pedra.', 'cabin', 10, 75, '🪵', 2, 0.3),
('sala-precisa', 'Sala Precisa', 'Aparece para quem precisa. Some para quem não.', 'secret', 90, 50, '🚪', 5, 0.6),
('campo-quadribol', 'Campo de Quadribol', 'Goles voam mesmo sem jogadores. Vento puxa para o céu.', 'sport', 80, 80, '🧹', 3, 0.35),
('floresta-proibida', 'Floresta Proibida', 'Não entre sozinho. Algo sempre observa.', 'forest', 5, 30, '🌲', 6, 0.55),
('camara-secreta', 'Câmara Secreta', 'Só os escolhidos encontram a entrada.', 'secret', 50, 90, '🐍', 10, 0.7);

-- Trigger updated_at
CREATE TRIGGER trg_diary_updated BEFORE UPDATE ON public.diary_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_npc_conv_updated BEFORE UPDATE ON public.npc_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
