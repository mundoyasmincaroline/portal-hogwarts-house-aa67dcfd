
-- ============ STICKERS ============
CREATE TABLE IF NOT EXISTS public.stickers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_name TEXT NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'bronze' CHECK (rarity IN ('bronze','silver','gold')),
  image_url TEXT NOT NULL DEFAULT '',
  level_required INTEGER NOT NULL DEFAULT 1,
  house TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.stickers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view stickers" ON public.stickers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage stickers" ON public.stickers FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- ============ USER_STICKERS ============
CREATE TABLE IF NOT EXISTS public.user_stickers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  sticker_id UUID NOT NULL REFERENCES public.stickers(id) ON DELETE CASCADE,
  obtained_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, sticker_id)
);
ALTER TABLE public.user_stickers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view user_stickers" ON public.user_stickers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own stickers" ON public.user_stickers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage user_stickers" ON public.user_stickers FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- ============ STORIES ============
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view stories" ON public.stories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create own stories" ON public.stories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own stories" ON public.stories FOR DELETE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));

-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Anyone authenticated can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins manage notifications" ON public.notifications FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============ ADS ============
CREATE TABLE IF NOT EXISTS public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  link TEXT NOT NULL DEFAULT '#',
  image_url TEXT DEFAULT '',
  ad_type TEXT NOT NULL DEFAULT 'banner' CHECK (ad_type IN ('banner','interstitial','sidebar')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view ads" ON public.ads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage ads" ON public.ads FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- ============ SITE_SETTINGS ============
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view settings" ON public.site_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage settings" ON public.site_settings FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- ============ CHARACTERS_BIRTHDAYS ============
CREATE TABLE IF NOT EXISTS public.characters_birthdays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  house TEXT,
  birth_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.characters_birthdays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view birthdays" ON public.characters_birthdays FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage birthdays" ON public.characters_birthdays FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- ============ USER_COOLDOWNS ============
CREATE TABLE IF NOT EXISTS public.user_cooldowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  last_message_at TIMESTAMPTZ,
  last_post_at TIMESTAMPTZ,
  last_reaction_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_cooldowns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own cooldowns" ON public.user_cooldowns FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own cooldowns" ON public.user_cooldowns FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own cooldowns" ON public.user_cooldowns FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ============ CHANNELS ============
CREATE TABLE IF NOT EXISTS public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  house_only TEXT,
  type TEXT NOT NULL DEFAULT 'general',
  icon TEXT DEFAULT '💬',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view channels" ON public.channels FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage channels" ON public.channels FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- ============ CHAT_MESSAGES ============
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view messages" ON public.chat_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users send own messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own messages" ON public.chat_messages FOR DELETE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage messages" ON public.chat_messages FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Apply Filch trigger to chat_messages
DROP TRIGGER IF EXISTS filch_check_chat ON public.chat_messages;
CREATE TRIGGER filch_check_chat BEFORE INSERT ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION public.filch_check_content();

-- ============ PROFILES: birth_date ============
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;

-- ============ ADMINS ============
INSERT INTO public.user_roles (user_id, role)
SELECT 'b9873320-6ad2-467f-8de6-badf6638e4c3'::uuid, 'admin'::app_role
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = 'b9873320-6ad2-467f-8de6-badf6638e4c3' AND role='admin');

INSERT INTO public.user_roles (user_id, role)
SELECT '2b778f39-c484-48e0-9d3d-3d2ab17eb594'::uuid, 'admin'::app_role
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = '2b778f39-c484-48e0-9d3d-3d2ab17eb594' AND role='admin');

-- Approve all existing profiles
UPDATE public.profiles SET approved = true WHERE approved = false;

-- ============ SEED ============
INSERT INTO public.channels (name, description, type, icon) VALUES
  ('geral', 'Canal geral do castelo', 'general', '🏰'),
  ('grifinória', 'Sala comunal da Grifinória', 'house', '🦁'),
  ('sonserina', 'Sala comunal da Sonserina', 'house', '🐍'),
  ('corvinal', 'Sala comunal da Corvinal', 'house', '🦅'),
  ('lufa-lufa', 'Sala comunal da Lufa-Lufa', 'house', '🦡')
ON CONFLICT DO NOTHING;

UPDATE public.channels SET house_only = 'gryffindor' WHERE name='grifinória';
UPDATE public.channels SET house_only = 'slytherin' WHERE name='sonserina';
UPDATE public.channels SET house_only = 'ravenclaw' WHERE name='corvinal';
UPDATE public.channels SET house_only = 'hufflepuff' WHERE name='lufa-lufa';

INSERT INTO public.site_settings (setting_key, setting_value) VALUES
  ('interstitial_config', '{"enabled": false, "interval_minutes": 10}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO public.characters_birthdays (name, house, birth_date) VALUES
  ('Harry Potter', 'gryffindor', '1980-07-31'),
  ('Hermione Granger', 'gryffindor', '1979-09-19'),
  ('Ron Weasley', 'gryffindor', '1980-03-01'),
  ('Draco Malfoy', 'slytherin', '1980-06-05'),
  ('Luna Lovegood', 'ravenclaw', '1981-02-13'),
  ('Neville Longbottom', 'gryffindor', '1980-07-30')
ON CONFLICT DO NOTHING;
