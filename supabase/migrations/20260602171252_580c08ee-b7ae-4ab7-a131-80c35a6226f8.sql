
-- Atualiza handle_new_user para incluir blood_status e avatar_url da metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  default_house text;
BEGIN
  default_house := COALESCE(new.raw_user_meta_data->>'house', 'gryffindor');

  INSERT INTO public.profiles (
    user_id, full_name, username, age, house, approved,
    level, xp, xp_to_next, blood_status, avatar_url
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE((new.raw_user_meta_data->>'age')::integer, 13),
    default_house::public.house_type,
    false,
    1, 0, 100,
    new.raw_user_meta_data->>'blood_status',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$function$;

-- CHECK constraints adicionais
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_bio_length_check') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_bio_length_check
      CHECK (bio IS NULL OR length(bio) <= 280);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fichas_status_check') THEN
    ALTER TABLE public.fichas ADD CONSTRAINT fichas_status_check
      CHECK (status IN ('pending','approved','rejected'));
  END IF;
END $$;
