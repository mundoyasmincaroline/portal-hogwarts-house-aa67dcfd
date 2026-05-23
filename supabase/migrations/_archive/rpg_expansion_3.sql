-- FASE 5: InstaHogwarts Evoluído
-- Adiciona a coluna para Música Tema nos posts

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS music_url TEXT;
