-- CORREÇÃO COMPREENSIVA DE RLS PARA PERSONAGENS E STORAGE
-- Este script garante que usuários possam criar fichas e fazer upload de fotos.

-- 1. Tabela de Personagens (characters)
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Anyone can view characters" ON public.characters;
DROP POLICY IF EXISTS "Users can create own characters" ON public.characters;
DROP POLICY IF EXISTS "Users can update own characters" ON public.characters;
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
-- Caso não exista, criamos a estrutura básica
CREATE TABLE IF NOT EXISTS public.canon_claims (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
    canon_name TEXT NOT NULL UNIQUE,
    claimed_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.canon_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view canon claims" ON public.canon_claims;
DROP POLICY IF EXISTS "Users can claim canons" ON public.canon_claims;

CREATE POLICY "Anyone can view canon claims"
ON public.canon_claims FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can claim canons"
ON public.canon_claims FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = claimed_by);


-- 3. Permissão para atualizar o active_character_id no perfil
-- Essencial para o fluxo de "Assumir Turno" funcionar
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- 4. Storage (Bucket avatars)
-- Garante que o usuário possa subir fotos na pasta user_id/characters/
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Admins can manage storage" ON storage.objects;
CREATE POLICY "Admins can manage storage"
ON storage.objects FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
