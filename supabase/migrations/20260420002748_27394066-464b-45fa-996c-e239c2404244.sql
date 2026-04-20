-- Garante que status aceita os novos valores (texto livre, então só documentamos via comentário)
COMMENT ON COLUMN public.friendships.status IS 'pending | accepted | rejected | blocked';

-- Índice para acelerar busca de pedidos recebidos
CREATE INDEX IF NOT EXISTS idx_friendships_friend_status ON public.friendships(friend_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_user_status ON public.friendships(user_id, status);