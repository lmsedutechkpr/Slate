import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// POST: Cancel an order (student-side) — uses admin client to update order_items
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { orderId, action } = body;

  if (!orderId || action !== 'cancel') {
    return NextResponse.json({ error: 'Missing orderId or invalid action' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verify the student owns this order
  const { data: order } = await admin
    .from('orders')
    .select('id, customer_id, status')
    .eq('id', orderId)
    .eq('customer_id', user.id)
    .single();

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Only allow cancellation of pending/confirmed orders
  if (!['pending', 'confirmed'].includes(order.status)) {
    return NextResponse.json({ error: 'Order cannot be cancelled in its current status' }, { status: 400 });
  }

  // Cancel the parent order
  const { error: orderErr } = await admin
    .from('orders')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (orderErr) {
    return NextResponse.json({ error: orderErr.message }, { status: 500 });
  }

  // Cancel ALL order_items (this is the part that was failing due to RLS)
  const { error: itemsErr } = await admin
    .from('order_items')
    .update({ fulfillment_status: 'cancelled' })
    .eq('order_id', orderId);

  if (itemsErr) {
    return NextResponse.json({ error: itemsErr.message }, { status: 500 });
  }

  // Notify each seller that has items in this order
  const { data: items } = await admin
    .from('order_items')
    .select('seller_id, product_name')
    .eq('order_id', orderId);

  if (items) {
    const sellerIds = [...new Set(items.map(i => i.seller_id).filter(Boolean))];
    for (const sellerId of sellerIds) {
      const itemName = items.find(i => i.seller_id === sellerId)?.product_name || 'an item';
      await admin.from('notifications').insert({
        user_id: sellerId,
        title: 'Order cancelled by customer',
        body: `A customer cancelled their order for "${itemName}".`,
        type: 'order_update',
        metadata: { order_id: orderId },
      });
    }
  }

  return NextResponse.json({ success: true });
}
