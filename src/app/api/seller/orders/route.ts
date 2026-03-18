import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// GET: fetch a single order item with full joins (bypasses RLS)
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const itemId = req.nextUrl.searchParams.get('itemId');
  if (!itemId) return NextResponse.json({ error: 'Missing itemId' }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
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
    .eq('id', itemId)
    .eq('seller_id', user.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { orderItemId, newStatus, trackingNumber, trackingUrl, notifyCustomer } = body;

  if (!orderItemId || !newStatus) {
    return NextResponse.json({ error: 'Missing orderItemId or newStatus' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verify seller owns this order item
  const { data: item } = await admin
    .from('order_items')
    .select('id, order_id, product_name, seller_id')
    .eq('id', orderItemId)
    .eq('seller_id', user.id)
    .single();

  if (!item) {
    return NextResponse.json({ error: 'Order item not found' }, { status: 404 });
  }

  // Build update payload for order_items
  const itemPayload: any = { fulfillment_status: newStatus };
  if (newStatus === 'shipped') {
    if (trackingNumber) itemPayload.tracking_number = trackingNumber;
    if (trackingUrl) itemPayload.tracking_url = trackingUrl;
    itemPayload.shipped_at = new Date().toISOString();
  }
  if (newStatus === 'delivered') {
    itemPayload.delivered_at = new Date().toISOString();
  }

  // Update order_items
  const { error: updateErr } = await admin
    .from('order_items')
    .update(itemPayload)
    .eq('id', orderItemId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Sync parent order: always update updated_at, sync status if all items match
  if (item.order_id) {
    const { data: allItems } = await admin
      .from('order_items')
      .select('fulfillment_status')
      .eq('order_id', item.order_id);

    const orderUpdate: any = { updated_at: new Date().toISOString() };
    if (allItems?.every((i: any) => i.fulfillment_status === newStatus)) {
      orderUpdate.status = newStatus;
    }
    await admin.from('orders').update(orderUpdate).eq('id', item.order_id);

    // Notify customer
    if (notifyCustomer !== false) {
      const { data: order } = await admin
        .from('orders')
        .select('customer_id')
        .eq('id', item.order_id)
        .single();

      if (order?.customer_id) {
        const titles: Record<string, string> = {
          processing: 'Your order is being prepared',
          shipped: 'Your order is on the way!',
          delivered: 'Order delivered',
          cancelled: 'Order cancelled',
        };
        await admin.from('notifications').insert({
          user_id: order.customer_id,
          title: titles[newStatus] || 'Order update',
          body: `Your order for "${item.product_name}" has been updated to ${newStatus}.`,
          type: 'order_update',
          metadata: { order_id: item.order_id, order_item_id: orderItemId },
        });
      }
    }
  }

  return NextResponse.json({ success: true, payload: itemPayload });
}
