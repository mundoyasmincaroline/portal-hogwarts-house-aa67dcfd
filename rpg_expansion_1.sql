-- FASE 1 & 2: EXPANSÃO RPG HOGWARTS LEGACY
-- Rode este script no painel SQL do seu Supabase para criar a infraestrutura de Múltiplos Personagens, Regras e Pares.

-- 1. Adicionar aceite de regras ao perfil
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_accepted_rules BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_character_id UUID;

-- 2. Criar a tabela de Personagens (Fichas)
CREATE TABLE IF NOT EXISTS public.characters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    character_type VARCHAR(10) CHECK (character_type IN ('oc', 'canon')) NOT NULL,
    age_category VARCHAR(10) CHECK (age_category IN ('student', 'adult')) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    house house_type,
    avatar_url TEXT,
    age INT,
    blood_status VARCHAR(50),
    wand TEXT,
    patronus TEXT,
    pet TEXT,
    pet_name TEXT,
    pet_avatar TEXT,
    favorite_class TEXT,
    favorite_spell TEXT,
    personality TEXT,
    weakness TEXT,
    strength TEXT,
    secrets TEXT,
    fears TEXT,
    dreams TEXT,
    quotes TEXT,
    instagram TEXT,
    actor_faceclaim TEXT,
    family_mother TEXT,
    family_father TEXT,
    family_siblings TEXT,
    family_relatives TEXT,
    adult_job TEXT,
    xp INT DEFAULT 0,
    level INT DEFAULT 1,
    xp_to_next INT DEFAULT 1000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Referenciar o personagem ativo no perfil
ALTER TABLE public.profiles
    ADD CONSTRAINT fk_active_character
    FOREIGN KEY (active_character_id) REFERENCES public.characters(id) ON DELETE SET NULL;

-- 4. Criar tabela de Bloqueio de Canon (para não repetirem personagens)
CREATE TABLE IF NOT EXISTS public.canon_claims (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    canon_name VARCHAR(100) UNIQUE NOT NULL,
    claimed_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Criar tabela de Pares Românticos
CREATE TABLE IF NOT EXISTS public.couples (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    character1_id UUID REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
    character2_id UUID REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(character1_id),
    UNIQUE(character2_id)
);

-- 6. Atualizar a RPC de XP para dar XP ao Personagem Ativo em vez de apenas à Conta
CREATE OR REPLACE FUNCTION award_xp_action(_action text, _user_id uuid, _xp integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    active_char_id UUID;
    current_xp INT;
    current_level INT;
    current_xp_to_next INT;
BEGIN
    -- Busca o personagem ativo da conta
    SELECT active_character_id INTO active_char_id FROM public.profiles WHERE user_id = _user_id;

    -- Se não tiver personagem ativo, dá o XP para o perfil base (fallback antigo)
    IF active_char_id IS NULL THEN
        UPDATE public.profiles SET xp = xp + _xp WHERE user_id = _user_id;
        RETURN;
    END IF;

    -- Se tem personagem ativo, processa o XP nele
    SELECT xp, level, xp_to_next INTO current_xp, current_level, current_xp_to_next 
    FROM public.characters WHERE id = active_char_id;

    current_xp := current_xp + _xp;

    -- Lógica simples de level up
    WHILE current_xp >= current_xp_to_next LOOP
        current_level := current_level + 1;
        current_xp_to_next := current_xp_to_next + 1000;
    END LOOP;

    UPDATE public.characters 
    SET xp = current_xp, level = current_level, xp_to_next = current_xp_to_next 
    WHERE id = active_char_id;
    
    -- Opcional: Manter o XP do perfil global sincronizado com o total para não quebrar rankings antigos
    UPDATE public.profiles SET xp = xp + _xp WHERE user_id = _user_id;
END;
$$;
