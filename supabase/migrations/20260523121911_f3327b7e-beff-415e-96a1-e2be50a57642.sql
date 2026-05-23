-- 1. SUB-MOEDAS CANÔNICAS (PROFILES)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sickles INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS knuts INTEGER DEFAULT 0;

-- 2. LOG DE ECONOMIA (AUDITORIA)
CREATE TABLE IF NOT EXISTS public.currency_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  currency_type TEXT NOT NULL, -- 'galeon', 'sickle', 'knut', 'xp'
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL, -- 'purchase', 'reward', 'conversion', 'gift', 'penalty'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.currency_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "currency_ledger_select" ON public.currency_ledger FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 3. BATTLE PASS (PASSAPORTE BRUXO)
CREATE TABLE IF NOT EXISTS public.battle_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.battle_passes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "battle_passes_select" ON public.battle_passes FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.battle_pass_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pass_id UUID REFERENCES public.battle_passes(id) ON DELETE CASCADE,
  level_required INTEGER NOT NULL,
  is_premium BOOLEAN DEFAULT false,
  reward_type TEXT NOT NULL, -- 'item', 'currency', 'badge', 'title'
  reward_value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.battle_pass_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "battle_pass_rewards_select" ON public.battle_pass_rewards FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.user_battle_pass_progress (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pass_id UUID REFERENCES public.battle_passes(id) ON DELETE CASCADE,
  current_level INTEGER DEFAULT 1,
  current_xp INTEGER DEFAULT 0,
  premium_unlocked BOOLEAN DEFAULT false,
  claimed_rewards JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, pass_id)
);
ALTER TABLE public.user_battle_pass_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_bp_progress_select" ON public.user_battle_pass_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 4. SEED BATTLE PASS INICIAL
INSERT INTO public.battle_passes (season_name, start_date, end_date)
VALUES ('Ano 1: A Pedra Filosofal', '2026-05-23', '2026-08-31')
ON CONFLICT DO NOTHING;
