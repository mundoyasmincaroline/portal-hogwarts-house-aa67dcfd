
DROP POLICY IF EXISTS "Service role can insert" ON public.moderation_log;
-- Apenas triggers SECURITY DEFINER conseguem inserir; usuários autenticados não inserem direto.
CREATE POLICY "Admins can insert moderation log" ON public.moderation_log
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
