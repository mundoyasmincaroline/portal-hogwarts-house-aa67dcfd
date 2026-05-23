-- 1. Atualizar award_xp_action para suportar XP negativo (deduções)
CREATE OR REPLACE FUNCTION public.award_xp_action(_action TEXT, _user_id UUID, _xp INTEGER)
RETURNS VOID AS $$
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
  -- Profile + check
  SELECT house, xp, level, xp_to_next INTO user_house, current_xp, current_level, current_xp_to_next
  FROM public.profiles WHERE user_id = _user_id;
  
  IF user_house IS NULL THEN RETURN; END IF;

  -- Se for XP negativo (dedução), não aplica cooldown nem tetos, apenas reduz
  IF _xp < 0 THEN
    new_xp := current_xp + _xp;
    
    -- Se XP ficar negativo, reduz nível se possível ou trava em 0
    WHILE new_xp < 0 AND current_level > 1 LOOP
      current_level := current_level - 1;
      new_xp_to_next := 100 + (current_level * 50);
      new_xp := new_xp + new_xp_to_next;
    END LOOP;
    
    IF new_xp < 0 THEN new_xp := 0; END IF;
    
    UPDATE public.profiles
    SET xp = new_xp, level = current_level, updated_at = now()
    WHERE user_id = _user_id;
    
    RETURN;
  END IF;

  -- Se XP for 0, não faz nada
  IF _xp = 0 THEN RETURN; END IF;

  -- --- Lógica Original para XP Positivo (com cooldown e limites) ---

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

  -- Progresso em desafios ativos
  FOR ch IN
    SELECT c.id, c.xp_reward, c.goal, c.title
    FROM public.challenges c
    WHERE c.active = true AND c.action_type = _action
  LOOP
    INSERT INTO public.user_challenges (user_id, challenge_id, progress, status, completed)
    VALUES (_user_id, ch.id, 0, 'pending', false)
    ON CONFLICT DO NOTHING;

    SELECT COALESCE(progress,0) INTO new_progress
    FROM public.user_challenges
    WHERE user_id = _user_id AND challenge_id = ch.id AND completed = false;

    IF new_progress IS NULL THEN CONTINUE; END IF;
    new_progress := new_progress + 1;

    IF new_progress >= COALESCE(ch.goal,1) THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Criar função award_galeons
CREATE OR REPLACE FUNCTION public.award_galeons(_user_id UUID, _amount INTEGER, _reason TEXT DEFAULT 'Sem motivo especificado')
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET galeons = COALESCE(galeons, 0) + _amount,
      updated_at = now()
  WHERE user_id = _user_id;

  -- Opcional: Logar a transação se houver tabela de logs financeiros
  -- INSERT INTO public.financial_logs (user_id, amount, reason) VALUES (_user_id, _amount, _reason);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar função buy_store_item para compra atômica
CREATE OR REPLACE FUNCTION public.buy_store_item(_user_id UUID, _item_id UUID)
RETURNS JSONB AS $$
DECLARE
  item_price INTEGER;
  item_name TEXT;
  user_balance INTEGER;
  item_xp_reward INTEGER;
  item_effects JSONB;
BEGIN
  -- Buscar dados do item
  SELECT price_galeons, name, effects INTO item_price, item_name, item_effects
  FROM public.store_items WHERE id = _item_id AND is_active = true;
  
  IF item_price IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Item não encontrado ou inativo');
  END IF;

  -- Buscar saldo do usuário
  SELECT galeons INTO user_balance FROM public.profiles WHERE user_id = _user_id;
  
  IF user_balance < item_price THEN
    RETURN jsonb_build_object('success', false, 'message', 'Saldo de Galeões insuficiente');
  END IF;

  -- Verificar se já possui o item (opcional, dependendo se o item é consumível)
  IF EXISTS (SELECT 1 FROM public.user_items WHERE user_id = _user_id AND item_id = _item_id) THEN
    -- Alguns itens podem ser comprados várias vezes, outros não. 
    -- Para Hogwarts House, assumimos que itens da loja são únicos no inventário.
    RETURN jsonb_build_object('success', false, 'message', 'Você já possui este item');
  END IF;

  -- TUDO OK: Realizar a transação atômica
  
  -- 1. Deduzir saldo
  UPDATE public.profiles SET galeons = galeons - item_price, updated_at = now() WHERE user_id = _user_id;
  
  -- 2. Inserir no inventário
  INSERT INTO public.user_items (user_id, item_id, acquired_at)
  VALUES (_user_id, _item_id, now());

  -- 3. Aplicar efeitos imediatos (como XP reward se houver)
  IF item_effects ? 'xp_reward' THEN
    item_xp_reward := (item_effects->>'xp_reward')::INTEGER;
    PERFORM public.award_xp_action('store_purchase', _user_id, item_xp_reward);
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Compra realizada com sucesso!');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
