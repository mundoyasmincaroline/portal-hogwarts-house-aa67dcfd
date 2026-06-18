const SUPABASE_URL = "https://gubokmpoihpoiecvngnm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1Ym9rbXBvaWhwb2llY3ZuZ25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNzAwODksImV4cCI6MjA5MTg0NjA4OX0.hUx-5aatUnDoHANsm0nAyPmtgij_Es9UWUL67gqKVL8";

const EMAIL = "test_new_wizard_929804@hogwarts.com";
const PASSWORD = "Password123!";

async function testCharacterCreation() {
  console.log("1. Autenticando com o usuário de teste criado recentemente...");
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD })
  });

  const authData = await authRes.json();
  if (!authRes.ok) {
    console.error("ERRO DE LOGIN:", authData);
    process.exit(1);
  }

  const token = authData.access_token;
  const userId = authData.user.id;
  console.log(`Login bem-sucedido. User ID: ${userId}`);

  console.log("2. Criando personagem OC...");
  const ocData = {
    user_id: userId,
    character_type: 'oc',
    full_name: "Sir Lancelot OC",
    age: "15",
    blood_status: "pure_blood",
    gender: "male",
    house: "slytherin",
    wand_wood: "Elder",
    wand_core: "Dragon Heartstring",
    blood_locked: true,
    history: "História de teste do personagem OC"
  };

  const ocRes = await fetch(`${SUPABASE_URL}/rest/v1/characters`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(ocData)
  });

  const ocJson = await ocRes.json();
  if (!ocRes.ok) {
    console.error("ERRO AO CRIAR OC:", ocJson);
    process.exit(1);
  }
  console.log("Personagem OC criado com sucesso!", ocJson[0]?.id);

  console.log("3. Criando personagem Canon...");
  const canonData = {
    user_id: userId,
    character_type: 'canon',
    full_name: "Albus Dumbledore Canon Test",
    age: "115",
    blood_status: "half_blood",
    gender: "male",
    house: "gryffindor",
    wand_wood: "Elder",
    wand_core: "Thestral tail hair",
    blood_locked: true,
    canon_era: "marauders",
    canon_portrayed_by: "Richard Harris",
    canon_notes: "Teste de Canon character",
    history: "História de Dumbledore Teste"
  };

  const canonRes = await fetch(`${SUPABASE_URL}/rest/v1/characters`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(canonData)
  });

  const canonJson = await canonRes.json();
  if (!canonRes.ok) {
    console.error("ERRO AO CRIAR CANON:", canonJson);
    process.exit(1);
  }
  console.log("Personagem Canon criado com sucesso!", canonJson[0]?.id);

  console.log("4. Atualizando o perfil com active_character_id (simulando frontend)...");
  const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ active_character_id: ocJson[0]?.id, has_seen_intro: false })
  });

  if (!updateRes.ok) {
    const updateJson = await updateRes.json();
    console.error("ERRO AO ATUALIZAR PERFIL:", updateJson);
    process.exit(1);
  }
  
  console.log("Perfil atualizado! Experiência de novo usuário finalizada sem erros.");
  process.exit(0);
}

testCharacterCreation();
