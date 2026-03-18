import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import PayoutsPageClient from '@/components/seller/payouts/PayoutsPageClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Payouts – Slate Seller',
  description: 'Track your store earnings and manage payout settings.',
};

function adminDb() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function SellerPayoutsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const db = adminDb();

  // ─── Query 1: Seller profile ───
  const { data: sellerProfile } = await db
    .from('seller_profiles')
    .select('total_revenue, pending_payout, commission_rate, payout_method, payout_details, total_paid_out, total_orders')
    .eq('user_id', user.id)
    .single();

  const commissionRate = sellerProfile?.commission_rate ?? 85;

  // ─── Query 2: Order items (transactions) ───
  const { data: orderItems } = await db
    .from('order_items')
    .select(`
      id, total_price, unit_price,
      quantity, status, created_at,
      products ( id, name, images )
    `)
    .eq('seller_id', user.id)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false });

  const items = orderItems || [];

  // ─── Derive transactions ───
  const transactions = items.map((item: any) => {
    const product = Array.isArray(item.products) ? item.products[0] : item.products;
    const gross = item.total_price ?? 0;
    const net = Math.round(gross * (commissionRate / 100));
    return {
      id: item.id,
      type: 'sale' as const,
      status: (item.status === 'delivered' || item.status === 'completed' ? 'paid' : item.status === 'pending' || item.status === 'processing' ? 'pending' : 'failed') as 'paid' | 'pending' | 'failed',
      description: `Sale — ${product?.name ?? 'Unknown Product'}`,
      product_name: product?.name ?? '',
      product_id: product?.id ?? '',
      product_image: product?.images?.[0] ?? null,
      quantity: item.quantity ?? 1,
      gross_amount: gross,
      net_amount: net,
      created_at: item.created_at,
    };
  });

  // ─── Per-product earnings breakdown ───
  const productMap: Record<string, any> = {};
  for (const t of transactions) {
    if (!productMap[t.product_id]) {
      productMap[t.product_id] = {
        id: t.product_id,
        name: t.product_name,
        image: t.product_image,
        unitsSold: 0,
        grossRevenue: 0,
        netEarnings: 0,
      };
    }
    productMap[t.product_id].unitsSold += t.quantity;
    productMap[t.product_id].grossRevenue += t.gross_amount;
    productMap[t.product_id].netEarnings += t.net_amount;
  }
  const productEarnings = Object.values(productMap).sort((a: any, b: any) => b.netEarnings - a.netEarnings);

  // ─── Monthly revenue (last 12 months) ───
  const now = new Date();
  const monthlyMap: Record<string, number> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap[key] = 0;
  }
  for (const t of transactions) {
    const d = new Date(t.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (key in monthlyMap) monthlyMap[key] += t.net_amount;
  }
  const monthlyData = Object.entries(monthlyMap).map(([key, amount]) => {
    const [y, m] = key.split('-');
    const label = new Date(Number(y), Number(m) - 1, 1)
      .toLocaleString('en-IN', { month: 'short', year: '2-digit' });
    return { month: label, amount };
  });

  // ─── Stats ───
  const totalRevenue = transactions.reduce((s, t) => s + t.gross_amount, 0);
  const netEarnings = transactions.reduce((s, t) => s + t.net_amount, 0);
  const pendingBalance = sellerProfile?.pending_payout ?? 0;
  const totalPaidOut = sellerProfile?.total_paid_out ?? 0;
  const orderCount = transactions.length;
  const avgOrderValue = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0;

  const currMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevMonthD = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = `${prevMonthD.getFullYear()}-${String(prevMonthD.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthRevenue = monthlyMap[currMonth] ?? 0;
  const lastMonthRevenue = monthlyMap[prevMonth] ?? 0;
  const monthOverMonth = lastMonthRevenue > 0
    ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
    : 0;

  const stats = {
    totalRevenue,
    netEarnings,
    pendingBalance,
    totalPaidOut,
    orderCount,
    avgOrderValue,
    thisMonthRevenue,
    lastMonthRevenue,
    monthOverMonth,
    commissionRate,
  };

  return (
    <PayoutsPageClient
      sellerProfile={sellerProfile}
      transactions={transactions}
      productEarnings={productEarnings}
      monthlyData={monthlyData}
      stats={stats}
      userId={user.id}
    />
  );
}
