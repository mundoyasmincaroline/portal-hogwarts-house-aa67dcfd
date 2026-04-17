-- Atualizar tabela de canais com recursos premium e salas de meet
ALTER TABLE public.channels 
ADD COLUMN IF NOT EXISTS meet_link TEXT,
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

-- Marcar a Ordem da Fênix como Premium por padrão, se existir
UPDATE public.channels 
SET is_premium = TRUE 
WHERE name = 'Ordem da Fênix';
