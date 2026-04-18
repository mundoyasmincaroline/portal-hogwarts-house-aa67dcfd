-- 1. Add missing birth_date to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;

-- 2. Insert TikTok Ads
INSERT INTO public.ads (title, image_url, link, active) VALUES
('Novidade Mágica no TikTok', 'https://images.unsplash.com/photo-1618944847023-38aa001235f0?q=80&w=800', 'https://vt.tiktok.com/ZS9Lg7w7LvKtX-I1Xi9/', true),
('Conteúdo Exclusivo', 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=800', 'https://vt.tiktok.com/ZS9LgvRRYDfkD-ldAnM/', true),
('Feitiços em Alta', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800', 'https://vt.tiktok.com/ZS9Lgvj2XxtfV-7Q1j9/', true),
('Mistérios do Castelo', 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=800', 'https://vt.tiktok.com/ZS9LgvSvPQEHW-Sx8aD/', true),
('Descubra no TikTok', 'https://images.unsplash.com/photo-1474366521946-c3d4b507abf2?q=80&w=800', 'https://vt.tiktok.com/ZS9LgvmSdGCuq-2Piqk/', true);

-- 3. Create Birthdays Table (if not exists)
CREATE TABLE IF NOT EXISTS public.characters_birthdays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  house TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Insert Birthdays
INSERT INTO public.characters_birthdays (name, birth_date, house) VALUES
('Harry Potter', '1980-07-31', 'gryffindor'),
('Hermione Granger', '1979-09-19', 'gryffindor'),
('Ron Weasley', '1980-03-01', 'gryffindor'),
('Draco Malfoy', '1980-06-05', 'slytherin'),
('Luna Lovegood', '1981-02-13', 'ravenclaw'),
('Neville Longbottom', '1980-07-30', 'gryffindor'),
('Ginny Weasley', '1981-08-11', 'gryffindor'),
('Fred Weasley', '1978-04-01', 'gryffindor'),
('George Weasley', '1978-04-01', 'gryffindor')
ON CONFLICT DO NOTHING;

-- 5. Create special Event Badge
INSERT INTO public.badges (name, description, icon, xp_required) VALUES
('Evento de Aniversário', 'Participou do grande banquete temático!', '??', 0)
ON CONFLICT DO NOTHING;
