import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const adminEmail = "mundoyasmincaroline@hogwarts.house";
  const adminPassword = "hogwarts2024";

  // Check if admin already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const adminExists = existingUsers?.users?.find((u: any) => u.email === adminEmail);

  if (adminExists) {
    // Ensure admin role exists
    const { data: roleCheck } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", adminExists.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleCheck) {
      await supabase.from("user_roles").insert({ user_id: adminExists.id, role: "admin" });
    }

    // Ensure approved
    await supabase.from("profiles").update({ approved: true, full_name: "Yasmin Caroline" }).eq("user_id", adminExists.id);

    return new Response(JSON.stringify({ message: "Admin already exists", email: adminEmail }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Create admin user
  const { data: newUser, error } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: {
      full_name: "Yasmin Caroline",
      username: "mundoyasmincaroline",
      age: 16,
      house: "gryffindor",
    },
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Add admin role
  await supabase.from("user_roles").insert({ user_id: newUser.user.id, role: "admin" });

  // Approve profile
  await supabase.from("profiles").update({ approved: true }).eq("user_id", newUser.user.id);

  return new Response(JSON.stringify({ message: "Admin created!", email: adminEmail }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
