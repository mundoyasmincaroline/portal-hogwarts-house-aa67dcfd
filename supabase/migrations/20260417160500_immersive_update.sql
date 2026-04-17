-- Add last_seen to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT now();

-- Characters Birthdays
CREATE TABLE IF NOT EXISTS public.characters_birthdays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  house house_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.characters_birthdays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view characters_birthdays" ON public.characters_birthdays FOR SELECT TO authenticated USING (true);

-- Insert initial characters
INSERT INTO public.characters_birthdays (name, birth_date, house) VALUES
('Harry Potter', '1980-07-31', 'gryffindor'),
('Hermione Granger', '1979-09-19', 'gryffindor'),
('Ron Weasley', '1980-03-01', 'gryffindor'),
('Draco Malfoy', '1980-06-05', 'slytherin'),
('Luna Lovegood', '1981-02-13', 'ravenclaw'),
('Neville Longbottom', '1980-07-30', 'gryffindor'),
('Ginny Weasley', '1981-08-11', 'gryffindor'),
('Fred Weasley', '1978-04-01', 'gryffindor'),
('George Weasley', '1978-04-01', 'gryffindor')
ON CONFLICT DO NOTHING;

-- User Cooldowns (Anti-Burla)
CREATE TABLE IF NOT EXISTS public.user_cooldowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  last_enigma_at TIMESTAMPTZ DEFAULT now(),
  xp_gained_this_minute INTEGER DEFAULT 0,
  minute_started_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.user_cooldowns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own cooldowns" ON public.user_cooldowns FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own cooldowns" ON public.user_cooldowns FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cooldowns" ON public.user_cooldowns FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Enigmas
CREATE TABLE IF NOT EXISTS public.enigmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  xp_reward INTEGER DEFAULT 50,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.enigmas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view enigmas" ON public.enigmas FOR SELECT TO authenticated USING (true);

-- Global Events (Banners, Movie Sessions)
CREATE TABLE IF NOT EXISTS public.global_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL, -- 'movie', 'birthday', 'rpg', 'warning'
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.global_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view global_events" ON public.global_events FOR SELECT TO authenticated USING (true);
