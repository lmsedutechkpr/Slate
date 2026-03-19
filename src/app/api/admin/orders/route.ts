import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { analyzeAdminCommerceSchema } from '@/lib/admin/commerceSchema';

type OrderRow = Record<string, any>;

export async function hydrateOrders(admin: ReturnType<typeof createAdminClient>, baseOrders: OrderRow[]) {
  if (!baseOrders.length) return [] as OrderRow[];

  const orderIds = baseOrders.map((o) => o.id).filter(Boolean);

  const customerIds = Array.from(
    new Set(
      baseOrders
        .map((o) => String(o.customer_id || o.user_id || '').trim())
        .filter(Boolean),
    ),
  );

  const shippingAddressIds = Array.from(
    new Set(
      baseOrders
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
    const schema = await analyzeAdminCommerceSchema();
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

  return baseOrders.map((order) => {
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

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const orderId = req.nextUrl.searchParams.get('orderId');
    const admin = createAdminClient();
    const schema = await analyzeAdminCommerceSchema();

    let query = admin
      .from('orders')
      .select(
        schema.orders.selectVariant === 'extended'
          ? 'id,status,payment_status,payment_method,payment_id,subtotal,discount_amount,total_amount,created_at,customer_id,shipping_address_id,order_number'
          : 'id,status,total_amount,created_at,customer_id,shipping_address_id,order_number',
      )
      .order('created_at', { ascending: false })
      .limit(200);

    if (orderId) {
      query = query.eq('id', orderId).limit(1);
    }

    let { data: baseOrders, error } = await query;
    if (error || !baseOrders) {
      let fallbackQuery = admin
        .from('orders')
        .select('id,status,total_amount,created_at,customer_id,shipping_address_id,order_number')
        .order('created_at', { ascending: false })
        .limit(200);
      if (orderId) fallbackQuery = fallbackQuery.eq('id', orderId).limit(1);

      ({ data: baseOrders, error } = await fallbackQuery);
    }

    if (error || !baseOrders) {
      let minimalQuery = admin
        .from('orders')
        .select('id,total_amount,created_at,customer_id,shipping_address_id,order_number')
        .order('created_at', { ascending: false })
        .limit(200);
      if (orderId) minimalQuery = minimalQuery.eq('id', orderId).limit(1);

      ({ data: baseOrders, error } = await minimalQuery);
    }

    if (error || !baseOrders) {
      return NextResponse.json({ error: error?.message || 'Failed to load orders' }, { status: 500 });
    }

    const hydrated = await hydrateOrders(admin, (baseOrders || []) as OrderRow[]);

    if (orderId) {
      return NextResponse.json({ order: hydrated[0] || null });
    }

    return NextResponse.json({ orders: hydrated });
  } catch {
    return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 });
  }
}
