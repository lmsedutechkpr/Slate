import { redirect } from 'next/navigation';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import OrdersPageClient from '@/components/admin/orders/OrdersPageClient';
import { analyzeAdminCommerceSchema } from '@/lib/admin/commerceSchema';

import { hydrateOrders } from '@/app/api/admin/orders/route';

function toNumber(v: unknown) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}

function normalizeOrderStatus(value: unknown) {
  const s = String(value || '').toLowerCase();
  return s === 'confirmed' ? 'pending' : s;
}

async function fetchAdminOrders(admin: ReturnType<typeof createAdminClient>) {
  const schema = await analyzeAdminCommerceSchema();

  let baseOrders: any[] | null = null;
  let ordersError: any = null;

  if (schema.orders.selectVariant === 'extended') {
    ({ data: baseOrders, error: ordersError } = await admin
      .from('orders')
      .select(
        'id,status,payment_status,payment_method,payment_id,subtotal,discount_amount,total_amount,created_at,customer_id,shipping_address_id,order_number',
      )
      .order('created_at', { ascending: false })
      .limit(200));
  }

  if (ordersError || !baseOrders || schema.orders.selectVariant !== 'extended') {
    ({ data: baseOrders, error: ordersError } = await admin
      .from('orders')
      .select('id,status,total_amount,created_at,customer_id,shipping_address_id,order_number')
      .order('created_at', { ascending: false })
      .limit(200));
  }

  if (ordersError || !baseOrders) {
    ({ data: baseOrders, error: ordersError } = await admin
      .from('orders')
      .select('id,total_amount,created_at,customer_id,shipping_address_id,order_number')
      .order('created_at', { ascending: false })
      .limit(200));
  }

  if (ordersError || !baseOrders) {
    return [] as any[];
  }

  const orders = baseOrders as any[];
  const orderIds = orders.map((o) => o.id).filter(Boolean);

  const customerIds = Array.from(
    new Set(
      orders
        .map((o) => String(o.customer_id || o.user_id || '').trim())
        .filter(Boolean),
    ),
  );

  const shippingAddressIds = Array.from(
    new Set(
      orders
        .map((o) => String(o.shipping_address_id || '').trim())
        .filter(Boolean),
    ),
  );

  const profilesMap = new Map<string, any>();
  if (customerIds.length) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id,full_name,display_name,avatar_url,role')
      .in('id', customerIds);
    (profiles || []).forEach((p: any) => profilesMap.set(String(p.id), p));
  }

  const addressesMap = new Map<string, any>();
  if (shippingAddressIds.length) {
    const { data: addresses } = await admin
      .from('addresses')
      .select('id,full_name,city,state,address_line1,address_line2,pincode,phone')
      .in('id', shippingAddressIds);
    (addresses || []).forEach((a: any) => addressesMap.set(String(a.id), a));
  }

  let orderItems: any[] = [];
  if (orderIds.length) {
    let itemRows: any[] | null = null;
    let itemError: any = null;

    if (schema.orderItems.selectVariant === 'extended') {
      ({ data: itemRows, error: itemError } = await admin
        .from('order_items')
        .select(
          'id,order_id,product_id,seller_id,quantity,total_price,status,fulfillment_status,product_name,product_image_url',
        )
        .in('order_id', orderIds));
    }

    if (itemError || !itemRows || schema.orderItems.selectVariant !== 'extended') {
      ({ data: itemRows, error: itemError } = await admin
        .from('order_items')
        .select('id,order_id,product_id,seller_id,quantity,total_price,status,product_name,product_image_url')
        .in('order_id', orderIds));
    }

    if (itemError || !itemRows) {
      ({ data: itemRows, error: itemError } = await admin
        .from('order_items')
        .select('id,order_id,product_id,seller_id,quantity,total_price,product_name,product_image_url')
        .in('order_id', orderIds));
    }

    orderItems = itemRows || [];
  }

  const productIds = Array.from(
    new Set(orderItems.map((i) => String(i.product_id || '').trim()).filter(Boolean)),
  );
  const sellerIds = Array.from(
    new Set(orderItems.map((i) => String(i.seller_id || '').trim()).filter(Boolean)),
  );

  const productsMap = new Map<string, any>();
  if (productIds.length) {
    const { data: products } = await admin
      .from('products')
      .select('id,name,images')
      .in('id', productIds);
    (products || []).forEach((p: any) => productsMap.set(String(p.id), p));
  }

  const sellerMap = new Map<string, any>();
  if (sellerIds.length) {
    const { data: sellers } = await admin
      .from('seller_profiles')
      .select('user_id,store_name')
      .in('user_id', sellerIds);
    (sellers || []).forEach((s: any) => sellerMap.set(String(s.user_id), s));
  }

  const itemsByOrder = new Map<string, any[]>();
  orderItems.forEach((item) => {
    const oid = String(item.order_id || '').trim();
    if (!oid) return;

    const status = item.fulfillment_status || item.status || 'pending';
    const product = item.product_id ? productsMap.get(String(item.product_id)) : null;
    const seller = item.seller_id ? sellerMap.get(String(item.seller_id)) : null;

    const normalized = {
      ...item,
      status,
      products: {
        id: product?.id || item.product_id || null,
        name: product?.name || item.product_name || 'Product',
        images: product?.images || (item.product_image_url ? [item.product_image_url] : []),
      },
      seller_profiles: {
        store_name: seller?.store_name || 'Seller',
      },
    };

    if (!itemsByOrder.has(oid)) itemsByOrder.set(oid, []);
    itemsByOrder.get(oid)!.push(normalized);
  });

  return orders.map((order) => {
    const customerId = String(order.customer_id || order.user_id || '').trim();
    const shippingId = String(order.shipping_address_id || '').trim();
    return {
      ...order,
      profiles: customerId ? profilesMap.get(customerId) || null : null,
      addresses: shippingId ? addressesMap.get(shippingId) || null : null,
      order_items: itemsByOrder.get(String(order.id)) || [],
    };
  });
}

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') redirect('/student/dashboard');

  const orders = await fetchAdminOrders(admin);

  const totalOrders = orders.length;
  const totalRevenue = orders
    .filter((o) => {
      const payment = String(o.payment_status || '').toLowerCase();
      const status = normalizeOrderStatus(o.status);
      if (payment) return payment === 'paid';
      return status !== 'cancelled' && status !== 'failed' && status !== 'refunded';
    })
    .reduce((sum, o) => sum + toNumber(o.total_amount), 0);

  const by = (s: string) => orders.filter((o) => normalizeOrderStatus(o.status) === s).length;

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayRevenue = orders
    .filter((o) => (o.created_at || '').slice(0, 10) === todayKey)
    .reduce((sum, o) => sum + toNumber(o.total_amount), 0);

  const stats = {
    totalOrders,
    totalRevenue,
    pendingOrders: by('pending'),
    processingOrders: by('processing'),
    shippedOrders: by('shipped'),
    deliveredOrders: by('delivered'),
    cancelledOrders: by('cancelled'),
    refundedOrders: by('refunded'),
    todayRevenue,
    avgOrderValue: totalOrders ? totalRevenue / totalOrders : 0,
  };

  return <OrdersPageClient orders={orders} stats={stats} />;
}
