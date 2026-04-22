-- 🛡️ SETUP YASMIN ADMIN
-- Garante que a Yasmin Caroline tenha acesso completo ao painel Revolution e Admin

DO $$
DECLARE
    yasmin_user_id UUID;
BEGIN
    -- Busca por username que contenha 'yasmin'
    SELECT user_id INTO yasmin_user_id 
    FROM public.profiles 
    WHERE username ILIKE '%yasmin%' 
    LIMIT 1;

    IF yasmin_user_id IS NOT NULL THEN
        -- Garantir Role de Admin
        INSERT INTO public.user_roles (user_id, role)
        VALUES (yasmin_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;

        -- Marcar perfil como aprovado
        UPDATE public.profiles 
        SET approved = true 
        WHERE user_id = yasmin_user_id;

        RAISE NOTICE 'Acesso de Admin concedido para Yasmin (ID: %)', yasmin_user_id;
    ELSE
        RAISE NOTICE 'Perfil da Yasmin não encontrado. Verifique o username.';
    END IF;
END $$;
