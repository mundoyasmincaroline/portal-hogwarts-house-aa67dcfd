-- ============================================================
-- SOLUÇÃO SEM EDGE FUNCTION
-- Usa pg_net (HTTP server-side) para chamar InfinitePay
-- Cole este SQL no editor do Lovable (Cloud → SQL editor)
-- ============================================================

-- 1. Ativar extensão pg_net (já vem ativa no Supabase hosted)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- FUNÇÃO: Criar link de pagamento InfinitePay (server-side)
-- ============================================================
CREATE OR REPLACE FUNCTION create_infinitepay_link(
  p_order_id    UUID,
  p_amount_brl  NUMERIC,
  p_description TEXT,
  p_user_id     UUID,
  p_user_email  TEXT,
  p_user_name   TEXT,
  p_galeons     INT     DEFAULT 0,
  p_vip_plan    TEXT    DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_id  BIGINT;
  v_resp        RECORD;
  v_body        JSON;
  v_url         TEXT;
  -- ⚠️ Ajuste aqui para a URL do seu portal no Lovable:
  v_redirect    TEXT := 'https://portal-hogwarts-house.lovable.app/dashboard/store';
BEGIN

  -- Chamar API InfinitePay server-side (sem CORS!)
  SELECT net.http_post(
    url     := 'https://api.infinitepay.io/invoices/public/checkout/links',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body    := jsonb_build_object(
      'handle',       'portal-matrix',
      'redirect_url', v_redirect,
      'order_nsu',    p_order_id::text,
      'customer', jsonb_build_object(
        'name',  COALESCE(NULLIF(p_user_name, ''), 'Bruxo(a)'),
        'email', COALESCE(NULLIF(p_user_email, ''), '')
      ),
      'items', jsonb_build_array(
        jsonb_build_object(
          'quantity',    1,
          'price',       ROUND(p_amount_brl * 100)::INT,
          'description', p_description
        )
      )
    ),
    timeout_milliseconds := 8000
  ) INTO v_request_id;

  -- Aguardar resposta (síncrono)
  SELECT * INTO v_resp
  FROM net.http_collect_response(v_request_id, async := false);

  -- Verificar sucesso
  IF v_resp.status = 'SUCCESS'
    AND (v_resp.response).status_code IN (200, 201)
  THEN
    v_body := ((v_resp.response).body)::JSON;
    v_url  := v_body->>'url';

    IF v_url IS NOT NULL THEN
      -- Salvar link no pedido
      UPDATE galeon_orders
      SET payment_link = v_url
      WHERE id = p_order_id;

      RETURN json_build_object('payment_url', v_url, 'success', true);
    ELSE
      RETURN json_build_object(
        'success', false,
        'error',   'InfinitePay não retornou URL',
        'raw',     v_body::text
      );
    END IF;

  ELSE
    RETURN json_build_object(
      'success',     false,
      'error',       'Falha na chamada InfinitePay',
      'status',      (v_resp.response).status_code,
      'raw',         (v_resp.response).body
    );
  END IF;

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error',   SQLERRM
  );
END;
$$;

-- Permitir que usuários autenticados chamem a função
GRANT EXECUTE ON FUNCTION create_infinitepay_link TO authenticated;

-- ============================================================
-- FUNÇÃO: Verificar pagamento InfinitePay e creditar Galeões
-- ============================================================
CREATE OR REPLACE FUNCTION verify_infinitepay_payment(
  p_order_nsu       TEXT,
  p_transaction_nsu TEXT,
  p_slug            TEXT DEFAULT ''
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_id   BIGINT;
  v_resp         RECORD;
  v_check        JSON;
  v_order        RECORD;
  v_current_gal  INT;
  v_plan_id      TEXT;
  v_expires_at   TIMESTAMPTZ;
  v_vip_galeons  INT;
BEGIN

  -- Verificar pagamento na InfinitePay
  SELECT net.http_post(
    url     := 'https://api.infinitepay.io/invoices/public/checkout/payment_check',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body    := jsonb_build_object(
      'handle',          'portal-matrix',
      'order_nsu',       p_order_nsu,
      'transaction_nsu', p_transaction_nsu,
      'slug',            p_slug
    ),
    timeout_milliseconds := 8000
  ) INTO v_request_id;

  SELECT * INTO v_resp
  FROM net.http_collect_response(v_request_id, async := false);

  IF v_resp.status != 'SUCCESS' THEN
    RETURN json_build_object('success', false, 'error', 'Falha na verificação');
  END IF;

  v_check := ((v_resp.response).body)::JSON;

  IF NOT (v_check->>'paid')::boolean THEN
    RETURN json_build_object('success', false, 'paid', false, 'message', 'Pagamento ainda não confirmado');
  END IF;

  -- Buscar pedido
  SELECT * INTO v_order FROM galeon_orders WHERE id = p_order_nsu::UUID;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Pedido não encontrado');
  END IF;

  IF v_order.status = 'paid' THEN
    RETURN json_build_object('success', true, 'message', 'Já processado');
  END IF;

  -- Marcar como pago
  UPDATE galeon_orders
  SET status = 'paid',
      paid_at = NOW(),
      infinitepay_id = p_transaction_nsu
  WHERE id = p_order_nsu::UUID;

  -- Buscar saldo atual
  SELECT COALESCE(galeons, 0) INTO v_current_gal
  FROM profiles WHERE user_id = v_order.user_id;

  -- VIP ou Galeões?
  IF v_order.package_id LIKE 'vip_%' THEN
    v_plan_id := REPLACE(v_order.package_id, 'vip_', '');
    v_expires_at := NOW() + INTERVAL '1 month';
    v_vip_galeons := CASE v_plan_id
      WHEN 'premium' THEN 0
      WHEN 'vip'     THEN 200
      WHEN 'founder' THEN 500
      ELSE 0
    END;

    UPDATE profiles SET
      vip_plan       = v_plan_id,
      vip_expires_at = v_expires_at,
      galeons        = v_current_gal + v_vip_galeons
    WHERE user_id = v_order.user_id;

    INSERT INTO vip_subscriptions (user_id, plan, amount_brl, status, expires_at, galeons_monthly)
    VALUES (v_order.user_id, v_plan_id, v_order.amount_brl, 'active', v_expires_at, v_vip_galeons);

    RETURN json_build_object('success', true, 'type', 'vip', 'plan', v_plan_id);

  ELSE
    UPDATE profiles
    SET galeons = v_current_gal + COALESCE(v_order.galeons, 0)
    WHERE user_id = v_order.user_id;

    RETURN json_build_object('success', true, 'type', 'galeons', 'galeons', v_order.galeons);
  END IF;

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION verify_infinitepay_payment TO authenticated;

-- Verificar se as funções foram criadas
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name IN ('create_infinitepay_link', 'verify_infinitepay_payment')
  AND routine_schema = 'public';
