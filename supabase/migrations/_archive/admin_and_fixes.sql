-- 1. Create Ads Table if missing
CREATE TABLE IF NOT EXISTS public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view ads" ON public.ads;
DROP POLICY IF EXISTS "Admins can manage ads" ON public.ads;
CREATE POLICY "Anyone can view ads" ON public.ads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage ads" ON public.ads FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 2. Make User Admin
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'mundoyasmincaroline@gmail.com';
  
  IF target_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Ensure approved
    UPDATE public.profiles SET approved = true WHERE user_id = target_user_id;
  END IF;
END $$;

-- 3. Insert Missing Channels
INSERT INTO public.channels (name, description, category, allowed_houses, is_admin_only) VALUES
('???????????? ???????????????? ? ? °', 'Envie sua ficha pessoal aqui para o portal conhecer você!', 'Fichas', NULL, FALSE),
('???????????? ?????????????????????? ? ? °', 'Envie a ficha do seu personagem do RPG aqui.', 'Fichas', NULL, FALSE)
ON CONFLICT DO NOTHING;

-- 4. Initial Challenges
INSERT INTO public.challenges (title, description, xp_reward, type, active) VALUES
('Primeira Postagem', 'Faça sua primeira postagem no feed do Hogwarts Portal.', 50, 'daily', true),
('Explorador', 'Entre em 3 salas de chat diferentes no castelo.', 100, 'weekly', true),
('Socializador', 'Deixe 5 comentários em posts de outros bruxos.', 80, 'daily', true)
ON CONFLICT DO NOTHING;

-- 5. Fix RLS for Gamification (Allow users to claim rewards via frontend)
DROP POLICY IF EXISTS "Users can claim house points" ON public.house_points;
CREATE POLICY "Users can claim house points" ON public.house_points FOR INSERT TO authenticated WITH CHECK (auth.uid() = awarded_by);

DROP POLICY IF EXISTS "Users can buy badges" ON public.user_badges;
CREATE POLICY "Users can buy badges" ON public.user_badges FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 6. Fix Chats.tsx missing channels (Fichas)
-- (Already covered in step 3 above)
