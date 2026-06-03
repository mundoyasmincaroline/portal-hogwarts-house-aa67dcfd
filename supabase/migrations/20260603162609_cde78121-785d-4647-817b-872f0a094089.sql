DROP POLICY "Anyone can create a support ticket" ON public.support_tickets;
CREATE POLICY "Authenticated users can create support tickets" 
ON public.support_tickets FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);
GRANT INSERT ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
