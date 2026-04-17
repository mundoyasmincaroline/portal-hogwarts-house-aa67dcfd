CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Usuários podem ver suas próprias notificações" ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Sistema pode inserir notificações" ON public.notifications FOR INSERT
    WITH CHECK (true); -- Geralmente, chamadas via trigger ou function bypassam RLS, ou frontend se autenticado

CREATE POLICY "Usuários podem marcar notificações como lidas" ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas notificações" ON public.notifications FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger para notificar aprovação de ficha (Exemplo de Bot interno)
CREATE OR REPLACE FUNCTION notify_ficha_approval() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        INSERT INTO notifications (user_id, title, message, link)
        VALUES (NEW.user_id, 'Ficha Aprovada!', 'Sua ficha de personagem foi aprovada pelo Ministério da Magia. Bem-vindo(a) ao RPG!', '/dashboard/ficha');
    ELSIF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
        INSERT INTO notifications (user_id, title, message, link)
        VALUES (NEW.user_id, 'Ficha Rejeitada', 'Sua ficha apresentou inconsistências. Verifique e envie novamente.', '/dashboard/ficha');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ficha_approval_trigger ON public.fichas;
CREATE TRIGGER ficha_approval_trigger
    AFTER UPDATE ON public.fichas
    FOR EACH ROW EXECUTE FUNCTION notify_ficha_approval();
