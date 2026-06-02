import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const MODEL = 'google/gemini-3-flash-preview';

type Mode = 'sorting_hat' | 'prophet' | 'npc' | 'duel_narrator' | 'story' | 'npc_custom' | 'prophecy';

const SYSTEM_PROMPTS: Record<Mode, string> = {
  sorting_hat:
    'Você é o Chapéu Seletor de Hogwarts. Faça perguntas profundas (uma por vez) sobre a personalidade do bruxo. Após 3-4 perguntas, anuncie a casa (Grifinória, Sonserina, Corvinal ou Lufa-Lufa) em formato dramático. Sempre em português do Brasil, tom poético e antigo.',
  prophet:
    'Você é o redator-chefe do Profeta Diário. Escreva manchete + 3 parágrafos curtos sobre eventos mágicos atuais do castelo. Use jargão bruxo, tom jornalístico, em português do Brasil. Devolva no formato JSON: {"title":"...","content":"...","category":"esportes|politica|estudantil|misterio"}.',
  npc:
    'Você interpreta um personagem canon de Harry Potter. Mantenha-se totalmente em personagem, em português do Brasil, com manias e bordões característicos. Limite respostas a 3 frases.',
  duel_narrator:
    'Você narra duelos bruxos com energia épica de transmissão esportiva. Em português do Brasil, 2-3 frases por turno, descrevendo feitiços, esquivas e reações.',
  story:
    'Você é um mestre de RPG narrando aventuras em Hogwarts. Gere uma cena imersiva curta (1 parágrafo) em segunda pessoa, em português do Brasil.',
  npc_custom:
    '',
  prophecy:
    'Você é um Oráculo Mágico. Gere uma profecia poética, enigmática, em português do Brasil (PT-BR). 3-5 versos curtos, com símbolos e metáforas. Sempre fale do destino do bruxo de forma misteriosa. Termine com um símbolo (🔮, ⚡, 🌙, ✨, 🦉).',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const key = Deno.env.get('LOVABLE_API_KEY');
    if (!key) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY ausente' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const mode: Mode = body.mode || 'npc';
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const character = body.character || '';
    const context = body.context || '';

    if (!SYSTEM_PROMPTS[mode]) {
      return new Response(JSON.stringify({ error: 'modo inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let system = SYSTEM_PROMPTS[mode];
    if (mode === 'npc' && character) {
      system += `\n\nVocê é: ${character}. ${context}`;
    }
    if (mode === 'npc_custom' && body.systemPrompt) {
      system = String(body.systemPrompt);
    }
    if (mode === 'duel_narrator' && context) {
      system += `\n\nContexto da partida: ${context}`;
    }

    const payload = {
      model: MODEL,
      messages: [{ role: 'system', content: system }, ...messages],
      stream: false,
    };

    const r = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify(payload),
    });

    if (r.status === 429) {
      return new Response(JSON.stringify({ error: 'Muitas requisições mágicas. Tente em alguns segundos.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (r.status === 402) {
      return new Response(JSON.stringify({ error: 'Créditos de IA esgotados.' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!r.ok) {
      const text = await r.text();
      return new Response(JSON.stringify({ error: 'Falha na IA', detail: text }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content ?? '';
    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});