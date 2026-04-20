-- PASSO 2: Criar função de pagamento
CREATE OR REPLACE FUNCTION create_infinitepay_link(
  p_order_id    UUID,
  p_amount_brl  NUMERIC,
  p_description TEXT,
  p_user_id     UUID,
  p_user_email  TEXT,
  p_user_name   TEXT,
  p_galeons     INT  DEFAULT 0,
  p_vip_plan    TEXT DEFAULT NULL
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
  v_redirect    TEXT := 'https://portal-hogwarts-house.lovable.app/dashboard/store';
BEGIN

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

  SELECT * INTO v_resp
  FROM net.http_collect_response(v_request_id, async := false);

  IF v_resp.status = 'SUCCESS'
    AND (v_resp.response).status_code IN (200, 201)
  THEN
    v_body := ((v_resp.response).body)::JSON;
    v_url  := v_body->>'url';

    IF v_url IS NOT NULL THEN
      UPDATE galeon_orders SET payment_link = v_url WHERE id = p_order_id;
      RETURN json_build_object('payment_url', v_url, 'success', true);
    ELSE
      RETURN json_build_object('success', false, 'error', 'InfinitePay nao retornou URL', 'raw', v_body::text);
    END IF;
  ELSE
    RETURN json_build_object('success', false, 'error', 'Falha na chamada InfinitePay', 'status', (v_resp.response).status_code, 'raw', (v_resp.response).body);
  END IF;

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION create_infinitepay_link TO authenticated;
