
-- Add house column to stickers for house-exclusive starter sticker logic
ALTER TABLE public.stickers ADD COLUMN IF NOT EXISTS house text;

-- Insert 51 new MQ stickers
INSERT INTO public.stickers (character_name, rarity, image_url, level_required, house) VALUES
('Fred Weasley', 'gold', '/stickers/mq_fred_weasley.jpg', 5, 'gryffindor'),
('George Weasley', 'gold', '/stickers/mq_george_weasley.jpg', 5, 'gryffindor'),
('Ginny Weasley', 'silver', '/stickers/mq_ginny_weasley.jpg', 3, 'gryffindor'),
('Lily Potter', 'gold', '/stickers/mq_lily_potter.jpg', 8, 'gryffindor'),
('James Potter', 'gold', '/stickers/mq_james_potter.jpg', 8, 'gryffindor'),
('Remo Lupin', 'gold', '/stickers/mq_remus_lupin.jpg', 7, 'gryffindor'),
('Arthur Weasley', 'silver', '/stickers/mq_arthur_weasley.jpg', 4, 'gryffindor'),
('Molly Weasley', 'silver', '/stickers/mq_molly_weasley.jpg', 4, 'gryffindor'),
('Godric Gryffindor', 'gold', '/stickers/mq_godric_gryffindor.jpg', 15, 'gryffindor'),
('Percy Weasley', 'bronze', '/stickers/mq_percy_weasley.jpg', 2, 'gryffindor'),
('Simas Finnigan', 'bronze', '/stickers/mq_seamus_finnigan.jpg', 2, 'gryffindor'),
('Dino Thomas', 'bronze', '/stickers/mq_dean_thomas.jpg', 2, 'gryffindor'),
('Lilá Brown', 'bronze', '/stickers/mq_lavanda_brown.jpg', 2, 'gryffindor'),
('Olívio Wood', 'bronze', '/stickers/mq_olivia_wood.jpg', 3, 'gryffindor'),
('Parvati Patil', 'bronze', '/stickers/mq_parvati_patil.jpg', 2, 'gryffindor'),
('Bellatrix Lestrange', 'gold', '/stickers/mq_bellatrix_lestrange.jpg', 8, 'slytherin'),
('Lúcio Malfoy', 'silver', '/stickers/mq_lucius_malfoy.jpg', 5, 'slytherin'),
('Narcisa Malfoy', 'silver', '/stickers/mq_narcisa_malfoy.jpg', 5, 'slytherin'),
('Régulo Black', 'silver', '/stickers/mq_regulus_black.jpg', 4, 'slytherin'),
('Pansy Parkinson', 'bronze', '/stickers/mq_pansy_parkinson.jpg', 2, 'slytherin'),
('Blaise Zabini', 'bronze', '/stickers/mq_blaise_zabini.jpg', 2, 'slytherin'),
('Horácio Slughorn', 'silver', '/stickers/mq_horacio_slughorn.jpg', 6, 'slytherin'),
('Salazar Slytherin', 'gold', '/stickers/mq_salazar_slytherin.jpg', 15, 'slytherin'),
('Tom Riddle', 'gold', '/stickers/mq_tom_riddle.jpg', 10, 'slytherin'),
('Dolores Umbridge', 'silver', '/stickers/mq_dolores_umbridge.jpg', 5, 'slytherin'),
('Pedro Pettigrew', 'silver', '/stickers/mq_peter_pettigrew.jpg', 4, 'slytherin'),
('Cho Chang', 'silver', '/stickers/mq_cho_chang.jpg', 4, 'ravenclaw'),
('Padma Patil', 'bronze', '/stickers/mq_padma_patil.jpg', 2, 'ravenclaw'),
('Gilderoy Lockhart', 'silver', '/stickers/mq_gilderoy_lockhart.jpg', 3, 'ravenclaw'),
('Garrick Olivaras', 'silver', '/stickers/mq_garrick_olivaras.jpg', 6, 'ravenclaw'),
('Rowena Ravenclaw', 'gold', '/stickers/mq_rowena_ravenclaw.jpg', 15, 'ravenclaw'),
('Fílio Flitwick', 'silver', '/stickers/mq_filius_flitwick.jpg', 5, 'ravenclaw'),
('Sibila Trelawney', 'silver', '/stickers/mq_sibila_trelawney.jpg', 4, 'ravenclaw'),
('Xenofílio Lovegood', 'bronze', '/stickers/mq_xenophilius_lovegood.jpg', 3, 'ravenclaw'),
('Michael Corner', 'bronze', '/stickers/mq_michael_corner.jpg', 2, 'ravenclaw'),
('Terêncio Boot', 'bronze', '/stickers/mq_terry_boot.jpg', 2, 'ravenclaw'),
('Cedrico Diggory', 'gold', '/stickers/mq_cedric_diggory.jpg', 8, 'hufflepuff'),
('Ninfadora Tonks', 'silver', '/stickers/mq_nymphadora_tonks.jpg', 5, 'hufflepuff'),
('Pomona Sprout', 'silver', '/stickers/mq_pomona_sprout.jpg', 5, 'hufflepuff'),
('Newt Scamander', 'gold', '/stickers/mq_newt_scamander.jpg', 9, 'hufflepuff'),
('Helga Hufflepuff', 'gold', '/stickers/mq_helga_hufflepuff.jpg', 15, 'hufflepuff'),
('Hannah Abbott', 'bronze', '/stickers/mq_hannah_abbott.jpg', 2, 'hufflepuff'),
('Ernesto MacMillan', 'bronze', '/stickers/mq_ernie_macmillan.jpg', 2, 'hufflepuff'),
('Justino Finch-Fletchley', 'bronze', '/stickers/mq_justin_finch.jpg', 2, 'hufflepuff'),
('Susana Bones', 'bronze', '/stickers/mq_susan_bones.jpg', 2, 'hufflepuff'),
('Zacarias Smith', 'bronze', '/stickers/mq_zacharias_smith.jpg', 2, 'hufflepuff'),
('Gui Weasley', 'silver', '/stickers/mq_gui_weasley.jpg', 5, 'gryffindor'),
('Fleur Delacour', 'silver', '/stickers/mq_fleur_delacour.jpg', 6, NULL),
('Victor Krum', 'silver', '/stickers/mq_viktor_krum.jpg', 6, NULL),
('Olho-Tonto Moody', 'silver', '/stickers/mq_alastor_moody.jpg', 7, NULL),
('Kingsley Shacklebolt', 'gold', '/stickers/mq_kingsley_shacklebolt.jpg', 8, NULL);

-- Function: grant the founder sticker of the user's house
CREATE OR REPLACE FUNCTION public.grant_house_starter_sticker()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sticker_id uuid;
  v_house text;
BEGIN
  v_house := NEW.house::text;
  IF v_house IS NULL THEN RETURN NEW; END IF;

  SELECT id INTO v_sticker_id
  FROM public.stickers
  WHERE house = v_house
    AND character_name IN ('Godric Gryffindor','Salazar Slytherin','Rowena Ravenclaw','Helga Hufflepuff')
  LIMIT 1;

  IF v_sticker_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_stickers
      WHERE user_id = NEW.user_id AND sticker_id = v_sticker_id
    ) THEN
      INSERT INTO public.user_stickers(user_id, sticker_id)
      VALUES (NEW.user_id, v_sticker_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_grant_house_starter ON public.characters;
CREATE TRIGGER trg_grant_house_starter
AFTER INSERT ON public.characters
FOR EACH ROW EXECUTE FUNCTION public.grant_house_starter_sticker();

-- Backfill: every existing character gets their house founder sticker
INSERT INTO public.user_stickers(user_id, sticker_id)
SELECT DISTINCT c.user_id, s.id
FROM public.characters c
JOIN public.stickers s
  ON s.house = c.house::text
 AND s.character_name IN ('Godric Gryffindor','Salazar Slytherin','Rowena Ravenclaw','Helga Hufflepuff')
WHERE c.house IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_stickers us
    WHERE us.user_id = c.user_id AND us.sticker_id = s.id
  );
