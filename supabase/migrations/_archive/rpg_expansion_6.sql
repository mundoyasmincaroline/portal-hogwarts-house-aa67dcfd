-- EXPANSÃO 6: Cine Hogwarts

-- 1. Tabela de Configurações do Sistema (Cine Hogwarts e outros)
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
