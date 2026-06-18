const SUPABASE_URL = "https://gubokmpoihpoiecvngnm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1Ym9rbXBvaWhwb2llY3ZuZ25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNzAwODksImV4cCI6MjA5MTg0NjA4OX0.hUx-5aatUnDoHANsm0nAyPmtgij_Es9UWUL67gqKVL8";

async function testSignup() {
  const randomSuffix = Math.floor(Math.random() * 1000000);
  const email = `test_new_wizard_${randomSuffix}@hogwarts.com`;
  const password = "Password123!";

  console.log(`Tentando criar a conta com email: ${email}`);

  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      password,
      data: {
        full_name: `Test Wizard ${randomSuffix}`,
        username: `testwizard_${randomSuffix}`,
        age: 15,
        house: "slytherin",
        blood_status: "pure_blood",
        wand_wood: "Elder",
        wand_core: "Dragon Heartstring"
      }
    })
  });

  const json = await res.json();

  if (!res.ok) {
    console.error("ERRO NO CADASTRO:", json.msg || json.message || json);
    process.exit(1);
  } else {
    console.log("SUCESSO! Cadastro concluído no Supabase Auth e o Trigger funcionou.");
    console.log("Usuário retornado:", json.user?.id);
    process.exit(0);
  }
}

testSignup();
