
CREATE OR REPLACE FUNCTION public.accept_sticker_trade(_trade_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _trade RECORD;
  _acceptor uuid := auth.uid();
BEGIN
  IF _acceptor IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Não autenticado');
  END IF;

  SELECT * INTO _trade FROM public.sticker_trades WHERE id = _trade_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Troca não encontrada');
  END IF;
  IF _trade.status <> 'open' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Troca não está mais disponível');
  END IF;
  IF _trade.offerer_id = _acceptor THEN
    RETURN jsonb_build_object('success', false, 'message', 'Você não pode aceitar sua própria troca');
  END IF;

  -- Verifica posse do ofertante
  IF NOT EXISTS (SELECT 1 FROM public.user_stickers WHERE user_id = _trade.offerer_id AND sticker_id = _trade.offered_sticker_id) THEN
    UPDATE public.sticker_trades SET status = 'cancelled' WHERE id = _trade_id;
    RETURN jsonb_build_object('success', false, 'message', 'Ofertante não possui mais a figurinha');
  END IF;

  IF _trade.wanted_sticker_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.user_stickers WHERE user_id = _acceptor AND sticker_id = _trade.wanted_sticker_id) THEN
      RETURN jsonb_build_object('success', false, 'message', 'Você não possui a figurinha pedida');
    END IF;
    -- Move wanted -> offerer
    DELETE FROM public.user_stickers WHERE user_id = _acceptor AND sticker_id = _trade.wanted_sticker_id;
    INSERT INTO public.user_stickers(user_id, sticker_id) VALUES (_trade.offerer_id, _trade.wanted_sticker_id)
      ON CONFLICT DO NOTHING;
  END IF;

  -- Move offered -> acceptor
  DELETE FROM public.user_stickers WHERE user_id = _trade.offerer_id AND sticker_id = _trade.offered_sticker_id;
  INSERT INTO public.user_stickers(user_id, sticker_id) VALUES (_acceptor, _trade.offered_sticker_id)
    ON CONFLICT DO NOTHING;

  UPDATE public.sticker_trades
     SET status = 'accepted', accepted_by_id = _acceptor, accepted_at = now()
   WHERE id = _trade_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_sticker_trade(uuid) TO authenticated;
