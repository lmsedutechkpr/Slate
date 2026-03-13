import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import OrdersPageClient from '@/components/student/orders/OrdersPageClient';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, payment_method,
      subtotal, discount_amount, total_amount,
      created_at, updated_at, payment_id,
      addresses:shipping_address_id (
        full_name, address_line1, address_line2,
        city, state, pincode, phone
      ),
      order_items (
        id, quantity, unit_price, total_price,
        fulfillment_status, tracking_number,
        product_name, product_image_url, product_id
      )
    `)
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });

  if (error) console.error('Orders fetch error:', error.message);

  return (
    <OrdersPageClient
      orders={(orders || []) as any[]}
      userId={user.id}
    />
  );
}
