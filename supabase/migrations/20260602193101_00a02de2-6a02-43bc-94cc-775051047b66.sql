GRANT SELECT, INSERT, UPDATE, DELETE ON public.characters TO authenticated;
GRANT ALL ON public.characters TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.canon_claims TO authenticated;
GRANT ALL ON public.canon_claims TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.canon_professors TO authenticated;
GRANT ALL ON public.canon_professors TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professor_lessons TO authenticated;
GRANT ALL ON public.professor_lessons TO service_role;
GRANT SELECT ON public.spells TO authenticated;
GRANT ALL ON public.spells TO service_role;

DROP POLICY IF EXISTS "Admins can create any character" ON public.characters;
CREATE POLICY "Admins can create any character"
ON public.characters
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete canon claims" ON public.canon_claims;
CREATE POLICY "Admins can delete canon claims"
ON public.canon_claims
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));