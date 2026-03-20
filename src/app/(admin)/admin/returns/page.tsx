import { redirect } from 'next/navigation';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import ReturnsPageClient from '../../../../components/admin/returns/ReturnsPageClient';

export const dynamic = 'force-dynamic';

type Row = Record<string, any>;

function parseTicketPayload(ticket: any): Row {
  const body = ticket?.body;
  if (body && typeof body === 'object') return body as Row;
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      if (parsed && typeof parsed === 'object') return parsed as Row;
    } catch {
      // ignore invalid JSON body
    }
  }
  return {};
}

async function fetchReturns(admin: ReturnType<typeof createAdminClient>) {
  try {
    const { data, error } = await admin
      .from('returns')
      .select('id,reason,description,status,created_at,updated_at,seller_response,resolved_at,order_id,order_item_id,user_id')
      .order('created_at', { ascending: false });

    if (!error) return { rows: (data || []) as Row[], source: 'returns' as const };
  } catch {
    // fallback below
  }

  try {
    const { data, error } = await admin
      .from('support_tickets')
      .select('id,category,status,title,subject,description,body,created_at,updated_at,user_id,metadata')
      .eq('category', 'returns')
      .order('created_at', { ascending: false });

    if (!error) {
      const mapped = (data || []).map((t: any) => {
        const payload = parseTicketPayload(t);
        const metadata = t.metadata && typeof t.metadata === 'object' ? t.metadata : {};
        return {
          id: t.id,
          reason: payload.reason || metadata.reason || t.subject || t.title || 'return_request',
          description: payload.description || metadata.description || t.description || '',
          status: payload.status || metadata.status || t.status || 'requested',
          created_at: t.created_at,
          updated_at: t.updated_at,
          seller_response: payload.seller_response || metadata.seller_response || null,
          resolved_at: payload.resolved_at || metadata.resolved_at || null,
          order_id: payload.order_id || metadata.order_id || null,
          order_item_id: payload.order_item_id || metadata.order_item_id || null,
          user_id: payload.user_id || t.user_id,
        };
      });
      return { rows: mapped as Row[], source: 'support_tickets' as const };
    }
  } catch {
    // ignore
  }

  return { rows: [] as Row[], source: 'none' as const };
}

export default async function AdminReturnsPage() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') redirect('/student/dashboard');

  const [{ rows: returnRows, source }, orderCountRes] = await Promise.all([
    fetchReturns(admin),
    admin.from('orders').select('*', { count: 'exact', head: true }),
  ]);

  const userIds = Array.from(new Set(returnRows.map((r) => String(r.user_id || '').trim()).filter(Boolean)));
  const orderItemIds = Array.from(new Set(returnRows.map((r) => String(r.order_item_id || '').trim()).filter(Boolean)));

  const [profilesRes, orderItemsRes] = await Promise.all([
    userIds.length
      ? admin.from('profiles').select('id,full_name,avatar_url,display_name').in('id', userIds)
      : Promise.resolve({ data: [] as any[], error: null as any }),
    orderItemIds.length
      ? admin
          .from('order_items')
          .select('id,quantity,unit_price,total_price,product_id,seller_id,product_name,product_image_url')
          .in('id', orderItemIds)
      : Promise.resolve({ data: [] as any[], error: null as any }),
  ]);

  const orderItems = (orderItemsRes.data || []) as Row[];
  const productIds = Array.from(new Set(orderItems.map((i) => String(i.product_id || '').trim()).filter(Boolean)));
  const sellerIds = Array.from(new Set(orderItems.map((i) => String(i.seller_id || '').trim()).filter(Boolean)));

  const [productsRes, sellerProfilesRes] = await Promise.all([
    productIds.length
      ? admin.from('products').select('id,name,images').in('id', productIds)
      : Promise.resolve({ data: [] as any[], error: null as any }),
    sellerIds.length
      ? admin.from('seller_profiles').select('user_id,store_name').in('user_id', sellerIds)
      : Promise.resolve({ data: [] as any[], error: null as any }),
  ]);

  const sellerUserIds = Array.from(new Set(((sellerProfilesRes.data || []) as Row[]).map((s) => String(s.user_id || '').trim()).filter(Boolean)));
  const sellerUsersRes = sellerUserIds.length
    ? await admin.from('profiles').select('id,full_name,avatar_url').in('id', sellerUserIds)
    : { data: [] as any[], error: null as any };

  const profilesMap = new Map<string, Row>();
  (profilesRes.data || []).forEach((p: any) => profilesMap.set(String(p.id), p));

  const productMap = new Map<string, Row>();
  (productsRes.data || []).forEach((p: any) => productMap.set(String(p.id), p));

  const sellerMap = new Map<string, Row>();
  (sellerProfilesRes.data || []).forEach((s: any) => sellerMap.set(String(s.user_id), s));

  const sellerUserMap = new Map<string, Row>();
  (sellerUsersRes.data || []).forEach((u: any) => sellerUserMap.set(String(u.id), u));

  const orderItemMap = new Map<string, Row>();
  orderItems.forEach((item) => {
    const seller = sellerMap.get(String(item.seller_id || '')) || null;
    const sellerUser = seller ? sellerUserMap.get(String(seller.user_id || '')) || null : null;
    const product = item.product_id ? productMap.get(String(item.product_id)) || null : null;

    orderItemMap.set(String(item.id), {
      ...item,
      products: {
        id: product?.id || item.product_id || null,
        name: product?.name || item.product_name || 'Product',
        images: product?.images || (item.product_image_url ? [item.product_image_url] : []),
      },
      seller_profiles: {
        user_id: seller?.user_id || item.seller_id || null,
        store_name: seller?.store_name || 'Seller',
        profiles: sellerUser,
      },
    });
  });

  const hydrated = returnRows.map((row) => {
    const user = profilesMap.get(String(row.user_id || '')) || null;
    const item = orderItemMap.get(String(row.order_item_id || '')) || null;
    return {
      ...row,
      source,
      profiles: user,
      order_items: item,
    };
  });

  return (
    <div className="p-6">
      <ReturnsPageClient returnsData={hydrated} totalOrders={orderCountRes.count || 0} />
    </div>
  );
}
