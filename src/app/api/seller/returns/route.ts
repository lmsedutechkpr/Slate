import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// GET: fetch a single return with full joins
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const returnId = req.nextUrl.searchParams.get('returnId');
  if (!returnId) return NextResponse.json({ error: 'Missing returnId' }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('returns')
    .select(`
      id, order_id, order_item_id, user_id, reason, description, status,
      resolution, resolution_note, resolved_at, created_at,
      orders!order_id (
        id, order_number, customer_id, total_amount, created_at,
        profiles:customer_id ( id, full_name, avatar_url, phone )
      ),
      order_items!order_item_id (
        id, product_name, product_image_url, quantity, unit_price, total_price, seller_id
      )
    `)
    .eq('id', returnId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ returnItem: data });
}

// POST: resolve a return (approve/reject/refund)
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { returnId, action, resolution_note } = body;

  if (!returnId || !action) {
    return NextResponse.json({ error: 'Missing returnId or action' }, { status: 400 });
  }

  if (!['approved', 'rejected', 'refunded'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Fetch the return to verify it exists and get related data
  const { data: returnItem } = await admin
    .from('returns')
    .select('id, order_id, order_item_id, user_id, status, order_items!order_item_id ( seller_id, product_name )')
    .eq('id', returnId)
    .single();

  if (!returnItem) {
    return NextResponse.json({ error: 'Return not found' }, { status: 404 });
  }

  // Verify seller owns this item (if linked to an order_item)
  if (returnItem.order_items && (returnItem.order_items as any).seller_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Update the return
  const updatePayload: any = {
    status: action,
    resolution: action,
    resolved_at: new Date().toISOString(),
  };
  if (resolution_note) {
    updatePayload.resolution_note = resolution_note;
  }

  const { error: updateErr } = await admin
    .from('returns')
    .update(updatePayload)
    .eq('id', returnId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // If approved or refunded, update order_item fulfillment_status to 'returned'
  if ((action === 'approved' || action === 'refunded') && returnItem.order_item_id) {
    await admin
      .from('order_items')
      .update({ fulfillment_status: 'returned' })
      .eq('id', returnItem.order_item_id);
  }

  // Notify customer
  const titles: Record<string, string> = {
    approved: 'Return request approved',
    rejected: 'Return request declined',
    refunded: 'Refund processed',
  };
  const bodies: Record<string, string> = {
    approved: `Your return request for "${(returnItem.order_items as any)?.product_name || 'your order'}" has been approved.${resolution_note ? ' Note: ' + resolution_note : ''}`,
    rejected: `Your return request for "${(returnItem.order_items as any)?.product_name || 'your order'}" has been declined.${resolution_note ? ' Reason: ' + resolution_note : ''}`,
    refunded: `A refund has been processed for "${(returnItem.order_items as any)?.product_name || 'your order'}".${resolution_note ? ' Note: ' + resolution_note : ''}`,
  };

  await admin.from('notifications').insert({
    user_id: returnItem.user_id,
    title: titles[action] || 'Return update',
    body: bodies[action] || 'Your return request has been updated.',
    type: 'return_update',
    metadata: { return_id: returnId, order_id: returnItem.order_id },
  });

  return NextResponse.json({ success: true, status: action });
}
