import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import ShopPageClient from '@/components/student/shop/ShopPageClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Shop – Slate',
  description: 'Tech accessories for learners.',
};

export default async function ShopPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // QUERY 1 — All active products
  const { data: productsRaw } = await admin
    .from('products')
    .select(`
      id, name, name_ta, slug, description,
      price, discounted_price, images,
      stock_qty, low_stock_threshold,
      status, total_sold, avg_rating,
      total_reviews, related_course_tags,
      seller_id,
      product_categories ( id, name, slug, icon )
    `)
    .eq('status', 'active')
    .order('total_sold', { ascending: false });

  // QUERY 2 — Product categories
  const { data: categories } = await admin
    .from('product_categories')
    .select('id, name, slug, icon')
    .eq('is_active', true)
    .order('sort_order');

  // QUERY 3 — Cart items
  const { data: cartItemsRaw } = await admin
    .from('cart_items')
    .select(`
      id, quantity, product_id,
      products ( id, name, price, discounted_price, images, stock_qty )
    `)
    .eq('user_id', user.id);

  // QUERY 4 — Enrolled course tags for recommendations
  const { data: enrollments } = await admin
    .from('enrollments')
    .select('courses ( tags )')
    .eq('student_id', user.id)
    .eq('is_active', true);

  const enrolledTags: string[] = [];
  (enrollments || []).forEach((e: any) => {
    const tags = Array.isArray(e.courses) ? e.courses[0]?.tags : e.courses?.tags;
    if (Array.isArray(tags)) enrolledTags.push(...tags);
  });

  // Normalise product_categories (it's a to-one join, Supabase returns object)
  const products = (productsRaw || []).map((p: any) => ({
    ...p,
    product_categories: Array.isArray(p.product_categories) ? p.product_categories[0] : p.product_categories,
  }));

  const cartItems = (cartItemsRaw || []).map((ci: any) => ({
    ...ci,
    products: Array.isArray(ci.products) ? ci.products[0] : ci.products,
  }));

  // Language preference
  const { data: prefs } = await admin
    .from('user_preferences')
    .select('language')
    .eq('user_id', user.id)
    .single();

  // Wishlists
  const { data: wishlistsRaw } = await admin
    .from('wishlists')
    .select('product_id')
    .eq('user_id', user.id)
    .not('product_id', 'is', null);

  const wishlistedProductIds = (wishlistsRaw || []).map((w: any) => w.product_id);

  return (
    <Suspense fallback={null}>
      <ShopPageClient
        products={products}
        categories={categories || []}
        cartItems={cartItems}
        enrolledTags={[...new Set(enrolledTags)]}
        userId={user.id}
        language={prefs?.language || 'en'}
        initialWishlistedIds={wishlistedProductIds}
      />
    </Suspense>
  );
}
