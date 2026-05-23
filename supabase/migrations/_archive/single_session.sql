-- Sessão Única por Usuário
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_session_id TEXT;
