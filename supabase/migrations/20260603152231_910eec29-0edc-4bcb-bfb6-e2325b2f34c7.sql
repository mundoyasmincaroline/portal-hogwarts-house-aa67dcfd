-- RLS for facial-ids bucket
CREATE POLICY "Users can upload their own facial identity" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'facial-ids' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view their own facial identity" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'facial-ids' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own facial identity" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'facial-ids' AND (storage.foldername(name))[1] = auth.uid()::text);