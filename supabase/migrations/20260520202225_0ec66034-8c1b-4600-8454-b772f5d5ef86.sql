-- 1. search_path para funções (Linter Warn 0011)
ALTER FUNCTION public.award_xp_action SET search_path = public;
ALTER FUNCTION public.calc_blood_status SET search_path = public;

-- 2. RLS para couples
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver casais se forem donos de um dos personagens
-- Nota: Como o auth.uid() está na tabela characters, precisamos de uma subquery ou join
CREATE POLICY "Users can view couples they are part of" ON public.couples
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.characters 
    WHERE id IN (character1_id, character2_id) 
    AND user_id = auth.uid()
  )
);

-- 3. Limpeza de sessões órfãs (Manutenção)
-- Se houver perfis sem session_id, inicializar para evitar problemas no pingPresence
UPDATE public.profiles SET current_session_id = gen_random_uuid()::text WHERE current_session_id IS NULL;
