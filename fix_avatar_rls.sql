-- ============================================================
-- FIX: RLS do bucket "avatars" para uploads de personagens
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- 1. Remove policies existentes do bucket avatars (storage)
DROP POLICY IF EXISTS "Avatar upload for own user" ON storage.objects;
DROP POLICY IF EXISTS "Avatar update for own user" ON storage.objects;
DROP POLICY IF EXISTS "Avatar delete for own user" ON storage.objects;
DROP POLICY IF EXISTS "Avatar select public" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload any avatar" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update any avatar" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete any avatar" ON storage.objects;

-- 2. Leitura pública (qualquer um pode ver as fotos)
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 3. INSERT: usuário autenticado pode fazer upload no próprio diretório
--    OU admins/moderadores podem fazer upload em qualquer diretório
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (
    -- Próprio usuário enviando para seu diretório
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Admin ou moderador pode enviar para qualquer diretório
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'moderator')
    )
  )
);

-- 4. UPDATE: mesmo critério do INSERT
CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'moderator')
    )
  )
);

-- 5. DELETE: mesmo critério
CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'moderator')
    )
  )
);
