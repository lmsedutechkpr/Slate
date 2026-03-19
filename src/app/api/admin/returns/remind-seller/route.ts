import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

async function ensureAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { admin: createAdminClient() };
}

export async function POST(req: Request) {
  const guard = await ensureAdmin();
  if (guard.error) return guard.error;
  const admin = guard.admin!;

  try {
    const body = await req.json();
    const returnId = String(body?.returnId || '').trim();
    const source = String(body?.source || 'returns').trim();

    if (!returnId) return NextResponse.json({ error: 'returnId is required' }, { status: 400 });

    if (source === 'support_tickets') {
      const { data: ticket } = await admin
        .from('support_tickets')
        .select('id,title,metadata')
        .eq('id', returnId)
        .single();

      if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

      const sellerId = ticket.metadata?.seller_id || ticket.metadata?.order_item?.seller_id || null;
      if (!sellerId) return NextResponse.json({ error: 'No seller linked to this request' }, { status: 400 });

      await admin.from('notifications').insert({
        user_id: sellerId,
        title: 'Seller response reminder',
        body: `Please respond to return request "${ticket.title || returnId}".`,
        type: 'return_reminder',
        metadata: { ticket_id: returnId },
      });

      return NextResponse.json({ success: true });
    }

    const { data: item } = await admin
      .from('returns')
      .select('id,order_item_id,order_items!order_item_id(seller_id,product_name)')
      .eq('id', returnId)
      .single();

    if (!item) return NextResponse.json({ error: 'Return not found' }, { status: 404 });

    const sellerId = (item.order_items as any)?.seller_id || null;
    if (!sellerId) return NextResponse.json({ error: 'No seller linked to this return' }, { status: 400 });

    await admin.from('notifications').insert({
      user_id: sellerId,
      title: 'Seller response reminder',
      body: `Please respond to return request for "${(item.order_items as any)?.product_name || 'a product'}".`,
      type: 'return_reminder',
      metadata: { return_id: returnId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
  }
}
