-- Atualizar award_xp_action com search_path
ALTER FUNCTION public.award_xp_action(_action TEXT, _user_id UUID, _xp INTEGER) SET search_path = public;

-- Atualizar award_galeons com search_path
ALTER FUNCTION public.award_galeons(_user_id UUID, _amount INTEGER, _reason TEXT) SET search_path = public;

-- Atualizar buy_store_item com search_path
ALTER FUNCTION public.buy_store_item(_user_id UUID, _item_id UUID) SET search_path = public;
