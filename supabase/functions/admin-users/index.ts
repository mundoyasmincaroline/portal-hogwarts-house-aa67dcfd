import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // 1) Validate caller is an admin
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonResponse({ error: "Missing Authorization" }, 401);

  const authedClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await authedClient.auth.getUser();
  if (userErr || !userData.user) return jsonResponse({ error: "Invalid token" }, 401);

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data: roleRow } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!roleRow) return jsonResponse({ error: "Not an admin" }, 403);

  let body: any = {};
  try { body = await req.json(); } catch { return jsonResponse({ error: "Invalid JSON" }, 400); }

  const action = body.action as string;

  try {
    if (action === "create_user") {
      const { email, password, full_name, username, house, age } = body;
      if (!email || !password) return jsonResponse({ error: "email e password obrigatórios" }, 400);
      const { data, error } = await admin.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { full_name, username, house, age },
      });
      if (error) throw error;
      await admin.from("profiles").update({ approved: true }).eq("user_id", data.user!.id);
      return jsonResponse({ ok: true, user_id: data.user!.id, email: data.user!.email });
    }

    if (action === "send_password_reset") {
      const { email, redirect_to } = body;
      if (!email) return jsonResponse({ error: "email obrigatório" }, 400);
      const { data, error } = await admin.auth.admin.generateLink({
        type: "recovery", email,
        options: { redirectTo: redirect_to || undefined },
      });
      if (error) throw error;
      return jsonResponse({ ok: true, action_link: data.properties?.action_link });
    }

    if (action === "set_password") {
      const { user_id, new_password } = body;
      if (!user_id || !new_password) return jsonResponse({ error: "user_id e new_password obrigatórios" }, 400);
      const { error } = await admin.auth.admin.updateUserById(user_id, { password: new_password });
      if (error) throw error;
      return jsonResponse({ ok: true });
    }

    if (action === "delete_user") {
      const { user_id } = body;
      if (!user_id) return jsonResponse({ error: "user_id obrigatório" }, 400);
      const { error } = await admin.auth.admin.deleteUser(user_id);
      if (error) throw error;
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ error: "Ação desconhecida" }, 400);
  } catch (err: any) {
    return jsonResponse({ error: err.message ?? String(err) }, 400);
  }
});