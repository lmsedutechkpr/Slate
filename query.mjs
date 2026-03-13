import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key) env[key.trim()] = val.join('=').trim().replace(/"/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { data, error } = await supabase.from('products').select('*, profiles(*)').limit(1);
console.log(JSON.stringify({ data, error }, null, 2));

const { data: data2, error: error2 } = await supabase.from('seller_profiles').select('*').limit(1);
console.log(JSON.stringify({ seller_profiles: data2, error: error2 }, null, 2));
