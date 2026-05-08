
-- 1. Catálogo de feitiços
CREATE TABLE public.spells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  incantation TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'charm', -- charm, curse, jinx, hex, transfiguration, defense, healing
  difficulty INTEGER NOT NULL DEFAULT 1, -- 1 a 5
  min_year INTEGER NOT NULL DEFAULT 1,
  description TEXT NOT NULL DEFAULT '',
  effect TEXT NOT NULL DEFAULT '',
  icon TEXT DEFAULT '✨',
  base_damage INTEGER DEFAULT 10,
  base_defense INTEGER DEFAULT 0,
  is_unforgivable BOOLEAN DEFAULT false,
  taught_by TEXT, -- nome do canon que ensina (Flitwick, Snape...)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.spells ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view spells" ON public.spells FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage spells" ON public.spells FOR ALL TO authenticated 
  USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- 2. Feitiços que cada personagem conhece
CREATE TABLE public.character_spells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL,
  spell_id UUID NOT NULL,
  mastery INTEGER NOT NULL DEFAULT 1, -- 1-100
  times_cast INTEGER NOT NULL DEFAULT 0,
  learned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  learned_from TEXT, -- nome do canon-professor
  UNIQUE(character_id, spell_id)
);
ALTER TABLE public.character_spells ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view character_spells" ON public.character_spells FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner manages character_spells" ON public.character_spells FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM characters WHERE id = character_spells.character_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM characters WHERE id = character_spells.character_id AND user_id = auth.uid()));

-- 3. Canons como professores
CREATE TABLE public.canon_professors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canon_name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL, -- 'charms', 'potions', 'transfiguration', 'defense', 'herbology', 'history', 'astronomy', 'divination', 'care_of_magical_creatures'
  title TEXT NOT NULL DEFAULT 'Professor(a)',
  bio TEXT DEFAULT '',
  avatar_url TEXT,
  catchphrase TEXT,
  difficulty INTEGER DEFAULT 3,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.canon_professors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views canon_professors" ON public.canon_professors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage canon_professors" ON public.canon_professors FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- 4. Aulas
CREATE TABLE public.professor_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL REFERENCES public.canon_professors(id) ON DELETE CASCADE,
  spell_id UUID REFERENCES public.spells(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_minutes INTEGER DEFAULT 30,
  xp_reward INTEGER DEFAULT 50,
  galeons_reward INTEGER DEFAULT 5,
  max_students INTEGER DEFAULT 30,
  status TEXT DEFAULT 'open', -- open, ongoing, finished
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.professor_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views lessons" ON public.professor_lessons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage lessons" ON public.professor_lessons FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- 5. Presença em aulas
CREATE TABLE public.lesson_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.professor_lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  character_id UUID NOT NULL,
  attended_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  spell_learned BOOLEAN DEFAULT false,
  UNIQUE(lesson_id, character_id)
);
ALTER TABLE public.lesson_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views attendance" ON public.lesson_attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner registers attendance" ON public.lesson_attendance FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 6. Duelos
CREATE TABLE public.duels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_user_id UUID NOT NULL,
  challenger_character_id UUID NOT NULL,
  opponent_type TEXT NOT NULL DEFAULT 'canon', -- 'canon' ou 'character'
  opponent_canon_name TEXT, -- se opponent_type=canon
  opponent_user_id UUID, -- se opponent_type=character
  opponent_character_id UUID, -- se opponent_type=character
  challenger_hp INTEGER DEFAULT 100,
  opponent_hp INTEGER DEFAULT 100,
  current_turn TEXT DEFAULT 'challenger', -- challenger | opponent
  status TEXT DEFAULT 'ongoing', -- pending, ongoing, finished
  winner TEXT, -- challenger | opponent | draw
  xp_reward INTEGER DEFAULT 0,
  galeons_reward INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);
ALTER TABLE public.duels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views duels" ON public.duels FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users create duels" ON public.duels FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = challenger_user_id);
CREATE POLICY "Participants update duels" ON public.duels FOR UPDATE TO authenticated
  USING (auth.uid() = challenger_user_id OR auth.uid() = opponent_user_id);

-- 7. Turnos de duelo
CREATE TABLE public.duel_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duel_id UUID NOT NULL REFERENCES public.duels(id) ON DELETE CASCADE,
  turn_number INTEGER NOT NULL,
  actor TEXT NOT NULL, -- challenger | opponent
  spell_id UUID REFERENCES public.spells(id) ON DELETE SET NULL,
  spell_name TEXT NOT NULL,
  damage INTEGER DEFAULT 0,
  hit BOOLEAN DEFAULT true,
  narrative TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.duel_turns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views duel_turns" ON public.duel_turns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert duel_turns" ON public.duel_turns FOR INSERT TO authenticated WITH CHECK (true);

-- 8. Infrações do Filch (registro leve)
CREATE TABLE public.character_infractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  reason TEXT NOT NULL,
  detail TEXT,
  points_lost INTEGER NOT NULL DEFAULT 5,
  context TEXT, -- 'chat', 'post', 'comment'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.character_infractions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner views own infractions" ON public.character_infractions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "System inserts infractions" ON public.character_infractions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins manage infractions" ON public.character_infractions FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- 9. Preferências de áudio
CREATE TABLE public.user_audio_prefs (
  user_id UUID PRIMARY KEY,
  ambient_enabled BOOLEAN NOT NULL DEFAULT false,
  volume NUMERIC NOT NULL DEFAULT 0.3,
  track TEXT DEFAULT 'great_hall',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_audio_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages audio prefs" ON public.user_audio_prefs FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Index úteis
CREATE INDEX idx_character_spells_character ON public.character_spells(character_id);
CREATE INDEX idx_lesson_attendance_user ON public.lesson_attendance(user_id);
CREATE INDEX idx_duels_status ON public.duels(status);
CREATE INDEX idx_infractions_user ON public.character_infractions(user_id);

-- Catálogo inicial de feitiços
INSERT INTO public.spells (name, incantation, category, difficulty, min_year, description, effect, icon, base_damage, base_defense, taught_by) VALUES
('Lumos', 'Lumos', 'charm', 1, 1, 'Acende a ponta da varinha.', 'Ilumina o ambiente', '💡', 0, 0, 'Flitwick'),
('Nox', 'Nox', 'charm', 1, 1, 'Apaga a luz da varinha.', 'Apaga Lumos', '🌑', 0, 0, 'Flitwick'),
('Wingardium Leviosa', 'Wingardium Leviosa', 'charm', 2, 1, 'Faz objetos levitarem.', 'Levitação', '🪶', 5, 0, 'Flitwick'),
('Alohomora', 'Alohomora', 'charm', 2, 1, 'Destranca portas.', 'Abre fechaduras', '🔓', 0, 0, 'Flitwick'),
('Reparo', 'Reparo', 'charm', 1, 1, 'Conserta objetos quebrados.', 'Reparo', '🔧', 0, 0, 'Flitwick'),
('Expelliarmus', 'Expelliarmus', 'charm', 3, 2, 'Desarma o oponente.', 'Desarme', '⚔️', 25, 0, 'Flitwick'),
('Petrificus Totalus', 'Petrificus Totalus', 'curse', 3, 2, 'Petrifica o alvo.', 'Paralisia total', '🗿', 30, 0, 'McGonagall'),
('Stupefy', 'Stupefy', 'charm', 4, 3, 'Atordoa o oponente.', 'Atordoamento', '⚡', 35, 0, 'Lupin'),
('Protego', 'Protego', 'charm', 4, 3, 'Escudo protetor.', 'Bloqueia feitiços', '🛡️', 0, 30, 'Lupin'),
('Expecto Patronum', 'Expecto Patronum', 'charm', 5, 4, 'Conjura um Patrono.', 'Repele Dementadores', '🦌', 50, 20, 'Lupin'),
('Riddikulus', 'Riddikulus', 'charm', 3, 3, 'Vence um Bicho-Papão.', 'Transforma medo em riso', '🤡', 20, 10, 'Lupin'),
('Accio', 'Accio', 'charm', 3, 2, 'Convoca objetos.', 'Atrai objetos distantes', '🪄', 0, 0, 'Flitwick'),
('Incendio', 'Incendio', 'charm', 3, 3, 'Cria chamas.', 'Fogo', '🔥', 30, 0, 'Snape'),
('Aguamenti', 'Aguamenti', 'charm', 3, 3, 'Jato de água.', 'Água', '💧', 20, 0, 'Flitwick'),
('Episkey', 'Episkey', 'healing', 3, 3, 'Cura ferimentos leves.', 'Cura', '❤️', -25, 0, 'Pomfrey'),
('Finite Incantatem', 'Finite Incantatem', 'charm', 3, 3, 'Termina feitiços ativos.', 'Cancela magia', '🚫', 0, 15, 'Snape'),
('Levicorpus', 'Levicorpus', 'jinx', 3, 4, 'Pendura o alvo de cabeça pra baixo.', 'Suspende o alvo', '🙃', 25, 0, 'Snape'),
('Sectumsempra', 'Sectumsempra', 'curse', 5, 5, 'Corta o alvo.', 'Cortes profundos', '🩸', 60, 0, 'Snape'),
('Confringo', 'Confringo', 'curse', 4, 4, 'Causa explosão.', 'Explosão', '💥', 45, 0, 'Snape'),
('Bombarda', 'Bombarda', 'curse', 4, 4, 'Detonação.', 'Explosão concentrada', '💣', 40, 0, 'Snape'),
('Reducto', 'Reducto', 'curse', 4, 4, 'Reduz objetos a pó.', 'Destruição', '🪨', 35, 0, 'Lupin'),
('Bombarda Maxima', 'Bombarda Maxima', 'curse', 5, 5, 'Explosão massiva.', 'Grande explosão', '💥', 55, 0, 'Snape'),
('Tarantallegra', 'Tarantallegra', 'jinx', 3, 3, 'Faz pernas dançarem.', 'Confusão', '🕺', 15, 0, 'Snape'),
('Densaugeo', 'Densaugeo', 'jinx', 3, 4, 'Aumenta os dentes.', 'Constrangimento', '😬', 10, 0, 'Snape'),
('Furnunculus', 'Furnunculus', 'jinx', 3, 3, 'Cria furúnculos.', 'Pústulas', '🧪', 18, 0, 'Snape'),
('Avada Kedavra', 'Avada Kedavra', 'curse', 5, 7, 'Maldição da Morte. PROIBIDA.', 'Mata instantaneamente', '💀', 100, 0, NULL),
('Crucio', 'Crucio', 'curse', 5, 7, 'Maldição Cruciatus. PROIBIDA.', 'Dor insuportável', '😖', 80, 0, NULL),
('Imperio', 'Imperio', 'curse', 5, 7, 'Maldição Imperius. PROIBIDA.', 'Controle mental', '🧠', 70, 0, NULL),
('Glacius', 'Glacius', 'charm', 3, 3, 'Congela o alvo.', 'Gelo', '❄️', 30, 5, 'Flitwick'),
('Serpensortia', 'Serpensortia', 'transfiguration', 3, 4, 'Conjura uma serpente.', 'Invoca serpente', '🐍', 25, 0, 'Snape'),
('Avis', 'Avis', 'transfiguration', 3, 4, 'Conjura pássaros.', 'Invoca aves', '🐦', 15, 0, 'McGonagall'),
('Diffindo', 'Diffindo', 'charm', 3, 3, 'Corta tecidos e objetos.', 'Corte preciso', '✂️', 20, 0, 'Flitwick');

UPDATE public.spells SET is_unforgivable = true WHERE name IN ('Avada Kedavra','Crucio','Imperio');

-- Canons-professores iniciais
INSERT INTO public.canon_professors (canon_name, subject, title, bio, catchphrase, difficulty) VALUES
('Filius Flitwick', 'charms', 'Professor de Feitiços', 'Mestre meio-duende, paciente e animado.', 'Swish and flick!', 2),
('Severus Snape', 'potions', 'Mestre de Poções', 'Sombrio, exigente, brilhante.', 'Patético...', 5),
('Minerva McGonagall', 'transfiguration', 'Diretora & Professora de Transfiguração', 'Rigorosa, justa, leal a Dumbledore.', 'Cuidado com o que diz, Senhor(a).', 4),
('Remus Lupin', 'defense', 'Professor de DCAT', 'Calmo, didático, lobisomem.', 'Concentre-se na memória mais feliz.', 3),
('Pomona Sprout', 'herbology', 'Professora de Herbologia', 'Mãos na terra, coração de ouro.', 'Cuidado com a mandrágora!', 2),
('Sybill Trelawney', 'divination', 'Professora de Adivinhação', 'Excêntrica, vidente verdadeira sob a fachada.', 'Vejo... vejo a morte em sua xícara.', 3),
('Rubeus Hagrid', 'care_of_magical_creatures', 'Professor de Trato de Criaturas Mágicas', 'Gigante de coração mole.', 'Não são lindos?', 3),
('Cuthbert Binns', 'history', 'Professor (fantasma) de História da Magia', 'Aula tão entediante que ele morreu e nem percebeu.', 'Em 1612...', 1),
('Aurora Sinistra', 'astronomy', 'Professora de Astronomia', 'Observa os astros à meia-noite.', 'Olhem para o céu.', 2),
('Horace Slughorn', 'potions', 'Professor de Poções (alternativo)', 'Coleciona alunos talentosos.', 'Bem-vindo ao Clube do Slug!', 4),
('Madame Hooch', 'flying', 'Instrutora de Voo', 'Olhos amarelos de falcão.', 'Mão direita sobre a vassoura!', 2),
('Gilderoy Lockhart', 'defense', 'Professor de DCAT (auto-proclamado)', 'Vaidoso, falso, premiado por sorrisos.', 'Cinco vezes vencedor...', 1);
