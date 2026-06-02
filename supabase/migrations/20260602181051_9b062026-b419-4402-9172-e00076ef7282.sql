-- Fase 1: Coluna has_seen_intro e trigger de badges
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_seen_intro BOOLEAN NOT NULL DEFAULT false;

-- Trigger que concede badges automaticamente quando o XP/level do perfil muda
DROP TRIGGER IF EXISTS trg_award_badges_on_xp ON public.profiles;
CREATE TRIGGER trg_award_badges_on_xp
AFTER INSERT OR UPDATE OF xp, level ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.award_badges_on_xp();