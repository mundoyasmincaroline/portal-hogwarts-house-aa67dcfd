// Edge Function: create-payment-link
// Cria um link de pagamento na InfinitePay e retorna a URL para o frontend
// Documentação: https://ajuda.infinitepay.io/pt-BR/articles/10766888

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const INFINITEPAY_HANDLE = "portal-matrix";
const INFINITEPAY_API = "https://api.infinitepay.io/invoices/public/checkout/links";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      order_id,
      amount_brl,   // valor em R$ (ex: 4.90)
      galeons,      // quantidade de galeões
      package_name, // nome do pacote (ex: "Bolsinha de Galeões")
      user_id,
      user_email,
      user_name,
      vip_plan,     // se for assinatura VIP
    } = body;

    if (!order_id || !amount_brl || !user_id) {
      return new Response(
        JSON.stringify({ error: "Parâmetros obrigatórios faltando." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Supabase URL pública do projeto para o webhook
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const webhookUrl = `${supabaseUrl}/functions/v1/infinitepay-webhook`;

    // Preço em centavos (InfinitePay usa centavos)
    const priceInCents = Math.round(amount_brl * 100);

    // Descrição do item
    const description = vip_plan
      ? `VIP ${package_name} — Portal Hogwarts`
      : `${package_name} — ${galeons}🪙 Galeões — Portal Hogwarts`;

    // Montar payload InfinitePay
    const payload: Record<string, unknown> = {
      handle: INFINITEPAY_HANDLE,
      redirect_url: "https://portal-hogwarts-house.lovable.app/dashboard/store",
      webhook_url: webhookUrl,
      order_nsu: order_id,           // ID do pedido no nosso banco
      customer: {
        name: user_name || "Bruxo(a)",
        email: user_email || "",
      },
      items: [
        {
          quantity: 1,
          price: priceInCents,
          description: description,
        },
      ],
    };

    // Chamar API da InfinitePay
    const response = await fetch(INFINITEPAY_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    // InfinitePay pode retornar a URL em campos diferentes conforme a versão da API
    const paymentUrl: string | undefined =
      data?.url || data?.link || data?.checkout_url;

    if (!response.ok || !paymentUrl) {
      console.error("Erro InfinitePay:", data);
      return new Response(
        JSON.stringify({ error: "Falha ao gerar link InfinitePay.", details: data }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Salvar o link no banco (galeon_orders)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { error: updErr } = await supabaseAdmin
      .from("galeon_orders")
      .update({ payment_link: paymentUrl })
      .eq("id", order_id);
    if (updErr) console.error("Falha ao salvar payment_link:", updErr);

    return new Response(
      JSON.stringify({ payment_url: paymentUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Erro inesperado:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno no servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
