-- 1. Cria a Tabela de Amizades
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, friend_id)
);
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- 2. Adiciona a data de aniversário no perfil dos bruxos
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN birth_date DATE;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column birth_date already exists in profiles.';
        WHEN undefined_table THEN RAISE NOTICE 'table profiles does not exist.';
    END;
END $$;

-- 3. Adiciona o termo de aceite de regras obrigatório para novos membros
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN accepted_rules BOOLEAN DEFAULT false;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column accepted_rules already exists in profiles.';
        WHEN undefined_table THEN RAISE NOTICE 'table profiles does not exist.';
    END;
END $$;
