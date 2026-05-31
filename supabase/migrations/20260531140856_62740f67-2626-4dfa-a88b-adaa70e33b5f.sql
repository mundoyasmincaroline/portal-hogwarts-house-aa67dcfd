
CREATE OR REPLACE FUNCTION public.admin_grant_vip(_user_id uuid, _plan text, _months integer DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    vip_plan = _plan,
    vip_expires_at = NOW() + (_months || ' month')::INTERVAL,
    updated_at = NOW()
  WHERE user_id = _user_id;

  INSERT INTO public.notifications (user_id, title, message)
  VALUES (_user_id, '👑 Status VIP Concedido', 'Seu plano ' || upper(_plan) || ' foi ativado manualmente por um monitor.');
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_grant_vip TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_grant_vip TO service_role;
