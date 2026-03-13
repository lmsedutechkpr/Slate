import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import OrderDetailClient from '@/components/student/orders/OrderDetailClient';

export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({
  params,
}: {
  params: { orderId: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, payment_method, payment_id,
      subtotal, discount_amount, total_amount,
      created_at, updated_at,
      addresses:shipping_address_id (
        full_name, phone, address_line1, address_line2,
        city, state, pincode, country
      ),
      order_items (
        id, quantity, unit_price, total_price,
        fulfillment_status, tracking_number, tracking_url,
        product_name, product_name_ta, product_image_url,
        product_id, shipped_at, delivered_at
      ),
      coupons ( code, discount_type, discount_value )
    `)
    .eq('id', params.orderId)
    .eq('customer_id', user.id)
    .single();

  if (error) console.error('Order detail fetch error:', error.message);
  if (!order) redirect('/student/orders');

  return (
    <OrderDetailClient
      order={order as any}
      userId={user.id}
    />
  );
}
