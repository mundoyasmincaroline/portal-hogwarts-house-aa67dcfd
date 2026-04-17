ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS accepted_rules BOOLEAN DEFAULT false;
