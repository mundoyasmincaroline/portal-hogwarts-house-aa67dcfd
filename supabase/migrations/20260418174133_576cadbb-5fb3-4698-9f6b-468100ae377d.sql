
-- ===== STORIES: campos faltantes =====
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS content TEXT DEFAULT '';
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE public.stories ALTER COLUMN image_url DROP NOT NULL;
ALTER TABLE public.stories ALTER COLUMN image_url SET DEFAULT '';

-- ===== USER_COOLDOWNS: campos faltantes =====
ALTER TABLE public.user_cooldowns ADD COLUMN IF NOT EXISTS minute_started_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.user_cooldowns ADD COLUMN IF NOT EXISTS xp_gained_this_minute INTEGER DEFAULT 0;
ALTER TABLE public.user_cooldowns ADD COLUMN IF NOT EXISTS last_enigma_at TIMESTAMPTZ;

-- ===== USER_CHALLENGES: campos faltantes =====
ALTER TABLE public.user_challenges ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.user_challenges ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;
ALTER TABLE public.user_challenges ADD COLUMN IF NOT EXISTS proof TEXT;

-- ===== CHALLENGES: campo question/correct_answer =====
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS question TEXT;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS correct_answer TEXT;

-- ===== CHANNELS: campos extras =====
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS allowed_houses TEXT[];
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS is_admin_only BOOLEAN DEFAULT false;
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS meet_link TEXT;

-- ===== PROFILES: campos extras =====
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_seen_intro BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';

-- ===== CHARACTERS_BIRTHDAYS: age (opcional, calculado em runtime) =====
ALTER TABLE public.characters_birthdays ADD COLUMN IF NOT EXISTS age INTEGER;

-- ===== FICHAS =====
CREATE TABLE IF NOT EXISTS public.fichas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  character_name TEXT NOT NULL,
  age INTEGER,
  school_year INTEGER DEFAULT 1,
  primary_house TEXT,
  blood_status TEXT,
  wand TEXT,
  patronus TEXT,
  history TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fichas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own fichas" ON public.fichas FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));
CREATE POLICY "Users create own fichas" ON public.fichas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own fichas" ON public.fichas FOR UPDATE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage fichas" ON public.fichas FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- ===== BANNED_WORDS =====
CREATE TABLE IF NOT EXISTS public.banned_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.banned_words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view banned_words" ON public.banned_words FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage banned_words" ON public.banned_words FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- ===== CLASSES =====
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  professor TEXT DEFAULT '',
  day_of_week TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  target_years TEXT NOT NULL DEFAULT 'ALL',
  week_rotation INTEGER NOT NULL DEFAULT 1,
  xp_reward INTEGER NOT NULL DEFAULT 25,
  is_optional BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view classes" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage classes" ON public.classes FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- ===== CLASS_ATTENDANCE =====
CREATE TABLE IF NOT EXISTS public.class_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  attended_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.class_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own attendance" ON public.class_attendance FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));
CREATE POLICY "Users mark own attendance" ON public.class_attendance FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ===== MESSAGES (alias usado pelo código) =====
-- Como o código usa "messages" (não chat_messages), criamos a tabela messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view messages_v2" ON public.messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users send own messages_v2" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own messages_v2" ON public.messages FOR DELETE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage messages_v2" ON public.messages FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
DROP TRIGGER IF EXISTS filch_check_messages ON public.messages;
CREATE TRIGGER filch_check_messages BEFORE INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.filch_check_content();

-- Marca os admins existentes com role 'admin' no profile (campo textual usado pela UI)
UPDATE public.profiles SET role = 'admin' WHERE user_id IN (
  '32751bd1-e200-495a-984e-56e65b379942',
  'b9873320-6ad2-467f-8de6-badf6638e4c3',
  '2b778f39-c484-48e0-9d3d-3d2ab17eb594'
);
