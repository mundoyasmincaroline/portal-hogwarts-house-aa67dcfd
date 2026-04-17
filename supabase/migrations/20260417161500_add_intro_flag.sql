ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_seen_intro BOOLEAN DEFAULT false;
