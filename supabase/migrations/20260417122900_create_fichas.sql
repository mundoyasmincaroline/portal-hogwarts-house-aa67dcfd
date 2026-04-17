CREATE TABLE IF NOT EXISTS public.fichas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    character_name TEXT NOT NULL,
    age INTEGER NOT NULL,
    primary_house TEXT NOT NULL,
    secondary_house TEXT,
    school_year INTEGER CHECK (school_year BETWEEN 1 AND 7),
    history TEXT,
    patronus TEXT,
    wand TEXT,
    blood_status TEXT,
    pet TEXT,
    favorite_subject TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.fichas ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Usuários podem ver suas próprias fichas"
    ON public.fichas FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins podem ver todas as fichas"
    ON public.fichas FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Usuários podem inserir suas fichas"
    ON public.fichas FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias fichas pendentes"
    ON public.fichas FOR UPDATE
    USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins podem atualizar qualquer ficha"
    ON public.fichas FOR UPDATE
    USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));
