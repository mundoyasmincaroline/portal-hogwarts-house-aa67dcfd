const SUPABASE_URL = "https://gubokmpoihpoiecvngnm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1Ym9rbXBvaWhwb2llY3ZuZ25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNzAwODksImV4cCI6MjA5MTg0NjA4OX0.hUx-5aatUnDoHANsm0nAyPmtgij_Es9UWUL67gqKVL8";

async function fetchCharactersSchema() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/characters?limit=1`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'return=representation'
    }
  });
  const data = await res.json();
  if (data && data.length > 0) {
    console.log("COLUMNS IN CHARACTERS TABLE:");
    console.log(Object.keys(data[0]).join(", "));
  } else {
    console.log("NO CHARACTERS FOUND, Or Error:", data);
  }
}
fetchCharactersSchema();
