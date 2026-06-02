
-- 1. Fix award_xp_action: drop old overload, fix triggers
DROP FUNCTION IF EXISTS public.award_xp_action(uuid, text, integer);

CREATE OR REPLACE FUNCTION public.trg_award_post()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.award_xp_action('post', NEW.user_id, 10); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.trg_award_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.award_xp_action('comment', NEW.user_id, 5); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.trg_award_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.award_xp_action('message', NEW.user_id, 2); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.trg_award_reaction()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.award_xp_action('reaction', NEW.user_id, 1); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.trg_award_story()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.award_xp_action('story', NEW.user_id, 8); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.trg_award_insta()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.award_xp_action('insta_post', NEW.user_id, 10); RETURN NEW; END; $$;

-- 2. Fix validate_profile_age to only check on age change
CREATE OR REPLACE FUNCTION public.validate_profile_age()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR NEW.age IS DISTINCT FROM OLD.age) THEN
    IF NEW.age IS NOT NULL AND (NEW.age < 13 OR NEW.age > 17) THEN
      RAISE EXCEPTION 'Apenas bruxos de 13 a 17 anos podem se registrar no portal.';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

-- 3. Clean orphan active_character_id
UPDATE public.profiles p SET active_character_id = NULL
WHERE active_character_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.characters c WHERE c.id = p.active_character_id);

-- 4. Status CHECK constraints
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'galeon_orders_status_check') THEN
    ALTER TABLE public.galeon_orders ADD CONSTRAINT galeon_orders_status_check
      CHECK (status IS NULL OR status IN ('pending','paid','cancelled','failed'));
  END IF;
END $$;

-- 5. Storage avatars: UPDATE + DELETE policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users update own avatar') THEN
    CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users delete own avatar') THEN
    CREATE POLICY "Users delete own avatar" ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
END $$;

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_characters_user_id       ON public.characters(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id            ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id      ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stickers_user_id    ON public.user_stickers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_items_user_id       ON public.user_items(user_id);
CREATE INDEX IF NOT EXISTS idx_galeon_orders_user_status ON public.galeon_orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_azkaban_active           ON public.azkaban_status(user_id, active);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel    ON public.chat_messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_channel         ON public.messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vip_user_status          ON public.vip_subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_insta_follows_follower   ON public.insta_follows(follower_user_id);
CREATE INDEX IF NOT EXISTS idx_story_views_story        ON public.story_views(story_id);

-- 7. Drop duplicate indexes
DROP INDEX IF EXISTS public.idx_notifications_user_created;
DROP INDEX IF EXISTS public.idx_posts_created_at;
DROP INDEX IF EXISTS public.idx_post_comments_post_id;
DROP INDEX IF EXISTS public.idx_post_reactions_post_id;

-- 8. Realtime on profiles (idempotent)
DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
