-- CORREÇÃO: create_infinitepay_link para pg_net v0.20.0
-- A v0.20.0 usa net._http_response em vez de http_collect_response

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
  v_response    RECORD;
  v_body        JSON;
  v_url         TEXT;
  v_redirect    TEXT := 'https://portal-hogwarts-house.lovable.app/dashboard/store';
  v_tries       INT := 0;
BEGIN

  -- Disparar chamada HTTP (assíncrona)
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
    )
  ) INTO v_request_id;

  -- Aguardar resposta (polling na tabela net._http_response)
  LOOP
    PERFORM pg_sleep(0.5);
    v_tries := v_tries + 1;

    SELECT * INTO v_response
    FROM net._http_response
    WHERE id = v_request_id;

    EXIT WHEN FOUND;
    EXIT WHEN v_tries >= 20; -- máx 10 segundos
  END LOOP;

  IF v_response IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Timeout aguardando InfinitePay');
  END IF;

  IF v_response.status_code IN (200, 201) THEN
    v_body := v_response.content::JSON;
    v_url  := v_body->>'url';

    IF v_url IS NOT NULL THEN
      UPDATE galeon_orders SET payment_link = v_url WHERE id = p_order_id;
      RETURN json_build_object('payment_url', v_url, 'success', true);
    ELSE
      RETURN json_build_object('success', false, 'error', 'Sem URL na resposta', 'raw', v_response.content);
    END IF;
  ELSE
    RETURN json_build_object('success', false, 'status', v_response.status_code, 'raw', v_response.content);
  END IF;

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION create_infinitepay_link TO authenticated;

-- Verificar colunas disponíveis na tabela de resposta
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'net' AND table_name = '_http_response';
