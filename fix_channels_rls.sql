-- Allow any authenticated user to insert a channel if it doesn't exist
DROP POLICY IF EXISTS "Allow auto insert channels" ON public.channels;
CREATE POLICY "Allow auto insert channels" ON public.channels FOR INSERT TO authenticated WITH CHECK (true);
