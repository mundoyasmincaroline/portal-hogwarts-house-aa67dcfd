
CREATE TABLE IF NOT EXISTS public.lounge_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (scope IN ('club','room')),
  scope_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lounge_messages_scope ON public.lounge_messages(scope, scope_id, created_at DESC);

GRANT SELECT, INSERT, DELETE ON public.lounge_messages TO authenticated;
GRANT ALL ON public.lounge_messages TO service_role;

ALTER TABLE public.lounge_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view lounge messages" ON public.lounge_messages;
CREATE POLICY "Authenticated can view lounge messages"
ON public.lounge_messages FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Members can post in clubs/rooms" ON public.lounge_messages;
CREATE POLICY "Members can post in clubs/rooms"
ON public.lounge_messages FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    (scope = 'club' AND EXISTS (SELECT 1 FROM public.club_members cm WHERE cm.club_id = scope_id AND cm.user_id = auth.uid()))
    OR
    (scope = 'room' AND EXISTS (SELECT 1 FROM public.room_members rm WHERE rm.room_id = scope_id AND rm.user_id = auth.uid()))
  )
);

DROP POLICY IF EXISTS "Owners can delete own lounge messages" ON public.lounge_messages;
CREATE POLICY "Owners can delete own lounge messages"
ON public.lounge_messages FOR DELETE TO authenticated USING (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.lounge_messages;
