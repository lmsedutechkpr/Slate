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
    const resolution = String(body?.resolution || 'refund_full').trim();
    const note = String(body?.note || '').trim();

    if (!returnId) {
      return NextResponse.json({ error: 'returnId is required' }, { status: 400 });
    }

    if (source === 'support_tickets') {
      const { data: ticket } = await admin
        .from('support_tickets')
        .select('id,user_id,title,metadata')
        .eq('id', returnId)
        .single();

      if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

      const metadata = {
        ...(ticket.metadata || {}),
        mediation: { resolution, note, started_at: new Date().toISOString() },
      };
      const { error: updateErr } = await admin
        .from('support_tickets')
        .update({ status: 'disputed', metadata })
        .eq('id', returnId);

      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

      await admin.from('notifications').insert({
        user_id: ticket.user_id,
        title: 'Admin mediation started',
        body: `Your return request for "${ticket.title || 'your order'}" is now under admin mediation.${note ? ` Note: ${note}` : ''}`,
        type: 'return_mediation',
        metadata: { ticket_id: returnId, resolution },
      });

      return NextResponse.json({ success: true });
    }

    const { data: item } = await admin
      .from('returns')
      .select('id,user_id,order_item_id,reason,order_items!order_item_id(product_name,seller_id)')
      .eq('id', returnId)
      .single();

    if (!item) return NextResponse.json({ error: 'Return not found' }, { status: 404 });

    const now = new Date().toISOString();
    let updateErr: any = null;

    ({ error: updateErr } = await admin
      .from('returns')
      .update({
        status: 'disputed',
        resolution,
        resolution_note: note || null,
        updated_at: now,
      })
      .eq('id', returnId));

    if (updateErr) {
      ({ error: updateErr } = await admin.from('returns').update({ status: 'disputed', updated_at: now }).eq('id', returnId));
    }

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    const sellerId = (item.order_items as any)?.seller_id || null;
    const productName = (item.order_items as any)?.product_name || 'your order';

    const notifications = [
      {
        user_id: item.user_id,
        title: 'Admin mediation started',
        body: `Your return request for "${productName}" is now under admin mediation.${note ? ` Note: ${note}` : ''}`,
        type: 'return_mediation',
        metadata: { return_id: returnId, resolution },
      },
    ];

    if (sellerId) {
      notifications.push({
        user_id: sellerId,
        title: 'Return dispute requires attention',
        body: `An admin started mediation for a return on "${productName}".${note ? ` Note: ${note}` : ''}`,
        type: 'return_mediation',
        metadata: { return_id: returnId, resolution },
      });
    }

    await admin.from('notifications').insert(notifications);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
  }
}
