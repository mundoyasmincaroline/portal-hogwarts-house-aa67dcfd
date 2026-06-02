-- Phase 21: Lineages

-- 21.A Wizard Families
CREATE TABLE public.wizard_families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  motto TEXT,
  crest_emoji TEXT DEFAULT '⚜️',
  blood_status TEXT NOT NULL DEFAULT 'mestico', -- puro | mestico | trouxa
  founder_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wizard_families TO anon, authenticated;
GRANT INSERT, UPDATE ON public.wizard_families TO authenticated;
GRANT ALL ON public.wizard_families TO service_role;
ALTER TABLE public.wizard_families ENABLE ROW LEVEL SECURITY;
CREATE POLICY "families readable" ON public.wizard_families FOR SELECT USING (true);

CREATE TABLE public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.wizard_families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'membro', -- chefe | membro
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(family_id, user_id),
  UNIQUE(user_id)
);
GRANT SELECT ON public.family_members TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.family_members TO authenticated;
GRANT ALL ON public.family_members TO service_role;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members readable" ON public.family_members FOR SELECT USING (true);

-- 21.B Family Relations (genealogy)
CREATE TABLE public.family_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  related_user_id UUID NOT NULL,
  relation TEXT NOT NULL, -- pai | mae | irmao | filho | padrinho | madrinha | afilhado
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, related_user_id, relation),
  CHECK (user_id <> related_user_id)
);
GRANT SELECT ON public.family_relations TO anon, authenticated;
GRANT INSERT, DELETE ON public.family_relations TO authenticated;
GRANT ALL ON public.family_relations TO service_role;
ALTER TABLE public.family_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "relations readable" ON public.family_relations FOR SELECT USING (true);

-- 21.C Alliances + Inheritances
CREATE TABLE public.magical_alliances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL,
  user_b UUID NOT NULL,
  alliance_type TEXT NOT NULL DEFAULT 'aliado', -- aliado | padrinho | herdeiro
  status TEXT NOT NULL DEFAULT 'pending', -- pending | sealed | broken
  sealed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (user_a <> user_b)
);
GRANT SELECT ON public.magical_alliances TO anon, authenticated;
GRANT INSERT, UPDATE ON public.magical_alliances TO authenticated;
GRANT ALL ON public.magical_alliances TO service_role;
ALTER TABLE public.magical_alliances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alliances visible" ON public.magical_alliances FOR SELECT USING (true);

CREATE TABLE public.inheritances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user UUID NOT NULL,
  to_user UUID NOT NULL,
  item_description TEXT,
  galleons INT NOT NULL DEFAULT 0,
  note TEXT,
  declared_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (from_user <> to_user)
);
GRANT SELECT ON public.inheritances TO anon, authenticated;
GRANT INSERT ON public.inheritances TO authenticated;
GRANT ALL ON public.inheritances TO service_role;
ALTER TABLE public.inheritances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inheritances visible" ON public.inheritances FOR SELECT USING (true);

-- RPCs
CREATE OR REPLACE FUNCTION public.create_family(p_name TEXT, p_motto TEXT, p_blood TEXT, p_crest TEXT)
RETURNS public.wizard_families
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  r public.wizard_families;
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Sem autenticação'; END IF;
  IF EXISTS (SELECT 1 FROM public.family_members WHERE user_id = uid) THEN
    RAISE EXCEPTION 'Você já pertence a uma família';
  END IF;
  INSERT INTO public.wizard_families(name, motto, blood_status, crest_emoji, founder_id)
  VALUES (p_name, p_motto, COALESCE(p_blood,'mestico'), COALESCE(p_crest,'⚜️'), uid)
  RETURNING * INTO r;
  INSERT INTO public.family_members(family_id, user_id, role) VALUES (r.id, uid, 'chefe');
  RETURN r;
END $$;

CREATE OR REPLACE FUNCTION public.join_family(p_family UUID)
RETURNS public.family_members
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  r public.family_members;
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Sem autenticação'; END IF;
  IF EXISTS (SELECT 1 FROM public.family_members WHERE user_id = uid) THEN
    RAISE EXCEPTION 'Você já pertence a uma família';
  END IF;
  INSERT INTO public.family_members(family_id, user_id, role)
  VALUES (p_family, uid, 'membro') RETURNING * INTO r;
  RETURN r;
END $$;

CREATE OR REPLACE FUNCTION public.leave_family()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Sem autenticação'; END IF;
  DELETE FROM public.family_members WHERE user_id = uid;
END $$;

CREATE OR REPLACE FUNCTION public.add_relation(p_related UUID, p_relation TEXT)
RETURNS public.family_relations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  r public.family_relations;
  uid UUID := auth.uid();
  reverse TEXT;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Sem autenticação'; END IF;
  IF uid = p_related THEN RAISE EXCEPTION 'Selecione outro bruxo'; END IF;
  INSERT INTO public.family_relations(user_id, related_user_id, relation)
  VALUES (uid, p_related, p_relation)
  ON CONFLICT DO NOTHING
  RETURNING * INTO r;
  reverse := CASE p_relation
    WHEN 'pai' THEN 'filho' WHEN 'mae' THEN 'filho' WHEN 'filho' THEN 'pai'
    WHEN 'irmao' THEN 'irmao' WHEN 'padrinho' THEN 'afilhado'
    WHEN 'madrinha' THEN 'afilhado' WHEN 'afilhado' THEN 'padrinho'
    ELSE NULL END;
  IF reverse IS NOT NULL THEN
    INSERT INTO public.family_relations(user_id, related_user_id, relation)
    VALUES (p_related, uid, reverse) ON CONFLICT DO NOTHING;
  END IF;
  RETURN r;
END $$;

CREATE OR REPLACE FUNCTION public.propose_alliance(p_other UUID, p_type TEXT)
RETURNS public.magical_alliances
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE r public.magical_alliances; uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Sem autenticação'; END IF;
  INSERT INTO public.magical_alliances(user_a, user_b, alliance_type, status)
  VALUES (uid, p_other, COALESCE(p_type,'aliado'), 'pending') RETURNING * INTO r;
  RETURN r;
END $$;

CREATE OR REPLACE FUNCTION public.accept_alliance(p_alliance UUID)
RETURNS public.magical_alliances
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE a public.magical_alliances; uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Sem autenticação'; END IF;
  SELECT * INTO a FROM public.magical_alliances WHERE id = p_alliance;
  IF NOT FOUND THEN RAISE EXCEPTION 'Aliança inexistente'; END IF;
  IF a.user_b <> uid THEN RAISE EXCEPTION 'Apenas o destinatário pode aceitar'; END IF;
  UPDATE public.magical_alliances SET status = 'sealed', sealed_at = now()
   WHERE id = p_alliance RETURNING * INTO a;
  RETURN a;
END $$;

CREATE OR REPLACE FUNCTION public.declare_inheritance(p_to UUID, p_item TEXT, p_galleons INT, p_note TEXT)
RETURNS public.inheritances
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE r public.inheritances; uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Sem autenticação'; END IF;
  IF p_galleons < 0 THEN RAISE EXCEPTION 'Valor inválido'; END IF;
  INSERT INTO public.inheritances(from_user, to_user, item_description, galleons, note)
  VALUES (uid, p_to, p_item, COALESCE(p_galleons,0), p_note) RETURNING * INTO r;
  RETURN r;
END $$;