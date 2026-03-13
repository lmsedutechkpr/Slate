require('dotenv').config({ path: '.env.local' });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function fetchSchema() {
  const res = await fetch(`${url}/rest/v1/?apikey=${key}`);
  const json = await res.json();
  const paths = Object.keys(json.paths || {});
  const rpcs = paths.filter(p => p.startsWith('/rpc/'));
  console.log("Available RPCs:", rpcs);
}

fetchSchema();
