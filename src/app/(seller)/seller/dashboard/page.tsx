import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardClient from '@/components/seller/dashboard/DashboardClient';
import { startOfMonth, subMonths, format } from 'date-fns';

export default async function SellerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status, full_name')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'seller') redirect('/student/dashboard');
  if (profile?.status !== 'active') redirect('/pending-approval?role=seller');

  // QUERY 1 — Seller profile + store
  const { data: sellerProfile } = await supabase
    .from('seller_profiles')
    .select(`
      store_name, store_slug, store_description, 
      total_sales, total_revenue, avg_rating, 
      commission_rate, pending_payout, total_orders
    `)
    .eq('user_id', user.id)
    .single();

  // QUERY 2 — Products (Active, ordered by sales)
  const { data: products } = await supabase
    .from('products')
    .select(`
      id, name, slug, images, price, discounted_price, 
      stock_qty, low_stock_threshold, status, total_sold, avg_rating,
      product_categories ( name, slug )
    `)
    .eq('seller_id', user.id)
    .eq('status', 'active')
    .order('total_sold', { ascending: false });

  // QUERY 3 — Recent orders (last 50, then sort by orders.created_at in JS)
  const { data: recentOrdersData } = await supabase
    .from('order_items')
    .select(`
      id, order_id, quantity, unit_price, total_price,
      fulfillment_status, tracking_number,
      orders!inner (
        id, status, customer_id, created_at,
        addresses ( city, state )
      ),
      products ( id, name, images )
    `)
    .eq('seller_id', user.id)
    .limit(50);

  // Sort in JS by actual order created_at, then take top 10
  const sortedOrders = (recentOrdersData || []).sort((a: any, b: any) => {
    return new Date(b.orders.created_at).getTime() - new Date(a.orders.created_at).getTime();
  }).slice(0, 10);

  // Fetch customer profiles for recent orders
  const dashCustIds = [...new Set(sortedOrders.map((i: any) => i.orders?.customer_id).filter(Boolean))];
  let dashProfilesMap: Record<string, any> = {};
  if (dashCustIds.length > 0) {
    const { data: profs } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', dashCustIds);
    if (profs) dashProfilesMap = Object.fromEntries(profs.map(p => [p.id, p]));
  }
  for (const item of sortedOrders) {
    const cid = (item as any).orders?.customer_id;
    if (cid) (item as any).orders.profiles = dashProfilesMap[cid] || null;
  }

  // Simplify order data for the client
  const mappedOrders = sortedOrders.map(item => ({
    ...item,
    product_name: (item.products as any)?.name || 'Unknown Product',
  }));

  // QUERY 4 — Low stock products
  const lowStockProducts = (products || [])
    .filter(p => p.stock_qty <= (p.low_stock_threshold || 5))
    .sort((a, b) => a.stock_qty - b.stock_qty);

  // QUERY 5 — Monthly revenue (last 6m)
  const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5)).toISOString();
  
  // Need to join orders to get created_at
  const { data: revenueData } = await supabase
    .from('order_items')
    .select(`
      total_price, fulfillment_status,
      orders!inner ( created_at )
    `)
    .eq('seller_id', user.id)
    .neq('fulfillment_status', 'cancelled')
    .gte('orders.created_at', sixMonthsAgo);

  // Group by month
  const monthlyRevenueMap: Record<string, { amount: number, orders: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(new Date(), i);
    monthlyRevenueMap[format(d, 'MMM yy')] = { amount: 0, orders: 0 };
  }

  let totalRevenue = 0;
  let totalOrders = 0;
  let pendingOrders = 0;

  // Process all order items to compute stats
  // Note: For real stats over all time, we should use the seller_profiles table 
  // or a full aggregation. For now, we compute current month / active stuff here.
  
  // Let's get total pending orders (active ones needing fulfillment)
  const { count: pendingCount } = await supabase
    .from('order_items')
    .select('id', { count: 'exact', head: true })
    .eq('seller_id', user.id)
    .eq('fulfillment_status', 'pending');
    
  pendingOrders = pendingCount || 0;

  // Aggregate monthly data
  (revenueData || []).forEach((item: any) => {
    const orderDate = new Date(item.orders.created_at);
    const monthKey = format(orderDate, 'MMM yy');
    
    if (monthlyRevenueMap[monthKey]) {
      monthlyRevenueMap[monthKey].amount += item.total_price || 0;
      monthlyRevenueMap[monthKey].orders += 1; // 1 order item = 1 order in this context
    }
  });

  const monthlyRevenue = Object.entries(monthlyRevenueMap).map(([month, data]) => ({
    month,
    amount: data.amount,
    orders: data.orders
  }));
  
  // Calculate this month's revenue specifically
  const thisMonthKey = format(new Date(), 'MMM yy');
  const thisMonthRevenue = monthlyRevenueMap[thisMonthKey]?.amount || 0;

  // Use the pre-calculated DB stats where possible, fallback to manual calculation
  const stats = {
    totalRevenue: sellerProfile?.total_revenue || 0,
    totalOrders: sellerProfile?.total_orders || 0,
    totalProducts: products?.length || 0,
    pendingOrders,
    thisMonthRevenue
  };

  return (
    <DashboardClient
      sellerProfile={sellerProfile}
      products={products || []}
      initialRecentOrders={mappedOrders}
      initialLowStockProducts={lowStockProducts}
      monthlyRevenue={monthlyRevenue}
      userId={user.id}
      stats={stats}
    />
  );
}
