-- 1. Adicionar colunas de tracking nos desafios
ALTER TABLE public.challenges 
  ADD COLUMN IF NOT EXISTS action_type TEXT,
  ADD COLUMN IF NOT EXISTS goal INTEGER DEFAULT 1;

-- 2. Função central: concede XP respeitando cooldown e teto por minuto, sobe de nível, dá pontos pra casa, e progride desafios
CREATE OR REPLACE FUNCTION public.award_xp_action(
  _user_id UUID,
  _action TEXT,
  _xp INTEGER
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_house house_type;
  current_xp INTEGER;
  current_level INTEGER;
  current_xp_to_next INTEGER;
  new_xp INTEGER;
  new_level INTEGER;
  new_xp_to_next INTEGER;
  cooldown_col TEXT;
  last_action TIMESTAMPTZ;
  minute_xp INTEGER;
  minute_start TIMESTAMPTZ;
  ch RECORD;
  new_progress INTEGER;
BEGIN
  -- Profile + cooldown
  SELECT house, xp, level, xp_to_next INTO user_house, current_xp, current_level, current_xp_to_next
  FROM public.profiles WHERE user_id = _user_id;
  IF user_house IS NULL THEN RETURN; END IF;

  -- Garante registro de cooldown
  INSERT INTO public.user_cooldowns (user_id, minute_started_at, xp_gained_this_minute)
  VALUES (_user_id, now(), 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Reset de janela de 1 minuto
  SELECT minute_started_at, COALESCE(xp_gained_this_minute,0)
    INTO minute_start, minute_xp
  FROM public.user_cooldowns WHERE user_id = _user_id;

  IF minute_start IS NULL OR now() - minute_start > interval '1 minute' THEN
    UPDATE public.user_cooldowns SET minute_started_at = now(), xp_gained_this_minute = 0
    WHERE user_id = _user_id;
    minute_xp := 0;
  END IF;

  -- Cooldown por tipo de ação (30s)
  cooldown_col := CASE _action
    WHEN 'post' THEN 'last_post_at'
    WHEN 'message' THEN 'last_message_at'
    WHEN 'reaction' THEN 'last_reaction_at'
    ELSE NULL END;

  IF cooldown_col IS NOT NULL THEN
    EXECUTE format('SELECT %I FROM public.user_cooldowns WHERE user_id = $1', cooldown_col)
      INTO last_action USING _user_id;
    IF last_action IS NOT NULL AND now() - last_action < interval '30 seconds' THEN
      RETURN; -- ignorou: muito rápido
    END IF;
    EXECUTE format('UPDATE public.user_cooldowns SET %I = now(), updated_at = now() WHERE user_id = $1', cooldown_col)
      USING _user_id;
  END IF;

  -- Teto: 30 XP por minuto
  IF minute_xp >= 30 THEN RETURN; END IF;
  IF minute_xp + _xp > 30 THEN _xp := 30 - minute_xp; END IF;
  IF _xp <= 0 THEN RETURN; END IF;

  -- Atualiza acumulador do minuto
  UPDATE public.user_cooldowns
    SET xp_gained_this_minute = COALESCE(xp_gained_this_minute,0) + _xp, updated_at = now()
    WHERE user_id = _user_id;

  -- Aplica XP / level up
  new_xp := current_xp + _xp;
  new_level := current_level;
  new_xp_to_next := current_xp_to_next;
  WHILE new_xp >= new_xp_to_next LOOP
    new_xp := new_xp - new_xp_to_next;
    new_level := new_level + 1;
    new_xp_to_next := 100 + (new_level * 50);
  END LOOP;

  UPDATE public.profiles
    SET xp = new_xp, level = new_level, xp_to_next = new_xp_to_next, updated_at = now()
    WHERE user_id = _user_id;

  -- Pontos para a casa
  INSERT INTO public.house_points (house, points, reason, awarded_by)
  VALUES (user_house, _xp, 'Ação automática: ' || _action, _user_id);

  -- Progresso em desafios ativos do mesmo tipo de ação
  FOR ch IN
    SELECT c.id, c.xp_reward, c.goal, c.title
    FROM public.challenges c
    WHERE c.active = true AND c.action_type = _action
  LOOP
    -- Garante registro
    INSERT INTO public.user_challenges (user_id, challenge_id, progress, status, completed)
    VALUES (_user_id, ch.id, 0, 'pending', false)
    ON CONFLICT DO NOTHING;

    -- Pega progresso atual
    SELECT COALESCE(progress,0) INTO new_progress
    FROM public.user_challenges
    WHERE user_id = _user_id AND challenge_id = ch.id AND completed = false;

    IF new_progress IS NULL THEN CONTINUE; END IF;

    new_progress := new_progress + 1;

    IF new_progress >= COALESCE(ch.goal,1) THEN
      -- Completou: marca, dá XP de recompensa
      UPDATE public.user_challenges
        SET progress = ch.goal, status = 'approved', completed = true, completed_at = now()
        WHERE user_id = _user_id AND challenge_id = ch.id AND completed = false;

      UPDATE public.profiles SET xp = xp + ch.xp_reward, updated_at = now() WHERE user_id = _user_id;
      INSERT INTO public.house_points (house, points, reason, awarded_by)
      VALUES (user_house, ch.xp_reward, 'Desafio: ' || ch.title, _user_id);
      INSERT INTO public.notifications (user_id, title, message)
      VALUES (_user_id, '🏆 Desafio concluído!', 'Você completou: ' || ch.title || ' (+' || ch.xp_reward || ' XP)');
    ELSE
      UPDATE public.user_challenges
        SET progress = new_progress
        WHERE user_id = _user_id AND challenge_id = ch.id AND completed = false;
    END IF;
  END LOOP;
END;
$$;

-- 3. Garantir UNIQUE em user_cooldowns(user_id) para o ON CONFLICT funcionar
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_cooldowns_user_id_key'
  ) THEN
    ALTER TABLE public.user_cooldowns ADD CONSTRAINT user_cooldowns_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 4. Garantir UNIQUE em user_challenges(user_id, challenge_id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_challenges_user_challenge_key'
  ) THEN
    ALTER TABLE public.user_challenges ADD CONSTRAINT user_challenges_user_challenge_key UNIQUE (user_id, challenge_id);
  END IF;
END $$;

-- 5. Triggers em cada tabela de ação
CREATE OR REPLACE FUNCTION public.trg_award_post() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.award_xp_action(NEW.user_id, 'post', 10); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.trg_award_comment() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.award_xp_action(NEW.user_id, 'comment', 5); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.trg_award_message() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.award_xp_action(NEW.user_id, 'message', 2); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.trg_award_reaction() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.award_xp_action(NEW.user_id, 'reaction', 1); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.trg_award_story() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.award_xp_action(NEW.user_id, 'story', 8); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.trg_award_insta() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.award_xp_action(NEW.user_id, 'post', 10); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS award_xp_on_post ON public.posts;
CREATE TRIGGER award_xp_on_post AFTER INSERT ON public.posts FOR EACH ROW EXECUTE FUNCTION public.trg_award_post();

DROP TRIGGER IF EXISTS award_xp_on_comment ON public.post_comments;
CREATE TRIGGER award_xp_on_comment AFTER INSERT ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.trg_award_comment();

DROP TRIGGER IF EXISTS award_xp_on_message ON public.messages;
CREATE TRIGGER award_xp_on_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.trg_award_message();

DROP TRIGGER IF EXISTS award_xp_on_chat_message ON public.chat_messages;
CREATE TRIGGER award_xp_on_chat_message AFTER INSERT ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION public.trg_award_message();

DROP TRIGGER IF EXISTS award_xp_on_reaction ON public.post_reactions;
CREATE TRIGGER award_xp_on_reaction AFTER INSERT ON public.post_reactions FOR EACH ROW EXECUTE FUNCTION public.trg_award_reaction();

DROP TRIGGER IF EXISTS award_xp_on_story ON public.stories;
CREATE TRIGGER award_xp_on_story AFTER INSERT ON public.stories FOR EACH ROW EXECUTE FUNCTION public.trg_award_story();

DROP TRIGGER IF EXISTS award_xp_on_insta ON public.insta_posts;
CREATE TRIGGER award_xp_on_insta AFTER INSERT ON public.insta_posts FOR EACH ROW EXECUTE FUNCTION public.trg_award_insta();