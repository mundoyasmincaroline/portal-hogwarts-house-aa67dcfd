-- ================================================
-- Pack Surpresa + Mercado de Trocas
-- Execute no Supabase SQL Editor
-- ================================================

-- 1. Adicionar quantidade em user_stickers (para rastrear duplicatas)
ALTER TABLE public.user_stickers ADD COLUMN IF NOT EXISTS quantity int DEFAULT 1;

-- 2. Criar tabela de trocas
CREATE TABLE IF NOT EXISTS public.sticker_trades (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  offerer_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offered_sticker_id  uuid NOT NULL REFERENCES public.stickers(id) ON DELETE CASCADE,
  wanted_sticker_id   uuid REFERENCES public.stickers(id) ON DELETE SET NULL,
  status              text DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'cancelled')),
  accepted_by_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at         timestamptz,
  created_at          timestamptz DEFAULT now()
);

ALTER TABLE public.sticker_trades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Trades: ver todos"  ON public.sticker_trades;
DROP POLICY IF EXISTS "Trades: criar"      ON public.sticker_trades;
DROP POLICY IF EXISTS "Trades: gerenciar"  ON public.sticker_trades;

CREATE POLICY "Trades: ver todos"  ON public.sticker_trades FOR SELECT USING (true);
CREATE POLICY "Trades: criar"      ON public.sticker_trades FOR INSERT WITH CHECK (auth.uid() = offerer_id);
CREATE POLICY "Trades: gerenciar"  ON public.sticker_trades FOR UPDATE
  USING (auth.uid() = offerer_id OR auth.uid() = accepted_by_id);
CREATE POLICY "Trades: cancelar"   ON public.sticker_trades FOR DELETE
  USING (auth.uid() = offerer_id);

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.sticker_trades;
EXCEPTION WHEN others THEN NULL; END $$;
