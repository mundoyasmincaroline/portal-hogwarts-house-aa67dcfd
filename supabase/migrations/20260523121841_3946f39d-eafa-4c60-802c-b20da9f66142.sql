-- 1. MISSÕES NARRATIVAS (QUESTS)
CREATE TABLE IF NOT EXISTS public.quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  min_level INTEGER DEFAULT 1,
  xp_reward INTEGER DEFAULT 100,
  galeons_reward INTEGER DEFAULT 10,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quests_select" ON public.quests FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.quest_choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID REFERENCES public.quests(id) ON DELETE CASCADE,
  choice_text TEXT NOT NULL,
  consequence_text TEXT,
  required_house public.house_type, -- Usando o tipo correto do esquema public
  next_quest_id UUID REFERENCES public.quests(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.quest_choices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quest_choices_select" ON public.quest_choices FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.user_quest_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id UUID REFERENCES public.quests(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'ongoing',
  last_choice_id UUID REFERENCES public.quest_choices(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, quest_id)
);
ALTER TABLE public.user_quest_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_quest_select" ON public.user_quest_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_quest_insert" ON public.user_quest_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_quest_update" ON public.user_quest_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 2. SISTEMA DE QUADRIBOL
CREATE TABLE IF NOT EXISTS public.quidditch_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house public.house_type UNIQUE NOT NULL,
  captain_id UUID REFERENCES auth.users(id),
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.quidditch_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quidditch_teams_select" ON public.quidditch_teams FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.quidditch_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team1_id UUID REFERENCES public.quidditch_teams(id),
  team2_id UUID REFERENCES public.quidditch_teams(id),
  team1_score INTEGER DEFAULT 0,
  team2_score INTEGER DEFAULT 0,
  winner_id UUID REFERENCES public.quidditch_teams(id),
  status TEXT DEFAULT 'scheduled',
  scheduled_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.quidditch_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quidditch_matches_select" ON public.quidditch_matches FOR SELECT TO authenticated USING (true);

-- Inicializando times
INSERT INTO public.quidditch_teams (house) VALUES ('gryffindor'), ('slytherin'), ('hufflepuff'), ('ravenclaw') ON CONFLICT DO NOTHING;

-- 3. SEED DE MISSÃO INICIAL
INSERT INTO public.quests (title, description, min_level, xp_reward)
VALUES ('O Mistério do Corredor do Terceiro Andar', 'Dizem que algo está sendo guardado em um corredor proibido. Você decide investigar.', 1, 150)
ON CONFLICT DO NOTHING;
