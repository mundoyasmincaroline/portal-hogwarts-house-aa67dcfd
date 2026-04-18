
-- ===== INSTA_POSTS =====
CREATE TABLE IF NOT EXISTS public.insta_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  likes UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.insta_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view insta_posts" ON public.insta_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users create own insta_posts" ON public.insta_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update insta_posts (likes)" ON public.insta_posts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users delete own insta_posts" ON public.insta_posts FOR DELETE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));

-- ===== FRIENDSHIPS =====
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own friendships" ON public.friendships FOR SELECT TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users create friendships" ON public.friendships FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own friendships" ON public.friendships FOR UPDATE TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users delete own friendships" ON public.friendships FOR DELETE TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Foreign keys nomeadas para o select com hint do Profile.tsx
ALTER TABLE public.friendships
  ADD CONSTRAINT friendships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  ADD CONSTRAINT friendships_friend_id_fkey FOREIGN KEY (friend_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
