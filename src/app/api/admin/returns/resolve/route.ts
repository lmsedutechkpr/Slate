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
    const action = String(body?.action || '').toLowerCase();

    if (!returnId || !['approved', 'rejected'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    if (source === 'support_tickets') {
      const { data: ticket } = await admin
        .from('support_tickets')
        .select('id,user_id,title,metadata')
        .eq('id', returnId)
        .single();

      if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

      const metadata = { ...(ticket.metadata || {}), resolved_at: new Date().toISOString() };
      const { error: updateErr } = await admin
        .from('support_tickets')
        .update({ status: action, metadata })
        .eq('id', returnId);

      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

      await admin.from('notifications').insert({
        user_id: ticket.user_id,
        title: action === 'approved' ? 'Return approved' : 'Return rejected',
        body:
          action === 'approved'
            ? `Your return request for "${ticket.title || 'your order'}" has been approved.`
            : `Your return request for "${ticket.title || 'your order'}" has been rejected.`,
        type: 'return_update',
        metadata: { ticket_id: returnId },
      });

      return NextResponse.json({ success: true });
    }

    const { data: item } = await admin
      .from('returns')
      .select('id,user_id,order_item_id,reason,order_items!order_item_id(product_name,seller_id)')
      .eq('id', returnId)
      .single();

    if (!item) return NextResponse.json({ error: 'Return not found' }, { status: 404 });

    const updatePayload: Record<string, any> = {
      status: action,
      resolution: action,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: updateErr } = await admin.from('returns').update(updatePayload).eq('id', returnId);
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    if (action === 'approved' && item.order_item_id) {
      await admin.from('order_items').update({ fulfillment_status: 'returned' }).eq('id', item.order_item_id);
    }

    await admin.from('notifications').insert({
      user_id: item.user_id,
      title: action === 'approved' ? 'Return approved' : 'Return rejected',
      body:
        action === 'approved'
          ? `Your return request for "${(item.order_items as any)?.product_name || 'your order'}" has been approved.`
          : `Your return request for "${(item.order_items as any)?.product_name || 'your order'}" has been rejected.`,
      type: 'return_update',
      metadata: { return_id: returnId, reason: item.reason },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
  }
}
