import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import AnalyticsPageClient from '@/components/seller/analytics/AnalyticsPageClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Analytics – Slate Seller',
  description: 'Store performance insights and sales analytics.',
};

function adminDb() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function SellerAnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const db = adminDb();

  const [orderItemsRes, productsRes] = await Promise.all([
    db.from('order_items')
      .select(`
        id, quantity, unit_price, total_price, status, created_at,
        products (
          id, name, images,
          product_categories ( id, name, slug )
        ),
        orders (
          id, user_id, created_at,
          addresses ( city, state )
        )
      `)
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false }),
    db.from('products')
      .select(`
        id, name, images, price,
        total_sold, avg_rating, stock_qty, created_at,
        product_categories ( name )
      `)
      .eq('seller_id', user.id)
      .eq('status', 'active'),
  ]);

  return (
    <AnalyticsPageClient
      orderItems={orderItemsRes.data ?? []}
      products={productsRes.data ?? []}
      userId={user.id}
    />
  );
}
