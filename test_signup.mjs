import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://gubokmpoihpoiecvngnm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1Ym9rbXBvaWhwb2llY3ZuZ25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNzAwODksImV4cCI6MjA5MTg0NjA4OX0.hUx-5aatUnDoHANsm0nAyPmtgij_Es9UWUL67gqKVL8";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSignup() {
  const randomSuffix = Math.floor(Math.random() * 1000000);
  const email = `test_new_wizard_${randomSuffix}@hogwarts.com`;
  const password = "Password123!";

  console.log(`Tentando criar a conta com email: ${email}`);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: `Test Wizard ${randomSuffix}`,
        username: `testwizard_${randomSuffix}`,
        age: 15,
        house: "slytherin",
        blood_status: "pure_blood",
        wand_wood: "Elder",
        wand_core: "Dragon Heartstring"
      }
    }
  });

  if (error) {
    console.error("ERRO NO CADASTRO:", error.message);
    process.exit(1);
  } else {
    console.log("SUCESSO! O usuário foi criado corretamente no Supabase Auth e o Trigger funcionou perfeitamente.");
    console.log("ID do usuário:", data.user?.id);
    process.exit(0);
  }
}

testSignup();
