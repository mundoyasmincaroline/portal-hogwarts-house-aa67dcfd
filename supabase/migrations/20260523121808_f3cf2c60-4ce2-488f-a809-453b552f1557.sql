-- 1. EXPANSÃO DE FEITIÇOS (SPELLS)
ALTER TABLE public.spells ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'charm';
ALTER TABLE public.spells ADD COLUMN IF NOT EXISTS xp_required INTEGER DEFAULT 0;
ALTER TABLE public.spells ALTER COLUMN incantation DROP NOT NULL;

INSERT INTO public.spells (name, incantation, description, category, xp_required)
VALUES 
  ('Expelliarmus', 'Expelliarmus', 'Feitiço de desarmamento. O básico de todo bruxo.', 'defensive', 100),
  ('Stupefy', 'Stupefy', 'Estupora o alvo, deixando-o inconsciente.', 'defensive', 500),
  ('Lumos', 'Lumos', 'Cria luz na ponta da varinha.', 'charm', 0),
  ('Alohomora', 'Alohomora', 'Abre portas trancadas.', 'charm', 50),
  ('Wingardium Leviosa', 'Wingardium Leviosa', 'Levita objetos.', 'charm', 50),
  ('Expecto Patronum', 'Expecto Patronum', 'Convoca um Patrono para repelir dementadores.', 'charm', 5000),
  ('Avada Kedavra', 'Avada Kedavra', 'A maldição da morte. Imperdoável.', 'unforgivable', 20000),
  ('Crucio', 'Crucio', 'Maldição da tortura. Imperdoável.', 'unforgivable', 15000),
  ('Imperio', 'Imperio', 'Maldição do controle mental. Imperdoável.', 'unforgivable', 12000),
  ('Sectumsempra', 'Sectumsempra', 'Cria cortes profundos como se fossem espadas.', 'dark_arts', 8000),
  ('Protego', 'Protego', 'Cria um escudo mágico.', 'defensive', 200),
  ('Accio', 'Accio', 'Atrai objetos para o bruxo.', 'charm', 400),
  ('Incendio', 'Incendio', 'Cria fogo.', 'charm', 400),
  ('Aguamenti', 'Aguamenti', 'Cria água.', 'charm', 400),
  ('Petrificus Totalus', 'Petrificus Totalus', 'Paralisa o alvo completamente.', 'jinx', 1000),
  ('Expulso', 'Expulso', 'Cria uma explosão de pressão.', 'hex', 1500),
  ('Confundo', 'Confundo', 'Confunde o alvo.', 'charm', 1500),
  ('Diffindo', 'Diffindo', 'Corta objetos.', 'charm', 400)
ON CONFLICT (name) DO UPDATE SET 
  incantation = EXCLUDED.incantation,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  xp_required = EXCLUDED.xp_required;

-- 2. POPULAÇÃO DO BESTIÁRIO (CREATURES)
CREATE UNIQUE INDEX IF NOT EXISTS creatures_name_idx ON public.creatures (name);

INSERT INTO public.creatures (name, description, habitat, rarity, danger_level)
VALUES 
  ('Dragão Rabo-Córneo Húngaro', 'O mais perigoso de todos os dragões.', 'Montanhas', 'legendary', 5),
  ('Fênix', 'Ave que renasce das cinzas e tem lágrimas curativas.', 'Escritório do Diretor', 'legendary', 4),
  ('Hipogrifo', 'Metade águia, metade cavalo.', 'Floresta Proibida', 'rare', 3),
  ('Testrálio', 'Só visível para quem já viu a morte.', 'Floresta Proibida', 'rare', 3),
  ('Elfo Doméstico', 'Criaturas mágicas que servem bruxos.', 'Cozinhas', 'common', 1),
  ('Basilisco', 'O rei das serpentes. Seu olhar mata.', 'Câmara Secreta', 'legendary', 5),
  ('Acromântula', 'Aranha gigante capaz de falar.', 'Floresta Proibida', 'rare', 4),
  ('Dementador', 'Guardião de Azkaban que drena a felicidade.', 'Azkaban', 'legendary', 5),
  ('Niffler', 'Atraído por tudo que brilha.', 'Cavernas', 'common', 1)
ON CONFLICT (name) DO UPDATE SET 
  description = EXCLUDED.description,
  habitat = EXCLUDED.habitat,
  rarity = EXCLUDED.rarity,
  danger_level = EXCLUDED.danger_level;

-- 3. EVENTOS SAZONAIS (SEASONAL_EVENTS)
CREATE UNIQUE INDEX IF NOT EXISTS seasonal_events_title_idx ON public.seasonal_events (title);

INSERT INTO public.seasonal_events (title, description, start_date, end_date, event_type, house_points_bonus, xp_multiplier)
VALUES 
  ('Copa das Casas', 'O evento principal do ano letivo.', '2026-09-01', '2027-06-30', 'tournament', 500, 1.2),
  ('Festa de Halloween', 'Doces, travessuras e talvez um troll nas masmorras.', '2026-10-25', '2026-11-01', 'holiday', 50, 1.5),
  ('Baile de Inverno', 'Celebração formal e dança.', '2026-12-20', '2027-01-05', 'holiday', 100, 1.5),
  ('Torneio Tribruxo', 'Três campeões, uma Taça Tribruxo.', '2026-11-01', '2027-05-30', 'tournament', 200, 2.0)
ON CONFLICT (title) DO UPDATE SET 
  description = EXCLUDED.description,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  event_type = EXCLUDED.event_type;

-- 4. CATEGORIAS DE LOJA (REMOVENDO CHECK CONSTRAINT PARA FLEXIBILIDADE)
ALTER TABLE public.store_items DROP CONSTRAINT IF EXISTS store_items_category_check;

UPDATE public.store_items SET category = 'olivaras_wand' WHERE category = 'wand';
UPDATE public.store_items SET category = 'malkin_clothing' WHERE category = 'clothing';
UPDATE public.store_items SET category = 'floreios_books' WHERE category IN ('spell', 'potion');
UPDATE public.store_items SET category = 'weasley_jokes' WHERE category = 'accessory';
UPDATE public.store_items SET category = 'borgin_rarities' WHERE rarity = 'legendary' AND category NOT LIKE 'olivaras%';
