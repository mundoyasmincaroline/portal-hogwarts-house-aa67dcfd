-- EXPANSÃO 6: Amizades e Cine Hogwarts

-- 1. Tabela de Amigos (Rede Social)
CREATE TABLE IF NOT EXISTS public.friends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, friend_id)
);

ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own friends" ON public.friends
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can add friends" ON public.friends
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove friends" ON public.friends
    FOR DELETE USING (auth.uid() = user_id);

-- 2. Tabela de Configurações do Sistema (Cine Hogwarts e outros)
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Todos podem ler as configurações (necessário para o Cine Hogwarts)
CREATE POLICY "Anyone can read system settings" ON public.system_settings
    FOR SELECT USING (true);

-- Apenas admins podem alterar
CREATE POLICY "Admins can update system settings" ON public.system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Inserir configuração inicial do Cinema
INSERT INTO public.system_settings (key, value) 
VALUES ('cinema_config', '{"url": "https://www.youtube.com/watch?v=5y2sQpeT4K0", "title": "Cine Hogwarts: Maratona Mágica", "active": true}'::jsonb)
ON CONFLICT (key) DO NOTHING;
