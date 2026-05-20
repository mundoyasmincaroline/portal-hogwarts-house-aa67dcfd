-- Create user_spells table
CREATE TABLE IF NOT EXISTS public.user_spells (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    spell_id UUID REFERENCES public.spells(id) ON DELETE CASCADE NOT NULL,
    mastery_level INTEGER DEFAULT 1,
    learned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, spell_id)
);

-- Enable RLS
ALTER TABLE public.user_spells ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own learned spells" ON public.user_spells FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can learn spells" ON public.user_spells FOR INSERT WITH CHECK (auth.uid() = user_id);
