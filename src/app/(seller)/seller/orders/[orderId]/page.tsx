import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import OrderDetailClient from '@/components/seller/orders/OrderDetailClient';

export const dynamic = 'force-dynamic';

export default async function SellerOrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
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

  const { data: orderItem } = await admin
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
    .eq('id', orderId)
    .eq('seller_id', user.id)
    .single();

  if (!orderItem) redirect('/seller/orders');

  return (
    <OrderDetailClient
      orderItem={orderItem}
      userId={user.id}
    />
  );
}
