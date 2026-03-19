import { createAdminClient } from '@/lib/supabase/server';

type AdminClient = ReturnType<typeof createAdminClient>;

type ProbeResult = {
  ok: boolean;
  error: string | null;
};

export type CommerceSchemaAnalysis = {
  tables: Record<string, boolean>;
  orders: {
    selectVariant: 'extended' | 'fallback' | 'minimal';
  };
  orderItems: {
    selectVariant: 'extended' | 'fallback' | 'minimal';
  };
  payouts: {
    sourceTable: 'payouts' | 'payout_transactions' | 'none';
    selectVariant: 'extended' | 'minimal' | 'legacy-extended' | 'legacy-minimal' | 'none';
  };
  payoutProfiles: {
    instructorTable: 'instructor_profiles' | 'instructor_payouts' | 'none';
    sellerTable: 'seller_profiles' | 'seller_payouts' | 'none';
  };
};

async function probeTable(admin: AdminClient, table: string): Promise<ProbeResult> {
  try {
    const { error } = await admin.from(table).select('*').limit(1);
    if (error) return { ok: false, error: error.message || 'unknown error' };
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'unknown error' };
  }
}

async function probeSelect(admin: AdminClient, table: string, select: string): Promise<ProbeResult> {
  try {
    const { error } = await admin.from(table).select(select).limit(1);
    if (error) return { ok: false, error: error.message || 'unknown error' };
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'unknown error' };
  }
}

export async function analyzeAdminCommerceSchema(): Promise<CommerceSchemaAnalysis> {
  const admin = createAdminClient();

  const tableNames = [
    'orders',
    'order_items',
    'products',
    'profiles',
    'addresses',
    'seller_profiles',
    'payouts',
    'payout_transactions',
    'instructor_profiles',
    'instructor_payouts',
    'seller_payouts',
  ];

  const tables: Record<string, boolean> = {};
  for (const table of tableNames) {
    const p = await probeTable(admin, table);
    tables[table] = p.ok;
  }

  let ordersVariant: CommerceSchemaAnalysis['orders']['selectVariant'] = 'minimal';
  if (tables.orders) {
    const extended = await probeSelect(
      admin,
      'orders',
      'id,status,payment_status,payment_method,payment_id,subtotal,discount_amount,total_amount,created_at,customer_id,shipping_address_id,order_number',
    );
    if (extended.ok) {
      ordersVariant = 'extended';
    } else {
      const fallback = await probeSelect(
        admin,
        'orders',
        'id,status,total_amount,created_at,customer_id,shipping_address_id,order_number',
      );
      ordersVariant = fallback.ok ? 'fallback' : 'minimal';
    }
  }

  let orderItemsVariant: CommerceSchemaAnalysis['orderItems']['selectVariant'] = 'minimal';
  if (tables.order_items) {
    const extended = await probeSelect(
      admin,
      'order_items',
      'id,order_id,product_id,seller_id,quantity,total_price,status,fulfillment_status,product_name,product_image_url',
    );
    if (extended.ok) {
      orderItemsVariant = 'extended';
    } else {
      const fallback = await probeSelect(
        admin,
        'order_items',
        'id,order_id,product_id,seller_id,quantity,total_price,status,product_name,product_image_url',
      );
      orderItemsVariant = fallback.ok ? 'fallback' : 'minimal';
    }
  }

  let payoutSource: CommerceSchemaAnalysis['payouts']['sourceTable'] = 'none';
  let payoutVariant: CommerceSchemaAnalysis['payouts']['selectVariant'] = 'none';

  if (tables.payouts) {
    const payoutExtended = await probeSelect(
      admin,
      'payouts',
      'id,recipient_id,recipient_type,amount,status,created_at,processed_at,payout_method,currency,notes,reference',
    );

    if (payoutExtended.ok) {
      payoutSource = 'payouts';
      payoutVariant = 'extended';
    } else {
      const payoutMinimal = await probeSelect(
        admin,
        'payouts',
        'id,recipient_id,recipient_type,amount,status,created_at',
      );
      if (payoutMinimal.ok) {
        payoutSource = 'payouts';
        payoutVariant = 'minimal';
      }
    }
  }

  if (payoutSource === 'none' && tables.payout_transactions) {
    const legacyExtended = await probeSelect(
      admin,
      'payout_transactions',
      'id,user_id,instructor_id,seller_id,amount,payout_method,status,created_at,processed_at,notes,reference',
    );

    if (legacyExtended.ok) {
      payoutSource = 'payout_transactions';
      payoutVariant = 'legacy-extended';
    } else {
      const legacyMinimal = await probeSelect(
        admin,
        'payout_transactions',
        'id,instructor_id,amount,payout_method,status,created_at,processed_at,notes',
      );
      if (legacyMinimal.ok) {
        payoutSource = 'payout_transactions';
        payoutVariant = 'legacy-minimal';
      }
    }
  }

  const instructorTable: CommerceSchemaAnalysis['payoutProfiles']['instructorTable'] = tables.instructor_profiles
    ? 'instructor_profiles'
    : tables.instructor_payouts
      ? 'instructor_payouts'
      : 'none';

  const sellerTable: CommerceSchemaAnalysis['payoutProfiles']['sellerTable'] = tables.seller_profiles
    ? 'seller_profiles'
    : tables.seller_payouts
      ? 'seller_payouts'
      : 'none';

  return {
    tables,
    orders: {
      selectVariant: ordersVariant,
    },
    orderItems: {
      selectVariant: orderItemsVariant,
    },
    payouts: {
      sourceTable: payoutSource,
      selectVariant: payoutVariant,
    },
    payoutProfiles: {
      instructorTable,
      sellerTable,
    },
  };
}
