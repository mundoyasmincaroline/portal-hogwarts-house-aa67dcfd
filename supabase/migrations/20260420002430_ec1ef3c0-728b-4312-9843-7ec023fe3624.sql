-- Função que concede badges automaticamente conforme o XP total acumulado
CREATE OR REPLACE FUNCTION public.award_badges_on_xp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_xp INTEGER;
  b RECORD;
BEGIN
  -- XP "total" aproximado: soma dos níveis * 100 + xp atual
  total_xp := COALESCE(NEW.xp, 0) + (COALESCE(NEW.level, 1) - 1) * 100;

  FOR b IN
    SELECT id, name, icon, xp_required
    FROM public.badges
    WHERE COALESCE(xp_required, 0) <= total_xp
      AND id NOT IN (SELECT badge_id FROM public.user_badges WHERE user_id = NEW.user_id)
  LOOP
    INSERT INTO public.user_badges (user_id, badge_id) VALUES (NEW.user_id, b.id);
    INSERT INTO public.notifications (user_id, title, message)
    VALUES (NEW.user_id, '🏅 Nova medalha conquistada!', 'Você desbloqueou: ' || COALESCE(b.icon,'🏅') || ' ' || b.name);
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_badges ON public.profiles;
CREATE TRIGGER trg_award_badges
AFTER UPDATE OF xp, level ON public.profiles
FOR EACH ROW
WHEN (NEW.xp IS DISTINCT FROM OLD.xp OR NEW.level IS DISTINCT FROM OLD.level)
EXECUTE FUNCTION public.award_badges_on_xp();

-- Conceder badges retroativos a quem já tem XP suficiente
INSERT INTO public.user_badges (user_id, badge_id)
SELECT p.user_id, b.id
FROM public.profiles p
CROSS JOIN public.badges b
WHERE (p.xp + (p.level - 1) * 100) >= COALESCE(b.xp_required, 0)
  AND NOT EXISTS (
    SELECT 1 FROM public.user_badges ub
    WHERE ub.user_id = p.user_id AND ub.badge_id = b.id
  );