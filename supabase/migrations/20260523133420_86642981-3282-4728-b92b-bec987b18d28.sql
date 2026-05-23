-- Fix RLS for notifications
DROP POLICY IF EXISTS "Anyone authenticated can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert notifications for others" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can only view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix RLS for insta_posts
DROP POLICY IF EXISTS "Users update insta_posts (likes)" ON public.insta_posts;
CREATE POLICY "Users can update their own insta_posts"
ON public.insta_posts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix RLS for system_logs
DROP POLICY IF EXISTS "Enable insert for all authenticated users" ON public.system_logs;
CREATE POLICY "Only system and authenticated can insert logs"
ON public.system_logs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_posts_created_at_desc ON public.posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments (post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON public.post_reactions (post_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_house ON public.profiles (house);

-- Secure Functions search_path (fixing the specific signatures)
ALTER FUNCTION public.award_galeons(uuid, integer, text) SET search_path = public;
ALTER FUNCTION public.award_xp_action(text, uuid, integer) SET search_path = public;
ALTER FUNCTION public.award_xp_action(uuid, text, integer) SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
