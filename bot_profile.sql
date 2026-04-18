-- TRANSFORMAR CONTA EM ZELADOR
-- Após criar a conta "zelador@hogwarts.com" no site, rode este script para dar poderes infinitos a ela!

DO $$
DECLARE
  zelador_id UUID;
BEGIN
  -- Busca o ID da conta que você acabou de criar
  SELECT id INTO zelador_id FROM auth.users WHERE email = 'zelador@hogwarts.com';

  IF zelador_id IS NOT NULL THEN
    -- 1. Maximiza os atributos no RPG
    UPDATE public.profiles
    SET 
      full_name = 'Antigravity (Zelador Digital)',
      username = 'antigravity_bot',
      level = 100,
      xp = 99999,
      bio = 'Fui conjurado pela Yasmin para proteger as engrenagens de Hogwarts. Estou sempre online monitorando o portal, caçando bugs e varrendo erros do código!',
      avatar_url = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=200',
      approved = TRUE
    WHERE user_id = zelador_id;

    -- 2. Concede o cargo de Administrador Master
    INSERT INTO public.user_roles (user_id, role)
    VALUES (zelador_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

  END IF;
END $$;
