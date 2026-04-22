-- 🎮 GAME SESSIONS: MULTIPLAYER TURN SYSTEM
-- Gerencia duelos online entre bruxos

CREATE TABLE IF NOT EXISTS public.game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_type TEXT NOT NULL DEFAULT 'duel',
    player1_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    player2_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    current_turn_id UUID REFERENCES public.profiles(user_id),
    state JSONB NOT NULL DEFAULT '{"player1_hp": 100, "player2_hp": 100, "history": []}',
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
    winner_id UUID REFERENCES public.profiles(user_id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can see game sessions" ON public.game_sessions
    FOR SELECT USING (true);

CREATE POLICY "Players can update their own games" ON public.game_sessions
    FOR UPDATE USING (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Players can insert games" ON public.game_sessions
    FOR INSERT WITH CHECK (auth.uid() = player1_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_game_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_game_sessions_timestamp
    BEFORE UPDATE ON public.game_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_game_sessions_updated_at();

-- Função para processar turno
CREATE OR REPLACE FUNCTION public.process_game_turn(_session_id UUID, _player_id UUID, _move TEXT)
RETURNS VOID AS $$
DECLARE
    session_record RECORD;
    new_state JSONB;
    next_turn_id UUID;
BEGIN
    SELECT * INTO session_record FROM public.game_sessions WHERE id = _session_id;
    
    IF session_record.current_turn_id != _player_id THEN
        RAISE EXCEPTION 'Não é o seu turno!';
    END IF;

    -- Lógica de jogo simples (exemplo: deduzir HP aleatório do outro)
    -- Em um sistema real, a lógica seria mais complexa baseada no _move
    new_state := session_record.state;
    
    IF _player_id = session_record.player1_id THEN
        new_state := jsonb_set(new_state, '{player2_hp}', ((new_state->>'player2_hp')::INT - 20)::TEXT::JSONB);
        next_turn_id := session_record.player2_id;
    ELSE
        new_state := jsonb_set(new_state, '{player1_hp}', ((new_state->>'player1_hp')::INT - 20)::TEXT::JSONB);
        next_turn_id := session_record.player1_id;
    END IF;

    UPDATE public.game_sessions
    SET state = new_state,
        current_turn_id = next_turn_id
    WHERE id = _session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
