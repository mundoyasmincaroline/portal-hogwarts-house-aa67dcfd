
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
