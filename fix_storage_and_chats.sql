-- 1. Fix broken characters in Profeta Diário
UPDATE public.channels SET name = 'Profeta Diário' WHERE name LIKE 'Profeta Di%';

-- 2. Add missing birth_date to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;

-- 3. Create Storage Buckets for Photos
INSERT INTO storage.buckets (id, name, public) VALUES 
('avatars', 'avatars', true),
('stories', 'stories', true),
('ads', 'ads', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Users can update avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars');

-- Policies for stories bucket
CREATE POLICY "Story images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'stories');
CREATE POLICY "Users can upload story images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'stories');

-- Policies for ads bucket
CREATE POLICY "Ad images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'ads');
CREATE POLICY "Admins can upload ad images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ads' AND public.has_role(auth.uid(), 'admin'));

