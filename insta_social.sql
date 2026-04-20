-- ================================================
-- InstaHogwarts Social Layer
-- Execute no Supabase SQL Editor
-- ================================================

-- 1. Adicionar character_id nos posts (posts pertencem a personagens)
ALTER TABLE public.insta_posts
  ADD COLUMN IF NOT EXISTS character_id uuid REFERENCES public.characters(id) ON DELETE SET NULL;

-- 2. Sistema de seguidores InstaHogwarts (usuário segue personagem)
CREATE TABLE IF NOT EXISTS public.insta_follows (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followed_user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at        timestamptz DEFAULT now(),
  UNIQUE(follower_user_id, followed_user_id)
);
ALTER TABLE public.insta_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Follows: ver todos" ON public.insta_follows FOR SELECT USING (true);
CREATE POLICY "Follows: seguir" ON public.insta_follows FOR INSERT WITH CHECK (auth.uid() = follower_user_id);
CREATE POLICY "Follows: deixar de seguir" ON public.insta_follows FOR DELETE USING (auth.uid() = follower_user_id);

-- 3. Visualizações de Stories
CREATE TABLE IF NOT EXISTS public.story_views (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id   uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at  timestamptz DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "StoryViews: dono vê seus" ON public.story_views FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_id AND s.user_id = auth.uid())
         OR viewer_id = auth.uid());
CREATE POLICY "StoryViews: registrar view" ON public.story_views FOR INSERT
  WITH CHECK (auth.uid() = viewer_id);

-- Realtime para follows
ALTER PUBLICATION supabase_realtime ADD TABLE public.insta_follows;
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_views;
