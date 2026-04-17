CREATE TABLE IF NOT EXISTS public.insta_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    likes UUID[] DEFAULT ARRAY[]::UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.insta_posts ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Insta posts visíveis para todos" ON public.insta_posts FOR SELECT
    USING (true);

CREATE POLICY "Usuários podem inserir insta posts" ON public.insta_posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar likes em insta posts" ON public.insta_posts FOR UPDATE
    USING (true);

CREATE POLICY "Usuários podem deletar seus próprios insta posts" ON public.insta_posts FOR DELETE
    USING (auth.uid() = user_id);
