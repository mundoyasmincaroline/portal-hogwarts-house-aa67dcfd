-- =========================================
-- FASE 2: ÁLBUM DE FIGURINHAS & ANTI-SPAM
-- =========================================

-- 1. Tabelas do Álbum
CREATE TABLE IF NOT EXISTS public.stickers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_name TEXT NOT NULL,
  rarity TEXT NOT NULL CHECK (rarity IN ('bronze', 'silver', 'gold')),
  image_url TEXT,
  level_required INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_stickers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  sticker_id UUID REFERENCES public.stickers(id) ON DELETE CASCADE,
  obtained_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, sticker_id)
);

ALTER TABLE public.stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stickers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Stickers view" ON public.stickers;
CREATE POLICY "Stickers view" ON public.stickers FOR SELECT USING (true);

DROP POLICY IF EXISTS "User stickers view" ON public.user_stickers;
CREATE POLICY "User stickers view" ON public.user_stickers FOR SELECT USING (true);

DROP POLICY IF EXISTS "User stickers insert" ON public.user_stickers;
CREATE POLICY "User stickers insert" ON public.user_stickers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 2. Inserir Figurinhas Iniciais
INSERT INTO public.stickers (character_name, rarity, level_required, image_url) VALUES
('Harry Potter', 'gold', 10, 'https://images.unsplash.com/photo-1544463403-f11dd252cbe9?w=400'),
('Hermione Granger', 'silver', 5, 'https://images.unsplash.com/photo-1579781403261-fcfcb16e14fb?w=400'),
('Ron Weasley', 'bronze', 1, 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?w=400'),
('Albus Dumbledore', 'gold', 20, 'https://images.unsplash.com/photo-1618944847023-38aa001235f0?w=400'),
('Draco Malfoy', 'silver', 5, 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400'),
('Neville Longbottom', 'bronze', 1, 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400')
ON CONFLICT DO NOTHING;

-- 3. Sistema Anti-Spam (Cooldown de 30s)
CREATE OR REPLACE FUNCTION public.check_spam_cooldown()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $inner$
DECLARE
  last_action TIMESTAMPTZ;
BEGIN
  SELECT MAX(created_at) INTO last_action FROM public.posts WHERE user_id = NEW.user_id;
  IF last_action IS NOT NULL AND (now() - last_action) < interval '30 seconds' THEN
    RAISE EXCEPTION 'Acalme-se, bruxo! Aguarde 30 segundos antes de postar novamente.';
  END IF;
  RETURN NEW;
END;
$inner$;

DROP TRIGGER IF EXISTS tr_check_post_spam ON public.posts;
CREATE TRIGGER tr_check_post_spam
BEFORE INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.check_spam_cooldown();

