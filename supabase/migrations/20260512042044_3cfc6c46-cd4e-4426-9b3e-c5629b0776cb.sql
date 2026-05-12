-- ═══════════════════════════════════════════════════════════
-- GENEALOGIA: árvore familiar + cálculo automático de sangue
-- ═══════════════════════════════════════════════════════════

-- 1. Colunas de parentesco (auto-referência em characters)
ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS mother_id uuid REFERENCES public.characters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS father_id uuid REFERENCES public.characters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS blood_locked boolean NOT NULL DEFAULT false;

-- blood_locked = true quando o usuário fixou manualmente (canon ou escolha consciente)
-- blood_locked = false → recalculado automaticamente a partir dos pais

CREATE INDEX IF NOT EXISTS idx_characters_mother ON public.characters(mother_id);
CREATE INDEX IF NOT EXISTS idx_characters_father ON public.characters(father_id);

-- 2. Função: calcula sangue de um personagem a partir dos pais
-- Regras (universo HP):
--   pure + pure          → pure-blood
--   pure + half          → half-blood
--   pure + muggle/muggle-born → half-blood
--   half + qualquer      → half-blood
--   muggle-born + muggle-born → muggle-born
--   muggle + muggle      → muggle (squib se mágico nasce)
--   um pai conhecido apenas → herda dele
--   nenhum pai           → mantém valor atual (ou NULL)
CREATE OR REPLACE FUNCTION public.calc_blood_status(_mother_id uuid, _father_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  m text;
  f text;
  pair text;
BEGIN
  IF _mother_id IS NULL AND _father_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT blood_status INTO m FROM public.characters WHERE id = _mother_id;
  SELECT blood_status INTO f FROM public.characters WHERE id = _father_id;

  -- normaliza
  m := lower(COALESCE(m, ''));
  f := lower(COALESCE(f, ''));

  -- só um pai conhecido
  IF m = '' THEN RETURN NULLIF(f, ''); END IF;
  IF f = '' THEN RETURN NULLIF(m, ''); END IF;

  -- ordena par para simplificar lookup
  IF m <= f THEN pair := m || '|' || f; ELSE pair := f || '|' || m; END IF;

  RETURN CASE pair
    WHEN 'pure-blood|pure-blood'      THEN 'pure-blood'
    WHEN 'half-blood|pure-blood'      THEN 'half-blood'
    WHEN 'muggle-born|pure-blood'     THEN 'half-blood'
    WHEN 'muggle|pure-blood'          THEN 'half-blood'
    WHEN 'half-blood|half-blood'      THEN 'half-blood'
    WHEN 'half-blood|muggle-born'     THEN 'half-blood'
    WHEN 'half-blood|muggle'          THEN 'half-blood'
    WHEN 'muggle-born|muggle-born'    THEN 'muggle-born'
    WHEN 'muggle|muggle-born'         THEN 'muggle-born'
    WHEN 'muggle|muggle'              THEN 'muggle'
    ELSE COALESCE(NULLIF(m,''), NULLIF(f,''))
  END;
END;
$$;

-- 3. Trigger: recalcula sangue do personagem ao definir/mudar pais
--    (só se blood_locked = false)
CREATE OR REPLACE FUNCTION public.trg_recalc_blood_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  calc text;
BEGIN
  IF NEW.blood_locked IS TRUE THEN
    RETURN NEW;
  END IF;

  IF NEW.mother_id IS DISTINCT FROM OLD.mother_id
     OR NEW.father_id IS DISTINCT FROM OLD.father_id
     OR (TG_OP = 'INSERT' AND (NEW.mother_id IS NOT NULL OR NEW.father_id IS NOT NULL)) THEN
    calc := public.calc_blood_status(NEW.mother_id, NEW.father_id);
    IF calc IS NOT NULL THEN
      NEW.blood_status := calc;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS recalc_blood_on_characters ON public.characters;
CREATE TRIGGER recalc_blood_on_characters
  BEFORE INSERT OR UPDATE OF mother_id, father_id ON public.characters
  FOR EACH ROW EXECUTE FUNCTION public.trg_recalc_blood_status();

-- 4. Trigger reverso: quando um pai/mãe tem o blood_status alterado,
--    recalcula filhos não-locked (cascata para baixo, 1 nível).
CREATE OR REPLACE FUNCTION public.trg_recalc_children_blood()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.blood_status IS DISTINCT FROM OLD.blood_status THEN
    UPDATE public.characters c
    SET blood_status = public.calc_blood_status(c.mother_id, c.father_id)
    WHERE (c.mother_id = NEW.id OR c.father_id = NEW.id)
      AND c.blood_locked = false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS recalc_children_blood ON public.characters;
CREATE TRIGGER recalc_children_blood
  AFTER UPDATE OF blood_status ON public.characters
  FOR EACH ROW EXECUTE FUNCTION public.trg_recalc_children_blood();