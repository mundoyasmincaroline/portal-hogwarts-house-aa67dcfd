-- CORREÇÃO COMPREENSIVA DE RLS PARA PERSONAGENS E STORAGE (V2)
-- Este script garante que usuários possam criar fichas e fazer upload de fotos.

-- 1. Tabela de Personagens (characters)
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas para evitar conflitos (LIMPEZA COMPLETA)
DROP POLICY IF EXISTS "Anyone can view characters" ON public.characters;
DROP POLICY IF EXISTS "Users can create own characters" ON public.characters;
DROP POLICY IF EXISTS "Users can update own characters" ON public.characters;
DROP POLICY IF EXISTS "Users can delete own characters" ON public.characters;
DROP POLICY IF EXISTS "Admins can manage all characters" ON public.characters;

-- Criar novas políticas
CREATE POLICY "Anyone can view characters"
ON public.characters FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create own characters"
ON public.characters FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own characters"
ON public.characters FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own characters"
ON public.characters FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));


-- 2. Tabela de Reservas de Canon (canon_claims)
ALTER TABLE public.canon_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view canon claims" ON public.canon_claims;
DROP POLICY IF EXISTS "Users can claim canons" ON public.canon_claims;
DROP POLICY IF EXISTS "Admins can manage canon claims" ON public.canon_claims;

CREATE POLICY "Anyone can view canon claims"
ON public.canon_claims FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can claim canons"
ON public.canon_claims FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage canon claims"
ON public.canon_claims FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));


-- 3. Storage (Balde de Avatares)
-- Garantir que o bucket existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all avatars" ON storage.objects;

-- Qualquer um pode ver fotos
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Usuário pode subir fotos para sua própria pasta (ID do usuário)
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Usuário pode atualizar suas próprias fotos
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admin tem poder total sobre as fotos
CREATE POLICY "Admins can manage all avatars"
ON storage.objects FOR ALL
TO authenticated
USING (
    bucket_id = 'avatars' 
    AND public.has_role(auth.uid(), 'admin')
);
