require('dotenv').config({ path: '.env.local' });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function fetchSchema() {
  const res = await fetch(`${url}/rest/v1/?apikey=${key}`);
  const json = await res.json();
  const ordersSchema = json.definitions?.orders?.properties;
  console.log("Orders Schema Properties:", ordersSchema || "Not found");
}

fetchSchema();
