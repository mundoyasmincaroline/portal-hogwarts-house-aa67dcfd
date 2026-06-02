-- user_badges FK -> badges (idempotente)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='user_badges_badge_id_fkey') THEN
    ALTER TABLE public.user_badges
      ADD CONSTRAINT user_badges_badge_id_fkey
      FOREIGN KEY (badge_id) REFERENCES public.badges(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Remove duplicates first
DELETE FROM public.user_badges a USING public.user_badges b
  WHERE a.ctid < b.ctid AND a.user_id = b.user_id AND a.badge_id = b.badge_id;
DELETE FROM public.user_stickers a USING public.user_stickers b
  WHERE a.ctid < b.ctid AND a.user_id = b.user_id AND a.sticker_id = b.sticker_id;

CREATE UNIQUE INDEX IF NOT EXISTS user_badges_user_badge_unique ON public.user_badges(user_id, badge_id);
CREATE UNIQUE INDEX IF NOT EXISTS user_stickers_user_sticker_unique ON public.user_stickers(user_id, sticker_id);

-- Sanitize characters before CHECK
UPDATE public.characters SET hp = max_hp WHERE hp > max_hp;
UPDATE public.characters SET hp = 0 WHERE hp < 0;
UPDATE public.characters SET xp = 0 WHERE xp < 0;
UPDATE public.characters SET level = 1 WHERE level < 1;
UPDATE public.characters SET school_year = LEAST(GREATEST(school_year,1),7) WHERE school_year NOT BETWEEN 1 AND 7;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='characters_hp_check') THEN
    ALTER TABLE public.characters ADD CONSTRAINT characters_hp_check CHECK (hp >= 0 AND hp <= max_hp);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='characters_xp_check') THEN
    ALTER TABLE public.characters ADD CONSTRAINT characters_xp_check CHECK (xp >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='characters_level_check') THEN
    ALTER TABLE public.characters ADD CONSTRAINT characters_level_check CHECK (level >= 1);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='characters_school_year_check') THEN
    ALTER TABLE public.characters ADD CONSTRAINT characters_school_year_check CHECK (school_year BETWEEN 1 AND 7);
  END IF;
END $$;

UPDATE public.duels SET challenger_hp = 0 WHERE challenger_hp < 0;
UPDATE public.duels SET opponent_hp = 0 WHERE opponent_hp < 0;
UPDATE public.duels SET status = 'ongoing' WHERE status NOT IN ('ongoing','finished','abandoned');

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='duels_hp_check') THEN
    ALTER TABLE public.duels ADD CONSTRAINT duels_hp_check CHECK (challenger_hp >= 0 AND opponent_hp >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='duels_status_check') THEN
    ALTER TABLE public.duels ADD CONSTRAINT duels_status_check CHECK (status IN ('ongoing','finished','abandoned'));
  END IF;
END $$;

DELETE FROM public.friendships WHERE user_id = friend_id;
UPDATE public.friendships SET status = 'pending' WHERE status NOT IN ('pending','accepted','blocked');

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='friendships_status_check') THEN
    ALTER TABLE public.friendships ADD CONSTRAINT friendships_status_check CHECK (status IN ('pending','accepted','blocked'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='friendships_no_self') THEN
    ALTER TABLE public.friendships ADD CONSTRAINT friendships_no_self CHECK (user_id <> friend_id);
  END IF;
END $$;