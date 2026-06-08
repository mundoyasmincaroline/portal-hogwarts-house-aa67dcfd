
CREATE OR REPLACE FUNCTION public.leave_guild()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.guild_members WHERE user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_faction()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.user_factions WHERE user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_live_event_reward(_event_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _ev record;
  _att record;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('success', false, 'message', 'Não autenticado'); END IF;
  SELECT * INTO _ev FROM public.live_events WHERE id = _event_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Evento não encontrado'); END IF;
  IF now() < _ev.starts_at THEN RETURN jsonb_build_object('success', false, 'message', 'Evento ainda não começou'); END IF;

  SELECT * INTO _att FROM public.event_attendees WHERE event_id = _event_id AND user_id = _uid;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Confirme presença primeiro'); END IF;
  IF _att.attended IS TRUE THEN RETURN jsonb_build_object('success', false, 'message', 'Recompensa já resgatada'); END IF;

  UPDATE public.event_attendees SET attended = TRUE WHERE event_id = _event_id AND user_id = _uid;

  IF COALESCE(_ev.reward_xp, 0) > 0 THEN
    PERFORM public.award_xp_action('live_event'::text, _uid, _ev.reward_xp);
  END IF;
  IF COALESCE(_ev.reward_gold, 0) > 0 THEN
    PERFORM public.award_galeons(_uid, _ev.reward_gold, 'live_event');
  END IF;

  RETURN jsonb_build_object('success', true, 'xp', _ev.reward_xp, 'galeons', _ev.reward_gold);
END;
$$;

GRANT EXECUTE ON FUNCTION public.leave_guild() TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_faction() TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_live_event_reward(uuid) TO authenticated;
