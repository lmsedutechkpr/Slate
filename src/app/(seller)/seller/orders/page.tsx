import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import OrdersPageClient from '@/components/seller/orders/OrdersPageClient';

export const dynamic = 'force-dynamic';

export default async function SellerOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'seller') redirect('/student/dashboard');

  // Use admin client to bypass RLS (seller can't read orders table directly)
  const admin = createAdminClient();

  // Fetch order items for this seller with full joins
  const { data: orderItems, error } = await admin
    .from('order_items')
    .select(`
      id, quantity, unit_price, total_price, fulfillment_status,
      tracking_number, tracking_url, product_name, product_image_url,
      products ( id, name, images, slug ),
      orders (
        id, order_number, customer_id, status, payment_method, created_at, updated_at, total_amount,
        profiles:customer_id ( id, full_name, avatar_url, phone ),
        addresses:shipping_address_id ( full_name, phone, address_line1, address_line2, city, state, pincode )
      )
    `)
    .eq('seller_id', user.id);

  if (error) {
    console.error('[Orders Page] Query error:', error.message);
  }

  const items: any[] = orderItems || [];

  items.sort((a: any, b: any) =>
    new Date(b.orders?.created_at).getTime() - new Date(a.orders?.created_at).getTime()
  );

  // Compute stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let totalRevenue = 0;
  let pendingOrders = 0;
  let processingOrders = 0;
  let shippedOrders = 0;
  let deliveredOrders = 0;
  let cancelledOrders = 0;
  let todayOrders = 0;

  items.forEach((i) => {
    const s = i.fulfillment_status;
    if (s !== 'cancelled') totalRevenue += i.total_price || 0;
    if (s === 'pending' || s === 'confirmed') pendingOrders++;
    if (s === 'processing') processingOrders++;
    if (s === 'shipped') shippedOrders++;
    if (s === 'delivered') deliveredOrders++;
    if (s === 'cancelled') cancelledOrders++;
    if (new Date(i.orders?.created_at) >= today) todayOrders++;
  });

  const stats = {
    totalOrders: items.length,
    pendingOrders,
    processingOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    totalRevenue,
    todayOrders,
  };

  return (
    <OrdersPageClient
      initialOrderItems={items}
      stats={stats}
      userId={user.id}
    />
  );
}
