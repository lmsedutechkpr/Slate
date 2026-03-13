import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  let query = supabase
    .from('courses')
    .select(`
      id, title, title_ta, slug, thumbnail_url,
      subtitle, is_free, price, discounted_price,
      avg_rating, total_reviews, total_enrolled,
      total_lectures, total_duration_mins,
      difficulty, language, certificate_enabled,
      published_at,
      categories ( id, name, name_ta, color, slug ),
      course_instructors!inner (
        is_primary,
        profiles!inner (
          id, full_name, avatar_url
        )
      )
    `, { count: 'exact' })
    .eq('status', 'approved')
    .eq('course_instructors.is_primary', true);

  // Apply Filters
  query = query.in('difficulty', ['Beginner']);
  query = query.gte('avg_rating', 4);

  const { data, count, error } = await query;
  
  if (error) {
    console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2));
    console.error("ERROR MESSAGE:", error.message);
    console.error("ERROR DETAILS:", error.details);
    console.error("ERROR HINT:", error.hint);
  } else {
    console.log("Success! Count:", count);
  }
}

run();
