
-- 1) Add missing column for chat pin feature
ALTER TABLE public.channels
  ADD COLUMN IF NOT EXISTS pinned_message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL;

-- 2) Drop duplicate permissive insert policy on notifications
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;

-- 3) Re-scope sensitive policies from {public} to {authenticated}
-- user_items
DROP POLICY IF EXISTS "Users manage own items" ON public.user_items;
CREATE POLICY "Users manage own items" ON public.user_items
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- galeon_orders
DROP POLICY IF EXISTS "Users insert own orders" ON public.galeon_orders;
DROP POLICY IF EXISTS "Users update own orders" ON public.galeon_orders;
DROP POLICY IF EXISTS "Users view own orders" ON public.galeon_orders;
CREATE POLICY "Users insert own orders" ON public.galeon_orders
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own orders" ON public.galeon_orders
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users view own orders" ON public.galeon_orders
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- insta_follows
DROP POLICY IF EXISTS "Follows: seguir" ON public.insta_follows;
DROP POLICY IF EXISTS "Follows: deixar de seguir" ON public.insta_follows;
DROP POLICY IF EXISTS "Follows: ver todos" ON public.insta_follows;
CREATE POLICY "Follows: seguir" ON public.insta_follows
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_user_id);
CREATE POLICY "Follows: deixar de seguir" ON public.insta_follows
  FOR DELETE TO authenticated USING (auth.uid() = follower_user_id);
CREATE POLICY "Follows: ver todos" ON public.insta_follows
  FOR SELECT TO authenticated USING (true);

-- insta_character_follows
DROP POLICY IF EXISTS "Users manage own char follows" ON public.insta_character_follows;
DROP POLICY IF EXISTS "Anyone can read char follows" ON public.insta_character_follows;
CREATE POLICY "Users manage own char follows" ON public.insta_character_follows
  FOR ALL TO authenticated
  USING (follower_user_id = auth.uid()) WITH CHECK (follower_user_id = auth.uid());
CREATE POLICY "Anyone can read char follows" ON public.insta_character_follows
  FOR SELECT TO authenticated USING (true);

-- insta_posts (update policy)
DROP POLICY IF EXISTS "Users can update their own insta_posts" ON public.insta_posts;
CREATE POLICY "Users can update their own insta_posts" ON public.insta_posts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- azkaban_status
DROP POLICY IF EXISTS "Users read own azkaban status" ON public.azkaban_status;
CREATE POLICY "Users read own azkaban status" ON public.azkaban_status
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- notifications (consolidate)
DROP POLICY IF EXISTS "Users can only view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
-- Existing "Users see own notifications" and "Users update own notifications" already cover SELECT/UPDATE for authenticated

-- 4) Revoke blanket ALL on highly sensitive tables from anon
REVOKE ALL ON public.user_roles            FROM anon;
REVOKE ALL ON public.notifications         FROM anon;
REVOKE ALL ON public.moderation_log        FROM anon;
REVOKE ALL ON public.dm_messages           FROM anon;
REVOKE ALL ON public.azkaban_status        FROM anon;
REVOKE ALL ON public.galeon_orders         FROM anon;
REVOKE ALL ON public.character_infractions FROM anon;

-- 5) Harden avatars storage bucket
UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif']
WHERE id = 'avatars';

-- Upload policy (idempotent)
DROP POLICY IF EXISTS "Authenticated users upload own avatars" ON storage.objects;
CREATE POLICY "Authenticated users upload own avatars"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
