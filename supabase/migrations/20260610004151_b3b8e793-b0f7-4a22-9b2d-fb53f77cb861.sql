-- 1) Padroniza o tipo de moeda no ledger (singular)
UPDATE public.currency_ledger
SET currency_type = 'galeon'
WHERE currency_type = 'galeons';

-- 2) Sincroniza profile.house com a casa do personagem ativo
UPDATE public.profiles p
SET house = c.house,
    updated_at = now()
FROM public.characters c
WHERE p.active_character_id = c.id
  AND c.house IS NOT NULL
  AND (p.house IS DISTINCT FROM c.house);

-- 3) Reconcilia galeons SOMENTE para perfis com saldo NULO ou zero, somando créditos
WITH ledger_sum AS (
  SELECT user_id,
         COALESCE(SUM(CASE WHEN transaction_type = 'debit' THEN -amount ELSE amount END), 0) AS balance
  FROM public.currency_ledger
  WHERE currency_type = 'galeon'
  GROUP BY user_id
)
UPDATE public.profiles p
SET galeons = GREATEST(0, ls.balance),
    updated_at = now()
FROM ledger_sum ls
WHERE p.user_id = ls.user_id
  AND (p.galeons IS NULL OR p.galeons = 0)
  AND ls.balance > 0;

-- 4) Função utilitária para admins recalcularem um usuário sob demanda
CREATE OR REPLACE FUNCTION public.admin_recompute_member(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_is_admin boolean;
  v_balance bigint;
  v_synced_house text;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_caller AND role = 'admin') INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  -- Sincroniza casa do personagem ativo
  UPDATE public.profiles p
  SET house = c.house, updated_at = now()
  FROM public.characters c
  WHERE p.user_id = _user_id
    AND p.active_character_id = c.id
    AND c.house IS NOT NULL
    AND (p.house IS DISTINCT FROM c.house)
  RETURNING p.house INTO v_synced_house;

  -- Recalcula galeons completos a partir do ledger
  SELECT COALESCE(SUM(CASE WHEN transaction_type = 'debit' THEN -amount ELSE amount END), 0)
  INTO v_balance
  FROM public.currency_ledger
  WHERE user_id = _user_id AND currency_type = 'galeon';

  UPDATE public.profiles
  SET galeons = GREATEST(0, v_balance), updated_at = now()
  WHERE user_id = _user_id;

  RETURN jsonb_build_object(
    'ok', true,
    'galeons', GREATEST(0, v_balance),
    'house', v_synced_house
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_recompute_member(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_recompute_member(uuid) TO authenticated;