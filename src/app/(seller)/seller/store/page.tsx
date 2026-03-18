import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import StorePageClient from '@/components/seller/store/StorePageClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'My Store – Slate Seller',
  description: 'Preview and manage your public store page.',
};

function adminDb() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function StorePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const db = adminDb();

  // ─── Query 1: Seller profile ───
  const { data: sellerProfile } = await db
    .from('seller_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // ─── Query 2: Active products ───
  const { data: products } = await db
    .from('products')
    .select(`
      id, name, name_ta, slug,
      price, discounted_price,
      images, stock_qty,
      low_stock_threshold,
      avg_rating, total_sold,
      product_categories (
        name, slug, icon
      )
    `)
    .eq('seller_id', user.id)
    .eq('status', 'active')
    .order('total_sold', { ascending: false });

  // ─── Query 3: Store reviews ───
  const { data: reviews } = await db
    .from('reviews')
    .select(`
      id, rating, title, body,
      created_at, helpful_count,
      profiles!reviewer_id (
        full_name, avatar_url
      )
    `)
    .eq('target_type', 'seller')
    .eq('target_id', user.id)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <StorePageClient
      sellerProfile={sellerProfile}
      products={products || []}
      reviews={reviews || []}
      userId={user.id}
    />
  );
}
