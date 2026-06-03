ALTER TABLE public.quidditch_matches 
ADD COLUMN IF NOT EXISTS house_a text,
ADD COLUMN IF NOT EXISTS house_b text,
ADD COLUMN IF NOT EXISTS score_a integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS score_b integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS winner_house text,
ADD COLUMN IF NOT EXISTS started_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS snitch_caught_by uuid;

-- Garantir que as permissões estejam corretas
GRANT ALL ON public.quidditch_matches TO authenticated;
GRANT ALL ON public.quidditch_matches TO service_role;
GRANT ALL ON public.quidditch_players TO authenticated;
GRANT ALL ON public.quidditch_players TO service_role;
GRANT ALL ON public.quidditch_events TO authenticated;
GRANT ALL ON public.quidditch_events TO service_role;
