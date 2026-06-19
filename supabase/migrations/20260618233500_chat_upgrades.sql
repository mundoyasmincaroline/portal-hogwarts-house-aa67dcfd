ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS spotify_url text;

DROP POLICY IF EXISTS "Usuários podem editar suas mensagens" ON public.messages;
CREATE POLICY "Usuários podem editar suas mensagens" ON public.messages
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
