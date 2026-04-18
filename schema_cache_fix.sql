-- CHOCADOR DE CACHE SUPABASE
-- Este script força o Supabase a reconstruir o cache da API, resolvendo erros de "Could not find table in schema cache".

-- Adiciona e remove colunas temporárias para forçar o backend a notar as mudanças no schema
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS force_cache_flush boolean;
ALTER TABLE public.channels DROP COLUMN force_cache_flush;

ALTER TABLE public.user_challenges ADD COLUMN IF NOT EXISTS force_cache_flush boolean;
ALTER TABLE public.user_challenges DROP COLUMN force_cache_flush;

ALTER TABLE public.stickers ADD COLUMN IF NOT EXISTS force_cache_flush boolean;
ALTER TABLE public.stickers DROP COLUMN force_cache_flush;

-- Comando oficial do PostgREST para recarregar o schema
NOTIFY pgrst, 'reload schema';
