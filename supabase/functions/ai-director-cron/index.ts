import { createClient } from 'npm:@supabase/supabase-js@2';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || "AIzaSyDf33itOI6nEP9XnfT0DhIs0pqOKSBkqZU"; // Fallback to provided key
const ONESIGNAL_APP_ID = "ab9508ad-37de-44e9-bdf7-57dd5b4ed792";
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY') || ""; 

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || "";

Deno.serve(async (req) => {
  // Verificação básica de segurança
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${Deno.env.get('CRON_SECRET') || 'jarvis'}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!ONESIGNAL_REST_API_KEY) {
    return new Response('OneSignal REST API Key não configurada.', { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // 1. Busca 5 usuários inativos ou aleatórios (para não estourar rate limit)
    // Ordena por updated_at ascendente para focar em quem não loga há mais tempo
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('user_id, full_name, house, level, galeons, updated_at')
      .order('updated_at', { ascending: true })
      .limit(5);

    if (error) throw error;
    if (!profiles || profiles.length === 0) return new Response('No profiles found');

    const results = [];

    // 2. Para cada usuário, chama Gemini e manda Push
    for (const profile of profiles) {
      const prompt = `Você é o Diretor oculto do Portal Hogwarts (sistema de gamificação). 
O aluno ${profile.full_name} da casa ${profile.house} (Nível ${profile.level}, com ${profile.galeons} galeões) está OFFLINE.
Gere UMA única notificação curta (máximo 120 caracteres) de Push Notification persuasiva e viciante, com tom misterioso e provocativo, para instigá-lo a abrir o jogo AGORA e gastar dinheiro no Beco Diagonal, abrir pacotes de figurinhas ou duelar.
Sem aspas, emojis são permitidos.`;

      // Chamada para o Gemini Flash
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      const geminiData = await geminiRes.json();
      const message = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "O castelo te chama. O que você está esperando?";

      // 3. Envia via OneSignal
      const pushPayload = {
        app_id: ONESIGNAL_APP_ID,
        include_aliases: {
          external_id: [profile.user_id]
        },
        target_channel: "push",
        headings: { en: "🏰 Sussurro do Castelo" },
        contents: { en: message },
        url: "https://portal.hogwarts.house/dashboard" // Redireciona ao clicar
      };

      const onesignalRes = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${ONESIGNAL_REST_API_KEY}`
        },
        body: JSON.stringify(pushPayload)
      });

      const pushResult = await onesignalRes.json();
      
      // Salva no banco de notificações também, para ele ver no sininho quando entrar
      await supabase.from('notifications').insert({
        user_id: profile.user_id,
        title: 'Sussurro do Castelo',
        message: message,
        link: '/dashboard',
        read: false
      });

      results.push({ user: profile.full_name, pushId: pushResult.id });
    }

    return new Response(JSON.stringify({ success: true, processed: results }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
