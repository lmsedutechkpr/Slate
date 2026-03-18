import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ReturnsPageClient from '@/components/seller/returns/ReturnsPageClient';

export const dynamic = 'force-dynamic';

export default async function SellerReturnsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'seller') redirect('/student/dashboard');

  const admin = createAdminClient();

  // Try fetching from "returns" table first
  let returns: any[] = [];
  let useFallback = false;

  const { data: returnRows, error: returnErr } = await admin
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
    .order('created_at', { ascending: false });

  if (returnErr) {
    // Fallback: query support_tickets where category = 'returns'
    useFallback = true;
    const { data: tickets } = await admin
      .from('support_tickets')
      .select('id, user_id, subject, body, status, category, created_at')
      .eq('category', 'returns')
      .order('created_at', { ascending: false });

    if (tickets) {
      returns = tickets.map((t: any) => {
        let parsed: any = {};
        try { parsed = JSON.parse(t.body); } catch {}
        return {
          id: t.id,
          order_id: parsed.order_id || null,
          order_item_id: parsed.order_item_id || null,
          user_id: t.user_id,
          reason: parsed.reason || t.subject,
          description: parsed.description || '',
          status: t.status === 'open' ? 'requested' : t.status === 'closed' ? 'resolved' : t.status,
          resolution: null,
          resolution_note: null,
          resolved_at: null,
          created_at: t.created_at,
          orders: null,
          order_items: null,
          _fallback: true,
        };
      });
    }
  } else {
    // Filter to only returns for this seller's order items
    returns = (returnRows || []).filter((r: any) => {
      if (r.order_items?.seller_id === user.id) return true;
      // If no order_item link, include it (might be order-level return)
      if (!r.order_item_id) return true;
      return false;
    });
  }

  // If fallback was used, enrich with order/profile data
  if (useFallback && returns.length > 0) {
    const orderIds = [...new Set(returns.map(r => r.order_id).filter(Boolean))];
    const userIds = [...new Set(returns.map(r => r.user_id).filter(Boolean))];

    if (orderIds.length > 0) {
      const { data: orders } = await admin
        .from('orders')
        .select('id, order_number, customer_id, total_amount, created_at')
        .in('id', orderIds);
      const orderMap = new Map((orders || []).map((o: any) => [o.id, o]));
      returns = returns.map(r => ({ ...r, orders: orderMap.get(r.order_id) || null }));
    }

    if (userIds.length > 0) {
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, full_name, avatar_url, phone')
        .in('id', userIds);
      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      returns = returns.map(r => ({
        ...r,
        customer: profileMap.get(r.user_id) || null,
      }));
    }
  }

  // Compute stats
  let requested = 0;
  let approved = 0;
  let rejected = 0;
  let refunded = 0;

  returns.forEach((r: any) => {
    const s = r.status;
    if (s === 'requested') requested++;
    else if (s === 'approved') approved++;
    else if (s === 'rejected') rejected++;
    else if (s === 'refunded' || s === 'resolved') refunded++;
  });

  const stats = {
    total: returns.length,
    requested,
    approved,
    rejected,
    refunded,
  };

  return (
    <ReturnsPageClient
      initialReturns={returns}
      stats={stats}
      userId={user.id}
      useFallback={useFallback}
    />
  );
}
