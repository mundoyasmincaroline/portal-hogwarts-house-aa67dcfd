-- Drop the existing problematic RLS policy
DROP POLICY IF EXISTS "Usuários podem enviar mensagens" ON public.messages;

-- Create a more robust policy for inserting messages
CREATE POLICY "Usuários podem enviar mensagens" ON public.messages FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM channels c
            WHERE c.id = channel_id AND (
                -- Admin check via user_roles
                (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
                -- Non-admin channels open to all
                OR (c.is_admin_only = FALSE AND c.allowed_houses IS NULL)
                -- House-specific channels
                OR (c.allowed_houses IS NOT NULL AND (
                    SELECT lower(house) FROM profiles WHERE user_id = auth.uid()
                ) = ANY(
                    SELECT lower(unnest) FROM unnest(c.allowed_houses)
                ))
            )
        )
    );

-- Allow admins to delete messages
DROP POLICY IF EXISTS "Admins podem deletar mensagens" ON public.messages;
CREATE POLICY "Admins podem deletar mensagens" ON public.messages FOR DELETE
    USING (
        auth.uid() = user_id OR
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
    );
