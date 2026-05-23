-- 1. CONSOLIDAÇÃO DE RLS REDUNDANTES (DM_MESSAGES)
DROP POLICY IF EXISTS "DM: mark as read" ON public.dm_messages;
DROP POLICY IF EXISTS "DM: users see own messages" ON public.dm_messages;
DROP POLICY IF EXISTS "DM: users send messages" ON public.dm_messages;
DROP POLICY IF EXISTS "Users can send dms" ON public.dm_messages;
DROP POLICY IF EXISTS "Users can update own dms" ON public.dm_messages;
DROP POLICY IF EXISTS "Users can view own dms" ON public.dm_messages;
DROP POLICY IF EXISTS "Users mark read" ON public.dm_messages;
DROP POLICY IF EXISTS "Users see own DMs" ON public.dm_messages;
DROP POLICY IF EXISTS "Users send DMs" ON public.dm_messages;

CREATE POLICY "dm_messages_select" ON public.dm_messages FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "dm_messages_insert" ON public.dm_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "dm_messages_update_read" ON public.dm_messages FOR UPDATE TO authenticated USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);

-- 2. CONSOLIDAÇÃO DE RLS REDUNDANTES (FRIENDSHIPS)
DROP POLICY IF EXISTS "Users can delete own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can insert own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can update own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can view own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users create friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users delete own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users see own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users update own friendships" ON public.friendships;

CREATE POLICY "friendships_select" ON public.friendships FOR SELECT TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "friendships_insert" ON public.friendships FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "friendships_update" ON public.friendships FOR UPDATE TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "friendships_delete" ON public.friendships FOR DELETE TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- 3. CORREÇÃO DE POLÍTICAS 'TRUE' (VULNERABILIDADES)
-- azkaban_status
DROP POLICY IF EXISTS "Anyone can insert azkaban" ON public.azkaban_status;
DROP POLICY IF EXISTS "Anyone can update azkaban" ON public.azkaban_status;
CREATE POLICY "admins_manage_azkaban" ON public.azkaban_status FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- character_infractions
DROP POLICY IF EXISTS "System inserts infractions" ON public.character_infractions;
CREATE POLICY "admins_insert_infractions" ON public.character_infractions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- channels
DROP POLICY IF EXISTS "Authenticated can create channels" ON public.channels;
CREATE POLICY "admins_create_channels" ON public.channels FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- duel_turns
DROP POLICY IF EXISTS "Authenticated insert duel_turns" ON public.duel_turns;
CREATE POLICY "participants_insert_turns" ON public.duel_turns FOR INSERT TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM duels WHERE duels.id = duel_id AND (auth.uid() = challenger_user_id OR auth.uid() = opponent_user_id)));

-- lesson_attendance
DROP POLICY IF EXISTS "Owner registers attendance" ON public.lesson_attendance;
CREATE POLICY "lesson_attendance_insert" ON public.lesson_attendance FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 4. AJUSTE TABELA STORE_ITEMS E MIGRAÇÃO
-- Alterando ID de UUID para TEXT, removendo FK temporariamente
ALTER TABLE public.user_items DROP CONSTRAINT IF EXISTS user_items_item_id_fkey;
ALTER TABLE public.store_items ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.user_items ALTER COLUMN item_id TYPE TEXT;
ALTER TABLE public.user_items ADD CONSTRAINT user_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.store_items(id);

ALTER TABLE public.store_items ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

INSERT INTO public.store_items (id, name, category, price_galeons, image_url, rarity, is_featured, description, active)
VALUES 
  ('mq_wand_elder', 'Varinha das Varinhas', 'wand', 5000, 'https://portal-hogwarts.lovable.app/legendary_elder_wand_cinematic_1776814022237.png', 'legendary', true, 'A varinha mais poderosa já fabricada, feita de sabugueiro e núcleo de pelo de testrálio.', true),
  ('mq_wand_ebony', 'Varinha de Ébano', 'wand', 2500, 'https://portal-hogwarts.lovable.app/monster_quality_wand_ebony_1776815361581.png', 'rare', false, 'Ébano é uma madeira preta e impressionante, com um brilho quase metálico.', true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  price_galeons = EXCLUDED.price_galeons,
  image_url = EXCLUDED.image_url,
  active = EXCLUDED.active;

-- 5. CRIAÇÃO DE TABELAS PARA AS PRÓXIMAS FASES
CREATE TABLE IF NOT EXISTS public.seasonal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  event_type TEXT DEFAULT 'event',
  house_points_bonus INTEGER DEFAULT 0,
  xp_multiplier NUMERIC DEFAULT 1.0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.seasonal_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seasonal_events_select" ON public.seasonal_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "seasonal_events_admin" ON public.seasonal_events FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.creatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  habitat TEXT,
  rarity TEXT DEFAULT 'common',
  danger_level INTEGER DEFAULT 1,
  image_url TEXT,
  drops JSONB DEFAULT '[]',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.creatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "creatures_select" ON public.creatures FOR SELECT TO authenticated USING (true);
CREATE POLICY "creatures_admin" ON public.creatures FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 6. SEGURANÇA DE FUNÇÕES
ALTER FUNCTION public.has_role SET search_path = public;
ALTER FUNCTION public.update_updated_at_column SET search_path = public;
