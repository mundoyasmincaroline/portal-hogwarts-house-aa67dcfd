-- 1. MELHORIA NO INSTAHOGWARTS
-- Garantindo que insta_posts tem character_id
ALTER TABLE public.insta_posts ADD COLUMN IF NOT EXISTS character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL;

-- 2. REAÇÕES E COMENTÁRIOS (POSTS E INSTA_POSTS)
-- Criando tabela de comentários unificada se não existir ou ajustando a existente
CREATE TABLE IF NOT EXISTS public.insta_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.insta_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.insta_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insta_comments_select" ON public.insta_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "insta_comments_insert" ON public.insta_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 3. FEED DO PROFETA DIÁRIO (NEWS)
CREATE TABLE IF NOT EXISTS public.daily_prophet_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  category TEXT DEFAULT 'general', -- 'general', 'quidditch', 'classes', 'ministry'
  is_ai_generated BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.daily_prophet_news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_prophet_news_select" ON public.daily_prophet_news FOR SELECT TO authenticated USING (true);
CREATE POLICY "daily_prophet_news_admin" ON public.daily_prophet_news FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Seed inicial de notícia
INSERT INTO public.daily_prophet_news (title, content, category)
VALUES 
  ('Ano Letivo Começa com Recorde de Inscritos!', 'O Diretor expressa otimismo para o novo semestre em Hogwarts.', 'general'),
  ('Copa de Quadribol: Grifinória treina intensamente', 'Apanhador da Grifinória foi visto treinando mergulhos arriscados.', 'quidditch')
ON CONFLICT DO NOTHING;

-- 4. NOTIFICAÇÕES (PREFERÊNCIAS)
CREATE TABLE IF NOT EXISTS public.user_notification_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enable_social BOOLEAN DEFAULT true,
  enable_quests BOOLEAN DEFAULT true,
  enable_system BOOLEAN DEFAULT true,
  enable_email_digest BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_notification_settings_owner" ON public.user_notification_settings FOR ALL TO authenticated USING (auth.uid() = user_id);
