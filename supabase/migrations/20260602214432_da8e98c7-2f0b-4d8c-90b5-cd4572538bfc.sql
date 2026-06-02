-- Phase 20: Endgame

-- 20.A Legendary Prophecies
CREATE TABLE public.legendary_prophecies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  condition_hint TEXT,
  fulfilled BOOLEAN NOT NULL DEFAULT false,
  fulfilled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.legendary_prophecies TO authenticated;
GRANT ALL ON public.legendary_prophecies TO service_role;
ALTER TABLE public.legendary_prophecies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own prophecies" ON public.legendary_prophecies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "create own prophecy" ON public.legendary_prophecies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own prophecy" ON public.legendary_prophecies FOR UPDATE USING (auth.uid() = user_id);

-- 20.B Battle of Hogwarts
CREATE TABLE public.battle_of_hogwarts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'A Batalha de Hogwarts',
  status TEXT NOT NULL DEFAULT 'active', -- active | victory | defeat
  voldemort_max_hp BIGINT NOT NULL DEFAULT 1000000,
  voldemort_hp BIGINT NOT NULL DEFAULT 1000000,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);
GRANT SELECT ON public.battle_of_hogwarts TO anon, authenticated;
GRANT ALL ON public.battle_of_hogwarts TO service_role;
ALTER TABLE public.battle_of_hogwarts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "battle readable" ON public.battle_of_hogwarts FOR SELECT USING (true);

CREATE TABLE public.battle_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID NOT NULL REFERENCES public.battle_of_hogwarts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  total_damage BIGINT NOT NULL DEFAULT 0,
  attacks INT NOT NULL DEFAULT 0,
  last_attack_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(battle_id, user_id)
);
GRANT SELECT ON public.battle_contributions TO anon, authenticated;
GRANT INSERT, UPDATE ON public.battle_contributions TO authenticated;
GRANT ALL ON public.battle_contributions TO service_role;
ALTER TABLE public.battle_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contributions readable" ON public.battle_contributions FOR SELECT USING (true);

-- 20.C Legend / Prestige
CREATE TABLE public.user_legend (
  user_id UUID PRIMARY KEY,
  prestige INT NOT NULL DEFAULT 0,
  legend_title TEXT NOT NULL DEFAULT 'Bruxo Comum',
  ascensions INT NOT NULL DEFAULT 0,
  bonus_xp_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  last_ascended_at TIMESTAMPTZ
);
GRANT SELECT ON public.user_legend TO anon, authenticated;
GRANT INSERT, UPDATE ON public.user_legend TO authenticated;
GRANT ALL ON public.user_legend TO service_role;
ALTER TABLE public.user_legend ENABLE ROW LEVEL SECURITY;
CREATE POLICY "legend readable" ON public.user_legend FOR SELECT USING (true);

-- RPC attack_voldemort
CREATE OR REPLACE FUNCTION public.attack_voldemort(p_battle UUID, p_spell TEXT DEFAULT 'expelliarmus')
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  b public.battle_of_hogwarts;
  uid UUID := auth.uid();
  dmg INT;
  last_at TIMESTAMPTZ;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Sem autenticação'; END IF;
  SELECT * INTO b FROM public.battle_of_hogwarts WHERE id = p_battle FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Batalha não existe'; END IF;
  IF b.status <> 'active' THEN RAISE EXCEPTION 'A batalha já terminou'; END IF;

  SELECT last_attack_at INTO last_at FROM public.battle_contributions WHERE battle_id = p_battle AND user_id = uid;
  IF last_at IS NOT NULL AND now() - last_at < interval '30 seconds' THEN
    RAISE EXCEPTION 'Aguarde antes de atacar novamente';
  END IF;

  dmg := 50 + floor(random()*200)::int;

  UPDATE public.battle_of_hogwarts
     SET voldemort_hp = GREATEST(0, voldemort_hp - dmg)
   WHERE id = p_battle
   RETURNING * INTO b;

  INSERT INTO public.battle_contributions(battle_id, user_id, total_damage, attacks, last_attack_at)
  VALUES (p_battle, uid, dmg, 1, now())
  ON CONFLICT (battle_id, user_id) DO UPDATE
    SET total_damage = battle_contributions.total_damage + dmg,
        attacks = battle_contributions.attacks + 1,
        last_attack_at = now();

  IF b.voldemort_hp = 0 THEN
    UPDATE public.battle_of_hogwarts SET status='victory', ended_at=now() WHERE id = p_battle;
  END IF;

  RETURN jsonb_build_object('damage', dmg, 'hp_left', b.voldemort_hp, 'spell', p_spell);
END $$;

-- RPC ascend_to_legend
CREATE OR REPLACE FUNCTION public.ascend_to_legend()
RETURNS public.user_legend
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  lvl INT;
  r public.user_legend;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Sem autenticação'; END IF;
  SELECT COALESCE(level, 0) INTO lvl FROM public.profiles WHERE user_id = uid;
  IF lvl < 100 THEN RAISE EXCEPTION 'Você precisa atingir o nível 100 para ascender (atual: %)', lvl; END IF;

  INSERT INTO public.user_legend(user_id, prestige, legend_title, ascensions, bonus_xp_multiplier, last_ascended_at)
  VALUES (uid, 1, 'Bruxo Lendário I', 1, 1.1, now())
  ON CONFLICT (user_id) DO UPDATE
    SET prestige = user_legend.prestige + 1,
        ascensions = user_legend.ascensions + 1,
        bonus_xp_multiplier = 1.0 + (user_legend.ascensions + 1) * 0.1,
        legend_title = CASE
          WHEN user_legend.ascensions + 1 >= 5 THEN 'Maior Bruxo de Todos os Tempos'
          WHEN user_legend.ascensions + 1 >= 3 THEN 'Lenda de Hogwarts'
          ELSE 'Bruxo Lendário ' || (user_legend.ascensions + 1)
        END,
        last_ascended_at = now()
  RETURNING * INTO r;

  UPDATE public.profiles
     SET level = 1, xp = 0
   WHERE user_id = uid;

  RETURN r;
END $$;

-- Seed active battle
INSERT INTO public.battle_of_hogwarts(name, voldemort_max_hp, voldemort_hp)
VALUES ('A Batalha Final de Hogwarts', 5000000, 5000000);