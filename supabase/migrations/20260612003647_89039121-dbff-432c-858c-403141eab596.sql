ALTER PUBLICATION supabase_realtime ADD TABLE public.insta_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.duels;
ALTER TABLE public.insta_posts REPLICA IDENTITY FULL;
ALTER TABLE public.duels REPLICA IDENTITY FULL;