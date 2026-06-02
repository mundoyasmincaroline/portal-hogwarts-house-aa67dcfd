-- Phase 18: Triwizard trials, ELO ladder, Hall of Fame

CREATE TABLE IF NOT EXISTS public.triwizard_trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trial_type TEXT NOT NULL,
  difficulty INT NOT NULL DEFAULT 1,
  base_reward_galleons INT NOT NULL DEFAULT 100,
  base_reward_xp INT NOT NULL DEFAULT 80,
  order_index INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.triwizard_trials TO anon, authenticated;
GRANT ALL ON public.triwizard_trials TO service_role;
ALTER TABLE public.triwizard_trials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "trials readable" ON public.triwizard_trials;
CREATE POLICY "trials readable" ON public.triwizard_trials FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.trial_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_id UUID NOT NULL REFERENCES public.triwizard_trials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  score INT NOT NULL DEFAULT 0,
  success BOOLEAN NOT NULL DEFAULT false,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.trial_attempts TO authenticated;
GRANT ALL ON public.trial_attempts TO service_role;
ALTER TABLE public.trial_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "attempts readable" ON public.trial_attempts;
CREATE POLICY "attempts readable" ON public.trial_attempts FOR SELECT USING (true);
DROP POLICY IF EXISTS "own attempts" ON public.trial_attempts;
CREATE POLICY "own attempts" ON public.trial_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.duel_elo (
  user_id UUID PRIMARY KEY,
  elo INT NOT NULL DEFAULT 1000,
  wins INT NOT NULL DEFAULT 0,
  losses INT NOT NULL DEFAULT 0,
  streak INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.duel_elo TO anon, authenticated;
GRANT INSERT, UPDATE ON public.duel_elo TO authenticated;
GRANT ALL ON public.duel_elo TO service_role;
ALTER TABLE public.duel_elo ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "elo readable" ON public.duel_elo;
CREATE POLICY "elo readable" ON public.duel_elo FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.hall_of_fame (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  season INT NOT NULL DEFAULT 1,
  score INT NOT NULL DEFAULT 0,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hall_of_fame TO anon, authenticated;
GRANT ALL ON public.hall_of_fame TO service_role;
ALTER TABLE public.hall_of_fame ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hall readable" ON public.hall_of_fame;
CREATE POLICY "hall readable" ON public.hall_of_fame FOR SELECT USING (true);

-- RPC: attempt_trial
CREATE OR REPLACE FUNCTION public.attempt_trial(p_trial UUID)
RETURNS public.trial_attempts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  t public.triwizard_trials;
  roll INT;
  success BOOLEAN;
  s INT;
  r public.trial_attempts;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sem autenticação'; END IF;
  SELECT * INTO t FROM public.triwizard_trials WHERE id = p_trial;
  IF NOT FOUND THEN RAISE EXCEPTION 'Prova não encontrada'; END IF;
  roll := floor(random()*100)::int;
  success := roll > (t.difficulty * 15);
  s := CASE WHEN success THEN t.base_reward_xp + floor(random()*50)::int ELSE floor(random()*20)::int END;
  INSERT INTO public.trial_attempts(trial_id, user_id, score, success)
  VALUES (p_trial, auth.uid(), s, success)
  RETURNING * INTO r;
  RETURN r;
END $$;

-- RPC: finalize_duel_elo (call after a duel match ends; either side can invoke)
CREATE OR REPLACE FUNCTION public.finalize_duel_elo(p_winner UUID, p_loser UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sem autenticação'; END IF;
  IF auth.uid() <> p_winner AND auth.uid() <> p_loser THEN
    RAISE EXCEPTION 'Apenas duelistas podem registrar';
  END IF;
  INSERT INTO public.duel_elo(user_id, elo, wins, streak)
  VALUES (p_winner, 1020, 1, 1)
  ON CONFLICT (user_id) DO UPDATE
     SET elo = duel_elo.elo + 20, wins = duel_elo.wins + 1, streak = duel_elo.streak + 1, updated_at = now();
  INSERT INTO public.duel_elo(user_id, elo, losses, streak)
  VALUES (p_loser, 980, 1, 0)
  ON CONFLICT (user_id) DO UPDATE
     SET elo = GREATEST(0, duel_elo.elo - 20), losses = duel_elo.losses + 1, streak = 0, updated_at = now();
END $$;

-- Seed Triwizard tournament + trials
DO $$
DECLARE tid UUID;
BEGIN
  SELECT id INTO tid FROM public.tournaments WHERE name = 'Torneio Tribruxo — Temporada 1' LIMIT 1;
  IF tid IS NULL THEN
    INSERT INTO public.tournaments(name, description, format, status, max_participants, xp_prize, galeon_prize, starts_at, ends_at)
    VALUES ('Torneio Tribruxo — Temporada 1',
            'As três escolas se reúnem novamente. Que vença o mais corajoso.',
            'triwizard', 'active', 64, 2000, 5000, now(), now() + interval '30 days')
    RETURNING id INTO tid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.triwizard_trials WHERE tournament_id = tid) THEN
    INSERT INTO public.triwizard_trials(tournament_id, name, description, trial_type, difficulty, base_reward_galleons, base_reward_xp, order_index)
    VALUES
      (tid, 'Primeira Tarefa: O Dragão', 'Recupere o ovo dourado guardado pelo Rabo-Córneo-Húngaro.', 'dragon', 2, 200, 150, 1),
      (tid, 'Segunda Tarefa: O Lago Negro', 'Resgate o que lhe é mais precioso das profundezas.', 'lake', 3, 300, 250, 2),
      (tid, 'Tarefa Final: O Labirinto', 'Encontre a Taça Tribruxo no centro do labirinto.', 'maze', 4, 500, 400, 3);
  END IF;
END $$;