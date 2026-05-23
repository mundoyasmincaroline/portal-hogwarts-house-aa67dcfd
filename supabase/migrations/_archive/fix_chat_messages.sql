-- =========================================
-- FIX: MENSAGENS DO CHAT INVISÍVEIS
-- =========================================

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Messages viewable by everyone" ON public.messages;
CREATE POLICY "Messages viewable by everyone" ON public.messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Messages insertable by authenticated" ON public.messages;
CREATE POLICY "Messages insertable by authenticated" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
