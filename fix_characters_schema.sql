-- SCRIPT DE ESTRUTURA CORRIGIDO (V3)
ALTER TABLE public.characters 
ADD COLUMN IF NOT EXISTS history TEXT,
ADD COLUMN IF NOT EXISTS background TEXT,
ADD COLUMN IF NOT EXISTS physical_description TEXT,
ADD COLUMN IF NOT EXISTS canon_era TEXT,
ADD COLUMN IF NOT EXISTS canon_portrayed_by TEXT,
ADD COLUMN IF NOT EXISTS canon_notes TEXT,
ADD COLUMN IF NOT EXISTS pair_character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS relationship_status TEXT DEFAULT 'single',
ADD COLUMN IF NOT EXISTS age_category TEXT DEFAULT 'student',
ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'male';

ALTER TABLE public.characters ALTER COLUMN age_category SET DEFAULT 'student';
ALTER TABLE public.characters ALTER COLUMN gender SET DEFAULT 'male';

-- Ajuste na tabela canon_claims
ALTER TABLE public.canon_claims 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Tornar claimed_by opcional (permitir NULL) pois vamos usar user_id
ALTER TABLE public.canon_claims ALTER COLUMN claimed_by DROP NOT NULL;
