-- 1. Restringir notificações
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
CREATE POLICY "Users can insert their own notifications" 
ON public.notifications 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 2. Índices de Performance
CREATE INDEX IF NOT EXISTS idx_dm_messages_receiver_read ON public.dm_messages(receiver_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insta_posts_created_at ON public.insta_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_house_points_house ON public.house_points(house);
CREATE INDEX IF NOT EXISTS idx_user_challenges_lookup ON public.user_challenges(user_id, challenge_id);
CREATE INDEX IF NOT EXISTS idx_friendships_lookup ON public.friendships(user_id, friend_id);

-- 3. Auditoria de Webhook
CREATE TABLE IF NOT EXISTS public.webhook_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    payload_hash TEXT NOT NULL,
    status TEXT NOT NULL,
    result_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.webhook_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can view audit logs" ON public.webhook_audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 4. Hardening de funções (Shadowing protection)
ALTER FUNCTION public.update_last_seen() SET search_path = public;
ALTER FUNCTION public.validate_profile_age() SET search_path = public;
ALTER FUNCTION public.award_badges_on_xp() SET search_path = public;
ALTER FUNCTION public.sync_profile_house_from_active_char() SET search_path = public;
ALTER FUNCTION public.trg_award_post() SET search_path = public;
ALTER FUNCTION public.trg_award_reaction() SET search_path = public;
ALTER FUNCTION public.trg_award_message() SET search_path = public;
ALTER FUNCTION public.filch_check_content() SET search_path = public;
ALTER FUNCTION public.trg_award_comment() SET search_path = public;
ALTER FUNCTION public.trg_award_story() SET search_path = public;
ALTER FUNCTION public.trg_award_insta() SET search_path = public;
ALTER FUNCTION public.stamp_active_character() SET search_path = public;
ALTER FUNCTION public.trg_recalc_blood_status() SET search_path = public;
ALTER FUNCTION public.trg_recalc_children_blood() SET search_path = public;
ALTER FUNCTION public.award_galeons(uuid, integer, text) SET search_path = public;
ALTER FUNCTION public.toggle_insta_like(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.buy_store_item(uuid, uuid) SET search_path = public;
