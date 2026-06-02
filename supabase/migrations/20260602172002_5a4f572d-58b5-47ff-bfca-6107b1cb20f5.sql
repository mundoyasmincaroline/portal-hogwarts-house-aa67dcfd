-- Tabela de vaga diária de RP
CREATE TABLE public.rp_daily_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  character_id uuid NOT NULL,
  claim_date date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz NOT NULL DEFAULT now(),
  messages_count integer NOT NULL DEFAULT 0,
  xp_earned integer NOT NULL DEFAULT 0,
  ended_at timestamptz,
  CONSTRAINT rp_daily_claims_user_date_unique UNIQUE (user_id, claim_date)
);

CREATE INDEX rp_daily_claims_user_idx ON public.rp_daily_claims(user_id, claim_date DESC);
CREATE INDEX rp_daily_claims_character_idx ON public.rp_daily_claims(character_id, claim_date DESC);
CREATE INDEX rp_daily_claims_date_idx ON public.rp_daily_claims(claim_date DESC);

GRANT SELECT, INSERT, UPDATE ON public.rp_daily_claims TO authenticated;
GRANT ALL ON public.rp_daily_claims TO service_role;

ALTER TABLE public.rp_daily_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view rp claims"
  ON public.rp_daily_claims FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users insert own rp claims"
  ON public.rp_daily_claims FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own rp claims"
  ON public.rp_daily_claims FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage rp claims"
  ON public.rp_daily_claims FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- RPC: reivindicar vaga do dia
CREATE OR REPLACE FUNCTION public.claim_rp_slot(p_character_id uuid)
RETURNS public.rp_daily_claims
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_owns boolean;
  v_claim public.rp_daily_claims;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Você precisa estar autenticado.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.characters
    WHERE id = p_character_id AND user_id = v_user
  ) INTO v_owns;
  IF NOT v_owns THEN
    RAISE EXCEPTION 'Personagem não pertence a você.';
  END IF;

  -- Tentar inserir; se já existe, apenas devolve e atualiza última atividade
  INSERT INTO public.rp_daily_claims (user_id, character_id, claim_date)
  VALUES (v_user, p_character_id, v_today)
  ON CONFLICT (user_id, claim_date) DO UPDATE
    SET last_active_at = now()
  RETURNING * INTO v_claim;

  -- Define personagem ativo no perfil
  UPDATE public.profiles
     SET active_character_id = p_character_id
   WHERE user_id = v_user;

  RETURN v_claim;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_rp_slot(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_rp_slot(uuid) TO authenticated;

-- Trigger: contar mensagens do dia no claim correspondente
CREATE OR REPLACE FUNCTION public.bump_rp_claim_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
  UPDATE public.rp_daily_claims
     SET messages_count = messages_count + 1,
         last_active_at = now()
   WHERE user_id = NEW.user_id
     AND claim_date = v_today;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bump_rp_claim_on_messages ON public.messages;
CREATE TRIGGER bump_rp_claim_on_messages
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.bump_rp_claim_on_message();

DROP TRIGGER IF EXISTS bump_rp_claim_on_chat_messages ON public.chat_messages;
CREATE TRIGGER bump_rp_claim_on_chat_messages
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.bump_rp_claim_on_message();