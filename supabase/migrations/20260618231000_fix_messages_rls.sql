-- Drop the existing problematic RLS policy
DROP POLICY IF EXISTS "Usuários podem enviar mensagens" ON public.messages;

-- Create a more robust policy for inserting messages
CREATE POLICY "Usuários podem enviar mensagens" ON public.messages FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM channels c
            WHERE c.id = channel_id AND (
                -- Admin check na tabela profiles
                (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'))
                
                -- Non-admin channels open to all
                OR (c.is_admin_only = FALSE AND c.allowed_houses IS NULL)
                
                -- House-specific channels (RESOLVIDO CASE-SENSITIVE e ENUM)
                OR (c.allowed_houses IS NOT NULL AND (
                    SELECT lower(house::text) FROM profiles WHERE user_id = auth.uid()
                ) IN (
                    SELECT lower(x::text) FROM unnest(c.allowed_houses) x
                ))
            )
        )
    );

-- Allow admins to delete messages
DROP POLICY IF EXISTS "Admins podem deletar mensagens" ON public.messages;
CREATE POLICY "Admins podem deletar mensagens" ON public.messages FOR DELETE
    USING (
        auth.uid() = user_id OR
        EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
    );

-- Correção para a tabela chat_messages caso ela seja usada no banco
DROP POLICY IF EXISTS "Usuários podem enviar mensagens" ON public.chat_messages;
CREATE POLICY "Usuários podem enviar mensagens" ON public.chat_messages FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM channels c
            WHERE c.id = channel_id AND (
                (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'))
                OR (c.is_admin_only = FALSE AND c.allowed_houses IS NULL)
                OR (c.allowed_houses IS NOT NULL AND (
                    SELECT lower(house::text) FROM profiles WHERE user_id = auth.uid()
                ) IN (
                    SELECT lower(x::text) FROM unnest(c.allowed_houses) x
                ))
            )
        )
    );
