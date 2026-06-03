-- Adicionar colunas de varinha à tabela de perfis
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS wand_wood TEXT,
ADD COLUMN IF NOT EXISTS wand_core TEXT;

-- Atualizar a função handle_new_user para capturar esses metadados do ritual
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
    level, xp, xp_to_next, blood_status, avatar_url,
    wand_wood, wand_core
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE((new.raw_user_meta_data->>'age')::integer, 13),
    default_house::public.house_type,
    false, -- Mantemos como falso para auditoria manual
    1, 0, 100,
    new.raw_user_meta_data->>'blood_status',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'wand_wood',
    new.raw_user_meta_data->>'wand_core'
  );
  RETURN new;
END;
$function$;
