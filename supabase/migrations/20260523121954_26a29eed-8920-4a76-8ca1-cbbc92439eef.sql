-- 1. SISTEMA DE INDICAÇÃO (REFERRALS)
CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID REFERENCES public.referrals(id) ON DELETE CASCADE,
  reward_type TEXT DEFAULT 'galeons',
  amount INTEGER DEFAULT 100,
  claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referral_rewards_owner" ON public.referral_rewards FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM referrals WHERE referrals.id = referral_id AND referrals.inviter_id = auth.uid()));

-- 2. ONBOARDING (METAS INICIAIS)
-- Criando índice para ON CONFLICT
CREATE UNIQUE INDEX IF NOT EXISTS challenges_title_idx ON public.challenges (title);

INSERT INTO public.challenges (title, description, xp_reward, type, active)
VALUES 
  ('Sua Primeira Varinha', 'Visite a Loja Olivaras e adquira sua primeira varinha.', 100, 'onboarding', true),
  ('O Chapéu Seletor', 'Complete sua ficha e seja selecionado para uma casa.', 200, 'onboarding', true),
  ('Primeiro Feitiço', 'Aprenda seu primeiro feitiço em uma aula ou na biblioteca.', 150, 'onboarding', true),
  ('Amizade Mágica', 'Adicione seu primeiro amigo no portal.', 50, 'onboarding', true)
ON CONFLICT (title) DO UPDATE SET
  description = EXCLUDED.description,
  xp_reward = EXCLUDED.xp_reward,
  type = EXCLUDED.type;

-- 3. PERMISSÕES PARA REFERRALS
DROP POLICY IF EXISTS "Usuários inserem suas indicações ao logar" ON public.referrals;
CREATE POLICY "referrals_insert_on_join" ON public.referrals FOR INSERT TO authenticated WITH CHECK (auth.uid() = invited_id);
