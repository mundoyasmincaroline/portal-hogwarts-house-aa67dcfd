-- EXPANSÃO 4: Sistema de Recrutamento Mágico (Anti-Fraude)

-- 1. Criação da Tabela de Indicações (Referrals)
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inviter_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    invited_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending' ou 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(invited_id) -- Um usuário só pode ser convidado uma vez
);

-- 2. Ativar Segurança (RLS)
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem suas próprias indicações"
ON public.referrals FOR SELECT
USING (auth.uid() = inviter_id OR auth.uid() = invited_id);

CREATE POLICY "Usuários inserem suas indicações ao logar"
ON public.referrals FOR INSERT
WITH CHECK (auth.uid() = invited_id);

-- 3. Função RPC para Completar o Recrutamento (Anti-Burla)
-- Só será ativada quando o novato (invited_id) chegar no Nível 2
CREATE OR REPLACE FUNCTION complete_referral_action(_invited_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    _inviter_id UUID;
    _status VARCHAR;
BEGIN
    -- Busca quem convidou este usuário e se ainda está pendente
    SELECT inviter_id, status INTO _inviter_id, _status 
    FROM public.referrals 
    WHERE invited_id = _invited_id;

    IF _status = 'pending' THEN
        -- Marca a indicação como concluída
        UPDATE public.referrals 
        SET status = 'completed' 
        WHERE invited_id = _invited_id;

        -- Entrega a recompensa generosa (500 XP) ao Recrutador (inviter_id)
        UPDATE public.profiles 
        SET 
            xp = xp + 500, 
            level = floor(power((xp + 500) / 100, 1/1.5)) + 1
        WHERE user_id = _inviter_id;
    END IF;
END;
$$;
