-- =========================================
-- FASE 3: SISTEMA DE AULAS EM RODÍZIO
-- =========================================

CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  professor TEXT NOT NULL,
  day_of_week TEXT NOT NULL, -- 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA'
  time_slot TEXT NOT NULL,   -- ex: '13:00 - 14:00'
  target_years TEXT NOT NULL, -- '1-3', '4-7', '1', '6-7', 'ALL'
  week_rotation INTEGER NOT NULL, -- 1, 2, or 3
  xp_reward INTEGER DEFAULT 50,
  is_optional BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.class_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  attended_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, class_id, attended_at) -- Prevent duplicate attendance on the same day if we just check dates
);

-- RLS
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Classes view" ON public.classes;
CREATE POLICY "Classes view" ON public.classes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Attendance view" ON public.class_attendance;
CREATE POLICY "Attendance view" ON public.class_attendance FOR SELECT USING (true);

DROP POLICY IF EXISTS "Attendance insert" ON public.class_attendance;
CREATE POLICY "Attendance insert" ON public.class_attendance FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Insert WEEK 1
INSERT INTO public.classes (title, professor, day_of_week, time_slot, target_years, week_rotation, is_optional, xp_reward) VALUES
('Transfiguração', 'Professora McGonagall', 'SEGUNDA', '13:00 - 14:00', '1-3', 1, false, 50),
('Poções', 'Professor Snape', 'SEGUNDA', '14:15 - 15:15', '4-7', 1, false, 50),
('Poções', 'Professor Snape', 'TERCA', '13:00 - 14:00', '1-3', 1, false, 50),
('Transfiguração', 'Professora McGonagall', 'TERCA', '14:15 - 15:15', '4-7', 1, false, 50),
('Feitiços', 'Professor Flitwick', 'QUARTA', '13:00 - 14:00', '1-3', 1, false, 50),
('Herbologia', 'Professora Sprout', 'QUARTA', '14:15 - 15:15', '4-7', 1, false, 50),
('Treino de Quadribol', 'Professora Madame Hooch', 'QUARTA', '15:30 - 16:30', 'ALL', 1, true, 30),
('Defesa Contra As Artes das Trevas', 'Professor Lupin', 'QUINTA', '13:00 - 14:00', '1-3', 1, false, 50),
('Feitiços', 'Professor Flitwick', 'QUINTA', '14:15 - 15:15', '4-7', 1, false, 50),
('Runas Antigas', 'Professora Babbling', 'QUINTA', '15:30 - 16:30', 'ALL', 1, false, 50),
('Herbologia', 'Professora Sprout', 'SEXTA', '13:00 - 14:00', '1-3', 1, false, 50),
('Defesa Contra As Artes das Trevas', 'Professor Lupin', 'SEXTA', '14:15 - 15:15', '4-7', 1, false, 50),
('História da Magia', 'Professor Binns', 'SEXTA', '15:30 - 16:30', 'ALL', 1, false, 50),
('Jogo de Quadribol', 'Madame Hooch', 'SEXTA', '16:30 - 17:30', 'ALL', 1, false, 100);

-- Insert WEEK 2
INSERT INTO public.classes (title, professor, day_of_week, time_slot, target_years, week_rotation, is_optional, xp_reward) VALUES
('Transfiguração', 'Professora McGonagall', 'SEGUNDA', '13:00 - 14:00', '1-3', 2, false, 50),
('Poções', 'Professor Snape', 'SEGUNDA', '14:15 - 15:15', '4-7', 2, false, 50),
('Adivinhação', 'Professora Trelawney', 'SEGUNDA', '15:30 - 16:30', 'ALL', 2, true, 30),
('Poções', 'Professor Snape', 'TERCA', '13:00 - 14:00', '1-3', 2, false, 50),
('Transfiguração', 'Professora McGonagall', 'TERCA', '14:15 - 15:15', '4-7', 2, false, 50),
('Voo', 'Professora Madame Hooch', 'TERCA', '15:30 - 16:30', '1', 2, false, 50),
('Feitiços', 'Professor Flitwick', 'QUARTA', '13:00 - 14:00', '1-3', 2, false, 50),
('Herbologia', 'Professora Sprout', 'QUARTA', '14:15 - 15:15', '4-7', 2, false, 50),
('Trato das Criaturas Mágicas', 'Professor Hagrid', 'QUARTA', '15:30 - 16:30', 'ALL', 2, true, 30),
('Treino de Quadribol', 'Professora Madame Hooch', 'QUARTA', '16:30 - 17:30', 'ALL', 2, true, 30),
('Defesa Contra As Artes das Trevas', 'Professor Lupin', 'QUINTA', '13:00 - 14:00', '1-3', 2, false, 50),
('Feitiços', 'Professor Flitwick', 'QUINTA', '14:15 - 15:15', '4-7', 2, false, 50),
('Clube de Duelos', 'Instrutor de Duelos', 'QUINTA', '15:30 - 16:30', 'ALL', 2, true, 40),
('Herbologia', 'Professora Sprout', 'SEXTA', '13:00 - 14:00', '1-3', 2, false, 50),
('Defesa Contra As Artes das Trevas', 'Professor Lupin', 'SEXTA', '14:15 - 15:15', '4-7', 2, false, 50),
('Jogo de Quadribol', 'Professora Madame Hooch', 'SEXTA', '15:30 - 16:30', 'ALL', 2, false, 100);

-- Insert WEEK 3
INSERT INTO public.classes (title, professor, day_of_week, time_slot, target_years, week_rotation, is_optional, xp_reward) VALUES
('Transfiguração', 'Professora McGonagall', 'SEGUNDA', '13:00 - 14:00', '1-3', 3, false, 50),
('Poções', 'Professor Snape', 'SEGUNDA', '14:15 - 15:15', '4-7', 3, false, 50),
('Poções', 'Professor Snape', 'TERCA', '13:00 - 14:00', '1-3', 3, false, 50),
('Transfiguração', 'Professora McGonagall', 'TERCA', '14:15 - 15:15', '4-7', 3, false, 50),
('Voo', 'Professora Madame Hooch', 'TERCA', '15:30 - 16:30', '1', 3, false, 50),
('Feitiços', 'Professor Flitwick', 'QUARTA', '13:00 - 14:00', '1-3', 3, false, 50),
('Herbologia', 'Professora Sprout', 'QUARTA', '14:15 - 15:15', '4-7', 3, false, 50),
('Treino de Quadribol', 'Professora Madame Hooch', 'QUARTA', '16:30 - 17:30', 'ALL', 3, true, 30),
('Defesa Contra As Artes das Trevas', 'Professor Lupin', 'QUINTA', '13:00 - 14:00', '1-3', 3, false, 50),
('Feitiços', 'Professor Flitwick', 'QUINTA', '14:15 - 15:15', '4-7', 3, false, 50),
('Astronomia', 'Professora Sinistra', 'QUINTA', '15:30 - 16:30', 'ALL', 3, false, 50),
('Herbologia', 'Professora Sprout', 'SEXTA', '13:00 - 14:00', '1-3', 3, false, 50),
('Defesa Contra As Artes das Trevas', 'Professor Lupin', 'SEXTA', '14:15 - 15:15', '4-7', 3, false, 50),
('Alquimia', 'Professor Eliphas', 'SEXTA', '15:30 - 16:30', '6-7', 3, true, 40),
('Jogo de Quadribol', 'Professora Madame Hooch', 'SEXTA', '16:30 - 17:30', 'ALL', 3, false, 100);
