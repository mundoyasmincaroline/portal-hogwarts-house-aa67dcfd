CREATE TABLE IF NOT EXISTS public.channels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'Geral',
    allowed_houses TEXT[] DEFAULT NULL,
    is_admin_only BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserindo os canais iniciais
INSERT INTO public.channels (name, description, category, allowed_houses, is_admin_only) VALUES
('Chat Off', 'Conversas fora do RPG (Off-topic).', 'Geral', NULL, FALSE),
('Eventos', 'Avisos e cobertura de eventos do portal.', 'Geral', NULL, FALSE),
('Profeta Diário', 'Notícias do mundo bruxo.', 'Geral', NULL, FALSE),

('Chat ON', 'Conversas gerais dentro do RPG.', 'RPG', NULL, FALSE),
('Castelo RPG', 'Exploração e interação pelo castelo de Hogwarts.', 'RPG', NULL, FALSE),
('RPF Fora de Hogwarts', 'Roleplay de locais fora da escola (Hogsmeade, Beco Diagonal, etc).', 'RPG', NULL, FALSE),

('Comunal da Grifinória', 'Acesso exclusivo aos corajosos da Grifinória.', 'Comunais', ARRAY['gryffindor'], FALSE),
('Comunal da Sonserina', 'Acesso exclusivo aos astutos da Sonserina.', 'Comunais', ARRAY['slytherin'], FALSE),
('Comunal da Corvinal', 'Acesso exclusivo aos sábios da Corvinal.', 'Comunais', ARRAY['ravenclaw'], FALSE),
('Comunal da Lufa-Lufa', 'Acesso exclusivo aos leais da Lufa-Lufa.', 'Comunais', ARRAY['hufflepuff'], FALSE),

('Ordem da Fênix', 'Reuniões da moderação e administração.', 'Admin', NULL, TRUE);

-- Habilitar RLS
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Políticas de Canais (Leitura)
CREATE POLICY "Canais visíveis para admin" ON public.channels FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Canais gerais visíveis para todos" ON public.channels FOR SELECT
    USING (is_admin_only = FALSE AND allowed_houses IS NULL);

CREATE POLICY "Canais de casas visíveis para membros da casa" ON public.channels FOR SELECT
    USING (
        allowed_houses IS NOT NULL 
        AND (SELECT house FROM profiles WHERE user_id = auth.uid()) = ANY(allowed_houses)
    );

-- Políticas de Mensagens
CREATE POLICY "Mensagens visíveis se tem acesso ao canal" ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM channels c
            WHERE c.id = channel_id AND (
                (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'))
                OR (c.is_admin_only = FALSE AND c.allowed_houses IS NULL)
                OR (c.allowed_houses IS NOT NULL AND (SELECT house FROM profiles WHERE user_id = auth.uid()) = ANY(c.allowed_houses))
            )
        )
    );

CREATE POLICY "Usuários podem enviar mensagens" ON public.messages FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM channels c
            WHERE c.id = channel_id AND (
                (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'))
                OR (c.is_admin_only = FALSE AND c.allowed_houses IS NULL)
                OR (c.allowed_houses IS NOT NULL AND (SELECT house FROM profiles WHERE user_id = auth.uid()) = ANY(c.allowed_houses))
            )
        )
    );
