-- =========================================
-- FASE 4: MONETIZAÇÃO E INTERSTITIAIS
-- =========================================

-- Adiciona novas colunas na tabela de ads
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS ad_type TEXT DEFAULT 'feed'; -- 'feed', 'interstitial', 'adsense'
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS script_content TEXT; -- Para guardar os scripts do AdSense

-- Tabela de configurações globais do sistema
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Settings viewable by everyone" ON public.site_settings;
CREATE POLICY "Settings viewable by everyone" ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Settings editable by admin" ON public.site_settings;
CREATE POLICY "Settings editable by admin" ON public.site_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Inserir configuração padrão para o Interstitial (DESATIVADO por padrão)
INSERT INTO public.site_settings (setting_key, setting_value) VALUES
('interstitial_config', '{"enabled": false, "interval_minutes": 5}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

