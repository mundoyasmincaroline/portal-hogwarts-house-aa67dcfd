
-- 1) Resolver ambiguidade da award_xp_action (existem duas versões)
DROP FUNCTION IF EXISTS public.award_xp_action(text, uuid, integer);

-- 2) Trigger genérica: estampa character_id a partir do personagem ativo do autor
CREATE OR REPLACE FUNCTION public.stamp_active_character()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.character_id IS NULL AND NEW.user_id IS NOT NULL THEN
    SELECT active_character_id INTO NEW.character_id
    FROM public.profiles
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- 3) Aplicar nas três superfícies sociais
DROP TRIGGER IF EXISTS trg_stamp_char_posts ON public.posts;
CREATE TRIGGER trg_stamp_char_posts
  BEFORE INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.stamp_active_character();

DROP TRIGGER IF EXISTS trg_stamp_char_messages ON public.messages;
CREATE TRIGGER trg_stamp_char_messages
  BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.stamp_active_character();

DROP TRIGGER IF EXISTS trg_stamp_char_comments ON public.post_comments;
CREATE TRIGGER trg_stamp_char_comments
  BEFORE INSERT ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.stamp_active_character();

-- 4) Sincronizar profile.house com a casa do personagem ativo
CREATE OR REPLACE FUNCTION public.sync_profile_house_from_active_char()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_house text;
BEGIN
  IF NEW.active_character_id IS DISTINCT FROM OLD.active_character_id
     AND NEW.active_character_id IS NOT NULL THEN
    SELECT house::text INTO v_house FROM public.characters WHERE id = NEW.active_character_id;
    IF v_house IS NOT NULL THEN
      NEW.house := v_house::public.house_type;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_house_from_active_char ON public.profiles;
CREATE TRIGGER trg_sync_house_from_active_char
  BEFORE UPDATE OF active_character_id ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_house_from_active_char();
