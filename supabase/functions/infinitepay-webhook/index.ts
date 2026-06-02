// Edge Function: infinitepay-webhook
// Recebe confirmação de pagamento da InfinitePay e credita Galeões / ativa VIP
// Documentação: https://ajuda.infinitepay.io/pt-BR/articles/10766888

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Webhook InfinitePay recebido:", JSON.stringify(body));

    const {
      order_nsu,        // ID do pedido no nosso banco (galeon_orders.id)
      paid_amount,      // valor pago em centavos
      capture_method,   // "credit_card" | "pix"
      transaction_nsu,  // ID único da transação InfinitePay
      slug,             // slug do checkout (para verificação)
    } = body;

    if (!order_nsu) {
      return new Response(
        JSON.stringify({ success: false, message: "order_nsu ausente." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 0. Verificar autenticidade do pagamento direto na InfinitePay
    //    Protege contra webhooks forjados (não confiamos no body cru).
    try {
      const verifyRes = await fetch(
        "https://api.infinitepay.io/invoices/public/checkout/payment_check",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            handle: "portal-matrix",
            order_nsu,
            transaction_nsu: transaction_nsu ?? "",
            slug: slug ?? "",
          }),
        }
      );
      const verifyData = await verifyRes.json().catch(() => ({}));
      if (!verifyRes.ok || verifyData?.paid !== true) {
        console.warn("Webhook rejeitado — pagamento não confirmado:", verifyData);
        return new Response(
          JSON.stringify({ success: false, message: "Pagamento não confirmado." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (vErr) {
      console.error("Falha ao verificar pagamento:", vErr);
      return new Response(
        JSON.stringify({ success: false, message: "Falha na verificação." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cliente admin Supabase (service role — pode tudo)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Buscar o pedido no banco
    const { data: order, error: orderErr } = await supabase
      .from("galeon_orders")
      .select("*")
      .eq("id", order_nsu)
      .single();

    if (orderErr || !order) {
      console.error("Pedido não encontrado:", order_nsu);
      return new Response(
        JSON.stringify({ success: false, message: "Pedido não encontrado." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Marcar pedido como pago de forma ATÔMICA — só processa créditos
    // se este request foi o primeiro a mudar status='pending' -> 'paid'.
    const { data: claimed, error: claimErr } = await supabase
      .from("galeon_orders")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        infinitepay_id: transaction_nsu ?? null,
      })
      .eq("id", order_nsu)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (claimErr) {
      console.error("Erro ao reivindicar pedido:", claimErr);
      return new Response(
        JSON.stringify({ success: false, message: "Erro ao processar pedido." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!claimed) {
      // Já foi processado em outra requisição — idempotente
      console.log("Pedido já processado (race-safe):", order_nsu);
      return new Response(
        JSON.stringify({ success: true, message: "Já processado." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Verificar se é VIP ou compra de Galeões
    const isVip = order.package_id?.startsWith("vip_");

    if (isVip) {
      // ── Ativar plano VIP ──────────────────────────────────
      const planId = order.package_id.replace("vip_", ""); // "premium" | "vip" | "founder"

      const VIP_GALEONS: Record<string, number> = {
        premium: 0,
        vip: 200,
        founder: 500,
      };

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      await supabase
        .from("profiles")
        .update({
          vip_plan: planId,
          vip_expires_at: expiresAt.toISOString(),
        })
        .eq("user_id", order.user_id);

      // Creditar Galeões mensais do VIP
      const galeonBonus = VIP_GALEONS[planId] ?? 0;
      if (galeonBonus > 0) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("galeons")
          .eq("user_id", order.user_id)
          .single();

        await supabase
          .from("profiles")
          .update({ galeons: (prof?.galeons ?? 0) + galeonBonus })
          .eq("user_id", order.user_id);
      }

      // Registrar assinatura
      await supabase.from("vip_subscriptions").insert({
        user_id: order.user_id,
        plan: planId,
        amount_brl: order.amount_brl,
        status: "active",
        expires_at: expiresAt.toISOString(),
        infinitepay_id: transaction_nsu ?? null,
        galeons_monthly: VIP_GALEONS[planId] ?? 0,
      });

      console.log(`✅ VIP ${planId} ativado para ${order.user_id}`);

      await supabase.from("notifications").insert({
        user_id: order.user_id,
        title: "👑 Plano VIP ativado!",
        message: `Seu plano ${planId.toUpperCase()} está ativo até ${expiresAt.toLocaleDateString("pt-BR")}.`,
        link: "/dashboard/wallet",
      });

    } else {
      // ── Creditar Galeões ───────────────────────────────────
      const galeons = order.galeons ?? 0;

      if (galeons > 0) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("galeons")
          .eq("user_id", order.user_id)
          .single();

        await supabase
          .from("profiles")
          .update({ galeons: (prof?.galeons ?? 0) + galeons })
          .eq("user_id", order.user_id);

        console.log(`✅ ${galeons} Galeões creditados para ${order.user_id}`);

        await supabase.from("notifications").insert({
          user_id: order.user_id,
          title: "🪙 Galeões creditados!",
          message: `${galeons} Galeões foram adicionados ao seu cofre em Gringotts.`,
          link: "/dashboard/wallet",
        });
      }
    }

    // 5. Responder à InfinitePay com sucesso (dentro de 1 segundo!)
    return new Response(
      JSON.stringify({ success: true, message: null }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Erro no webhook:", err);
    return new Response(
      JSON.stringify({ success: false, message: "Erro interno." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
