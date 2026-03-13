require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
async function check() {
  const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const PROD_ID = 'dddddd01-0000-0000-0000-000000000003'; // Keychron K2

  // Check reviews for this product with NO filters
  const { data: allReviews } = await s.from('reviews').select('id, target_type, product_id, course_id, rating, reviewer_id, title').limit(5);
  console.log("All reviews sample:", allReviews);

  // Check with product_id filter
  const { data: pflReviews } = await s.from('reviews').select('id, rating, reviewer_id').eq('product_id', PROD_ID);
  console.log("Reviews for product:", pflReviews?.length, pflReviews);

  // Check profiles table columns
  const { data: profiles } = await s.from('profiles').select('*').limit(1);
  console.log("Profiles columns:", profiles?.[0] ? Object.keys(profiles[0]) : 'none');

  // Check cart_items unique constraint via information_schema
  const { data: cart_schema } = await s.from('cart_items').select('*').limit(1);
  console.log("Cart schema sample:", cart_schema?.[0] ? Object.keys(cart_schema[0]) : 'empty table');
}
check();
