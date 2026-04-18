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

-- Basic RLS
ALTER TABLE public.stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stickers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stickers are viewable by everyone" ON public.stickers FOR SELECT USING (true);
CREATE POLICY "Users can view own stickers" ON public.user_stickers FOR SELECT USING (true);
CREATE POLICY "Users can insert own stickers" ON public.user_stickers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Insert initial stickers
INSERT INTO public.stickers (character_name, rarity, level_required, image_url) VALUES
('Harry Potter', 'gold', 10, 'https://images.unsplash.com/photo-1544463403-f11dd252cbe9?w=400'),
('Hermione Granger', 'silver', 5, 'https://images.unsplash.com/photo-1579781403261-fcfcb16e14fb?w=400'),
('Ron Weasley', 'bronze', 1, 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?w=400'),
('Albus Dumbledore', 'gold', 20, 'https://images.unsplash.com/photo-1618944847023-38aa001235f0?w=400'),
('Draco Malfoy', 'silver', 5, 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400'),
('Neville Longbottom', 'bronze', 1, 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400')
ON CONFLICT DO NOTHING;
