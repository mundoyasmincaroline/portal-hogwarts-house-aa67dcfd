
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create house enum
CREATE TYPE public.house_type AS ENUM ('gryffindor', 'slytherin', 'ravenclaw', 'hufflepuff');

-- User roles table (security best practice)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text = _role::text
  )
$$;

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  username TEXT NOT NULL UNIQUE,
  age INTEGER NOT NULL DEFAULT 13,
  house house_type NOT NULL DEFAULT 'gryffindor',
  level INTEGER NOT NULL DEFAULT 0,
  xp INTEGER NOT NULL DEFAULT 0,
  xp_to_next INTEGER NOT NULL DEFAULT 100,
  bio TEXT DEFAULT '',
  avatar_url TEXT,
  approved BOOLEAN NOT NULL DEFAULT false,
  online BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  reactions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Post comments
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Challenges
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  xp_reward INTEGER NOT NULL DEFAULT 50,
  type TEXT NOT NULL DEFAULT 'weekly',
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- User challenges (participation)
CREATE TABLE IF NOT EXISTS public.user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

-- House points history
CREATE TABLE IF NOT EXISTS public.house_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house house_type NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  reason TEXT DEFAULT '',
  awarded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.house_points ENABLE ROW LEVEL SECURITY;

-- Badges
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '🏅',
  xp_required INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- User badges
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, username, age, house)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8)),
    COALESCE((NEW.raw_user_meta_data->>'age')::integer, 13),
    COALESCE((NEW.raw_user_meta_data->>'house')::house_type, 'gryffindor')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- user_roles: only admins can see all, users see own
DO $ BEGIN CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN null; END $;
DO $ BEGIN CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN null; END $;

-- profiles: all authenticated can view, own can update
DO $ BEGIN CREATE POLICY "Authenticated can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN null; END $;
DO $ BEGIN CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN null; END $;
DO $ BEGIN CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN null; END $;
DO $ BEGIN CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN null; END $;

-- posts
DO $ BEGIN CREATE POLICY "Authenticated can view posts" ON public.posts FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN null; END $;
DO $ BEGIN CREATE POLICY "Users can create own posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN null; END $;
DO $ BEGIN CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN null; END $;
DO $ BEGIN CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN null; END $;
DO $ BEGIN CREATE POLICY "Admins can manage posts" ON public.posts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN null; END $;

-- post_comments
DO $ BEGIN CREATE POLICY "Authenticated can view comments" ON public.post_comments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN null; END $;
DO $ BEGIN CREATE POLICY "Users can create own comments" ON public.post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN null; END $;
DO $ BEGIN CREATE POLICY "Users can delete own comments" ON public.post_comments FOR DELETE TO authenticated USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN null; END $;
DO $ BEGIN CREATE POLICY "Admins can manage comments" ON public.post_comments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN null; END $;

-- challenges
DO $ BEGIN CREATE POLICY "Authenticated can view challenges" ON public.challenges FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN null; END $;
DO $ BEGIN CREATE POLICY "Admins can manage challenges" ON public.challenges FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN null; END $;

-- user_challenges
DO $ BEGIN CREATE POLICY "Authenticated can view user_challenges" ON public.user_challenges FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN null; END $;
DO $ BEGIN CREATE POLICY "Users can join challenges" ON public.user_challenges FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN null; END $;
DO $ BEGIN CREATE POLICY "Users can update own challenges" ON public.user_challenges FOR UPDATE TO authenticated USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN null; END $;

-- house_points
DO $ BEGIN CREATE POLICY "Authenticated can view house_points" ON public.house_points FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN null; END $;
DO $ BEGIN CREATE POLICY "Admins can manage house_points" ON public.house_points FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN null; END $;

-- badges
DO $ BEGIN CREATE POLICY "Authenticated can view badges" ON public.badges FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN null; END $;
DO $ BEGIN CREATE POLICY "Admins can manage badges" ON public.badges FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN null; END $;

-- user_badges
DO $ BEGIN CREATE POLICY "Authenticated can view user_badges" ON public.user_badges FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN null; END $;
DO $ BEGIN CREATE POLICY "Admins can award badges" ON public.user_badges FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN null; END $;

-- Storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

DO $ BEGIN CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars'); EXCEPTION WHEN duplicate_object THEN null; END $;
DO $ BEGIN CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]); EXCEPTION WHEN duplicate_object THEN null; END $;
DO $ BEGIN CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]); EXCEPTION WHEN duplicate_object THEN null; END $;

-- Drop the broad SELECT policy
DROP POLICY "Avatar images are publicly accessible" ON storage.objects;

-- Create a more restrictive SELECT policy (public read by direct URL is still allowed by public bucket, but listing is restricted)
DO $ BEGIN CREATE POLICY "Users can view own avatars" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]); EXCEPTION WHEN duplicate_object THEN null; END $;

-- ============= 1. Tabela de reações por usuário =============
CREATE TABLE IF NOT EXISTS public.post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, emoji)
);

ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view reactions" ON public.post_reactions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can add own reactions" ON public.post_reactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own reactions" ON public.post_reactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============= 2. Coluna last_seen para presença online =============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT now();

-- ============= 3. Validação de idade 13-17 via trigger =============
CREATE OR REPLACE FUNCTION public.validate_profile_age()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.age < 13 OR NEW.age > 17 THEN
    RAISE EXCEPTION 'Apenas bruxos de 13 a 17 anos podem se matricular (idade informada: %)', NEW.age;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_age_on_profiles ON public.profiles;
CREATE TRIGGER validate_age_on_profiles
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_age();

-- ============= 4. Trigger handle_new_user com validação de idade =============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_age INTEGER;
BEGIN
  user_age := COALESCE((NEW.raw_user_meta_data->>'age')::integer, 13);
  IF user_age < 13 OR user_age > 17 THEN
    RAISE EXCEPTION 'Apenas bruxos de 13 a 17 anos podem se matricular';
  END IF;

  INSERT INTO public.profiles (user_id, full_name, username, age, house, approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8)),
    user_age,
    COALESCE((NEW.raw_user_meta_data->>'house')::house_type, 'gryffindor'),
    true  -- ACEITE AUTOMÁTICO ao entrar
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

-- Garante que o trigger existe em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Aprovar todos os perfis existentes (aceite automático)
UPDATE public.profiles SET approved = true WHERE approved = false;

-- ============= 5. Tabela de log do moderador Filch =============
CREATE TABLE IF NOT EXISTS public.moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  content_type TEXT NOT NULL, -- 'post' | 'comment'
  content_id UUID,
  original_content TEXT,
  reason TEXT,
  action TEXT NOT NULL, -- 'blocked' | 'flagged' | 'cleaned'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.moderation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view moderation log" ON public.moderation_log
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role can insert" ON public.moderation_log
  FOR INSERT TO authenticated WITH CHECK (true);

-- ============= 6. Função de filtro Filch (palavrões) =============
CREATE OR REPLACE FUNCTION public.filch_check_content()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  banned_words TEXT[] := ARRAY[
    'porra','caralho','foda','fdp','puta','merda','viado','viadinho',
    'piranha','vagabunda','desgraça','arrombado','cuzão','bosta',
    'idiota','retardado','imbecil','otário','babaca','escroto',
    'fuck','shit','bitch','asshole','dick','pussy','nigger','faggot'
  ];
  word TEXT;
  lower_content TEXT;
  found_word TEXT := NULL;
BEGIN
  lower_content := lower(NEW.content);
  FOREACH word IN ARRAY banned_words LOOP
    IF lower_content ~* ('\m' || word || '\M') THEN
      found_word := word;
      EXIT;
    END IF;
  END LOOP;

  IF found_word IS NOT NULL THEN
    INSERT INTO public.moderation_log (user_id, content_type, content_id, original_content, reason, action)
    VALUES (
      NEW.user_id,
      TG_TABLE_NAME,
      NEW.id,
      NEW.content,
      'Palavra imprópria detectada: ' || found_word,
      'blocked'
    );
    RAISE EXCEPTION '🧹 Filch, o Zelador, bloqueou esta mensagem: linguagem imprópria detectada ("%"). Cuidado com o vocabulário no castelo!', found_word;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS filch_moderate_posts ON public.posts;
CREATE TRIGGER filch_moderate_posts
  BEFORE INSERT OR UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.filch_check_content();

DROP TRIGGER IF EXISTS filch_moderate_comments ON public.post_comments;
CREATE TRIGGER filch_moderate_comments
  BEFORE INSERT OR UPDATE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.filch_check_content();

-- ============= 7. Realtime para feed/comentários/reações =============
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

DROP POLICY IF EXISTS "Service role can insert" ON public.moderation_log;
-- Apenas triggers SECURITY DEFINER conseguem inserir; usuários autenticados não inserem direto.
CREATE POLICY "Admins can insert moderation log" ON public.moderation_log
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
-- Adicionar colunas de quiz à tabela challenges
ALTER TABLE public.challenges
ADD COLUMN IF NOT EXISTS question TEXT,
ADD COLUMN IF NOT EXISTS correct_answer TEXT;

-- Adicionar política para garantir que apenas o criador/admin possa ver a resposta correta (opcional, mas bom)
-- Aqui simplificaremos: o frontend fará a validação ou podemos fazer no banco.
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
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Usuários podem ver suas próprias notificações" ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Sistema pode inserir notificações" ON public.notifications FOR INSERT
    WITH CHECK (true); -- Geralmente, chamadas via trigger ou function bypassam RLS, ou frontend se autenticado

CREATE POLICY "Usuários podem marcar notificações como lidas" ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas notificações" ON public.notifications FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger para notificar aprovação de ficha (Exemplo de Bot interno)
CREATE OR REPLACE FUNCTION notify_ficha_approval() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        INSERT INTO notifications (user_id, title, message, link)
        VALUES (NEW.user_id, 'Ficha Aprovada!', 'Sua ficha de personagem foi aprovada pelo Ministério da Magia. Bem-vindo(a) ao RPG!', '/dashboard/ficha');
    ELSIF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
        INSERT INTO notifications (user_id, title, message, link)
        VALUES (NEW.user_id, 'Ficha Rejeitada', 'Sua ficha apresentou inconsistências. Verifique e envie novamente.', '/dashboard/ficha');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ficha_approval_trigger ON public.fichas;
CREATE TRIGGER ficha_approval_trigger
    AFTER UPDATE ON public.fichas
    FOR EACH ROW EXECUTE FUNCTION notify_ficha_approval();
-- Atualizar tabela de canais com recursos premium e salas de meet
ALTER TABLE public.channels 
ADD COLUMN IF NOT EXISTS meet_link TEXT,
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

-- Marcar a Ordem da Fênix como Premium por padrão, se existir
UPDATE public.channels 
SET is_premium = TRUE 
WHERE name = 'Ordem da Fênix';
-- Adicionar colunas de prova e status aos desafios dos usuários
ALTER TABLE public.user_challenges
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved', -- 'pending', 'approved', 'rejected'
ADD COLUMN IF NOT EXISTS proof TEXT;

-- Tabela para palavras proibidas (Moderação)
CREATE TABLE IF NOT EXISTS public.banned_words (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    word TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.banned_words ENABLE ROW LEVEL SECURITY;

-- Políticas
DO $ BEGIN CREATE POLICY "Qualquer um pode ler palavras proibidas" ON public.banned_words FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN null; END $;
CREATE POLICY "Apenas admin pode gerenciar palavras proibidas" ON public.banned_words FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Inserir algumas palavras padrão (exemplo)
INSERT INTO public.banned_words (word) VALUES
('porra'), ('caralho'), ('buceta'), ('puta')
ON CONFLICT DO NOTHING;
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
DO $ BEGIN CREATE POLICY "Anyone can view characters_birthdays" ON public.characters_birthdays FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN null; END $;

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
DO $ BEGIN CREATE POLICY "Users can view own cooldowns" ON public.user_cooldowns FOR SELECT TO authenticated USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN null; END $;
DO $ BEGIN CREATE POLICY "Users can update own cooldowns" ON public.user_cooldowns FOR UPDATE TO authenticated USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN null; END $;
DO $ BEGIN CREATE POLICY "Users can insert own cooldowns" ON public.user_cooldowns FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN null; END $;

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
DO $ BEGIN CREATE POLICY "Anyone can view enigmas" ON public.enigmas FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN null; END $;

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
DO $ BEGIN CREATE POLICY "Anyone can view global_events" ON public.global_events FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN null; END $;
ALTER TABLE public.user_challenges ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_seen_intro BOOLEAN DEFAULT false;
INSERT INTO public.badges (name, description, icon, xp_required) VALUES
('Mestre das Varinhas', 'Uma insígnia dada apenas aos feiticeiros mais habilidosos.', '🪄', 500),
('Apanhador de Ouro', 'Raro como o próprio pomo de ouro.', '🟡', 800),
('Espírito do Castelo', 'Para aqueles que conhecem todos os segredos de Hogwarts.', '🏰', 1200),
('Protetor Sombrio', 'Astuto e enigmático, sempre observando das sombras.', '🐍', 1500),
('Herói da Luz', 'A luz da esperança nas horas mais sombrias.', '✨', 1500),
('Coroa de Cristal', 'Realeza entre os bruxos.', '👑', 3000)
ON CONFLICT DO NOTHING;
-- Amizades
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, friend_id)
);
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
DO $ BEGIN CREATE POLICY "Users can view own friendships" ON public.friendships FOR SELECT TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id); EXCEPTION WHEN duplicate_object THEN null; END $;
DO $ BEGIN CREATE POLICY "Users can insert own friendships" ON public.friendships FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN null; END $;
DO $ BEGIN CREATE POLICY "Users can update own friendships" ON public.friendships FOR UPDATE TO authenticated USING (auth.uid() = friend_id); EXCEPTION WHEN duplicate_object THEN null; END $;
DO $ BEGIN CREATE POLICY "Users can delete own friendships" ON public.friendships FOR DELETE TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id); EXCEPTION WHEN duplicate_object THEN null; END $;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS accepted_rules BOOLEAN DEFAULT false;
-- Criação preventiva da tabela de roles (caso não exista)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
-- Permite que usuários vejam suas próprias roles e admins vejam todas
DO $ BEGIN CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN null; END $;
DO $ BEGIN CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')); EXCEPTION WHEN duplicate_object THEN null; END $;

-- Tabela de Anúncios (Monetização)
CREATE TABLE IF NOT EXISTS public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
DO $ BEGIN CREATE POLICY "Anyone can view ads" ON public.ads FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN null; END $;
DO $ BEGIN CREATE POLICY "Admins can manage ads" ON public.ads FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')); EXCEPTION WHEN duplicate_object THEN null; END $;

-- Tabela de Stories
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  media_url TEXT,
  content TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
-- Todos podem ver stories que ainda não expiraram
DO $ BEGIN CREATE POLICY "Anyone can view active stories" ON public.stories FOR SELECT TO authenticated USING (expires_at > now()); EXCEPTION WHEN duplicate_object THEN null; END $;
DO $ BEGIN CREATE POLICY "Users can create stories" ON public.stories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN null; END $;
DO $ BEGIN CREATE POLICY "Users can delete own stories" ON public.stories FOR DELETE TO authenticated USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN null; END $;
DO $ BEGIN CREATE POLICY "Admins can delete any story" ON public.stories FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')); EXCEPTION WHEN duplicate_object THEN null; END $;

-- Função para limpar stories expirados (Opcional, pois a RLS já os oculta, mas mantém o banco limpo)
-- Se não rodar cron_job, os stories velhos apenas não aparecerão na view.


