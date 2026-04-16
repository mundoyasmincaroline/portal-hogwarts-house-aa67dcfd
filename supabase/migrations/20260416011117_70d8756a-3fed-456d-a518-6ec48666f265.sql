
-- Drop the broad SELECT policy
DROP POLICY "Avatar images are publicly accessible" ON storage.objects;

-- Create a more restrictive SELECT policy (public read by direct URL is still allowed by public bucket, but listing is restricted)
CREATE POLICY "Users can view own avatars" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
