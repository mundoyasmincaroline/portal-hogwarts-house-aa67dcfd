-- 1. Atualizar o trigger de novo usuário para definir approved = false por padrão
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  default_house text;
BEGIN
  default_house := COALESCE(new.raw_user_meta_data->>'house', 'gryffindor');
  
  INSERT INTO public.profiles (
    user_id, 
    full_name, 
    username, 
    age, 
    house, 
    approved,
    level,
    xp,
    xp_to_next
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE((new.raw_user_meta_data->>'age')::integer, 13),
    default_house,
    false, -- <--- MODIFICADO: Agora entra como pendente por padrão
    1,
    0,
    100
  );
  RETURN new;
END;
$function$;

-- 2. Criar a conta de Anita Potter se não existir (aprovada)
DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'anita@hogwarts.local') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
      recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', 'anita@hogwarts.local', 
      crypt('anitapotter123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', 
      '{"full_name":"Anita Potter","username":"anitapotter","age":15,"house":"gryffindor"}', 
      now(), now(), '', '', '', ''
    );
    
    INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (new_user_id, new_user_id, format('{"sub":"%s","email":"anita@hogwarts.local"}', new_user_id)::jsonb, 'email', now(), now(), now());
    
    -- O trigger criará o perfil com approved = false, então vamos atualizar
    UPDATE public.profiles SET approved = true WHERE email = 'anita@hogwarts.local' OR user_id = new_user_id;
  END IF;
END $$;

-- 3. Reduzir XP do usuário de teste (de 10000 para 100)
UPDATE public.profiles SET xp = 100 WHERE xp >= 10000;

-- 4. Adicionar figurinhas oficiais (Stickers)
-- Limpa a tabela se você quiser zerar, mas por segurança usaremos upsert ou insert se não existir
INSERT INTO public.stickers (character_name, rarity, level_required, image_url)
VALUES 
  ('Harry Potter', 'gold', 1, 'https://i.pinimg.com/736x/87/44/2c/87442c5b4e3962d3a3d5e21fb5c1be7f.jpg'),
  ('Hermione Granger', 'gold', 1, 'https://i.pinimg.com/736x/cb/dc/01/cbdc01257afaf792982d61994fb9535c.jpg'),
  ('Ronald Weasley', 'silver', 1, 'https://i.pinimg.com/736x/60/a6/5c/60a65cc24e6c3be5b07842c94301540a.jpg'),
  ('Alvo Dumbledore', 'gold', 2, 'https://i.pinimg.com/736x/ea/b3/f5/eab3f510cd56930268a7bce3bdf6fb19.jpg'),
  ('Severo Snape', 'silver', 2, 'https://i.pinimg.com/736x/a2/11/49/a21149d564ce82ec05f013d18cbf5dc6.jpg'),
  ('Lord Voldemort', 'gold', 3, 'https://i.pinimg.com/736x/8f/3e/2a/8f3e2ac2b2b1ff958742d1f9cc18bb81.jpg'),
  ('Draco Malfoy', 'silver', 1, 'https://i.pinimg.com/736x/c5/4d/e9/c54de93b95a892972ee78363385cc114.jpg'),
  ('Sirius Black', 'bronze', 2, 'https://i.pinimg.com/736x/cd/e0/75/cde075ba5ba92f02540b6183e8cf4f36.jpg'),
  ('Rúbeo Hagrid', 'bronze', 1, 'https://i.pinimg.com/736x/43/6d/83/436d837f59d571871f37e42d763edc7d.jpg'),
  ('Dobby', 'bronze', 1, 'https://i.pinimg.com/736x/55/ca/cc/55cacc688225c50c53443a0e3c544e87.jpg');

-- 5. Adicionar coluna spotify_uri na tabela insta_posts (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='insta_posts' AND column_name='spotify_uri'
  ) THEN
    ALTER TABLE public.insta_posts ADD COLUMN spotify_uri text;
  END IF;
END $$;
