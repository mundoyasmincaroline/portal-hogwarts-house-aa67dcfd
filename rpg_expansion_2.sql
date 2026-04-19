-- FASE 2: Atualização de Mensagens e Posts para Personagens Específicos
-- Rode este script no painel SQL do Supabase.

-- 1. Adicionar character_id às Mensagens
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL;

-- 2. Adicionar character_id aos Posts (InstaHogwarts)
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL;

-- 3. Adicionar character_id aos Comentários (InstaHogwarts)
ALTER TABLE public.post_comments ADD COLUMN IF NOT EXISTS character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL;
