import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardClient from '@/components/admin/dashboard/DashboardClient';

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') redirect('/student/dashboard');

  // Date calculations
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString();

  // Fetch all data in parallel for performance
  const [
    allProfilesRes,
    allCoursesRes,
    allProductsRes,
    allOrdersRes,
    paidOrdersRes,
    thisMonthOrdersRes,
    todayOrdersRes,
    enrollmentsRes,
    pendingApprovalsRes,
    recentEnrollmentsRes,
    recentOrdersRes,
    recentProfilesRes,
    monthlyRevenueRes,
  ] = await Promise.all([
    // 1. All profiles
    supabase.from('profiles').select('id, role, created_at'),

    // 2. All courses
    supabase.from('courses').select('id, status, total_enrolled'),

    // 3. All products
    supabase.from('products').select('id, status, total_sold'),

    // 4. All orders
    supabase.from('orders').select('id, created_at'),

    // 5. Paid orders for revenue
    supabase.from('orders').select('total_amount, payment_status').eq('payment_status', 'paid'),

    // 6. This month's paid orders
    supabase
      .from('orders')
      .select('total_amount')
      .eq('payment_status', 'paid')
      .gte('created_at', startOfMonth),

    // 7. Today's orders
    supabase.from('orders').select('id').gte('created_at', startOfToday),

    // 8. All enrollments
    supabase.from('enrollments').select('id, enrolled_at').gte('enrolled_at', thirtyDaysAgo),

    // 9. Pending approvals (top 10)
    supabase
      .from('profiles')
      .select('id, full_name, role, avatar_url, created_at')
      .eq('status', 'pending_approval')
      .in('role', ['instructor', 'seller'])
      .order('created_at', { ascending: true })
      .limit(10),

    // 10. Recent enrollments for activity feed
    supabase
      .from('enrollments')
      .select(`
        id,
        created_at: enrolled_at,
        profiles!student_id (full_name, role),
        courses (title)
      `)
      .order('enrolled_at', { ascending: false })
      .limit(5),

    // 11. Recent orders for activity feed
    supabase
      .from('orders')
      .select(`
        id,
        created_at,
        total_amount,
        profiles!user_id (full_name, role)
      `)
      .order('created_at', { ascending: false })
      .limit(5),

    // 12. Recent profile signups for activity feed
    supabase
      .from('profiles')
      .select('id, full_name, role, created_at')
      .order('created_at', { ascending: false })
      .limit(5),

    // 13. Monthly revenue data (last 12 months)
    supabase
      .from('orders')
      .select('total_amount, created_at')
      .eq('payment_status', 'paid')
      .gte('created_at', twelveMonthsAgo)
      .order('created_at', { ascending: true }),
  ]);

  // ─── Process User Stats ───
  const allProfiles = allProfilesRes.data || [];
  const totalUsers = allProfiles.length;
  const totalStudents = allProfiles.filter((p) => p.role === 'student').length;
  const totalInstructors = allProfiles.filter((p) => p.role === 'instructor').length;
  const totalSellers = allProfiles.filter((p) => p.role === 'seller').length;
  const newThisMonth = allProfiles.filter((p) => p.created_at >= startOfMonth).length;

  // ─── Process Course Stats ───
  const allCourses = allCoursesRes.data || [];
  const totalCourses = allCourses.length;
  const publishedCourses = allCourses.filter((c) => c.status === 'approved').length;
  const pendingCourses = allCourses.filter((c) => c.status === 'pending').length;
  const totalEnrollments = allCourses.reduce((sum, c) => sum + (c.total_enrolled || 0), 0);

  // ─── Process Product Stats ───
  const allProducts = allProductsRes.data || [];
  const totalProducts = allProducts.length;
  const activeProducts = allProducts.filter((p) => p.status === 'active').length;
  const pendingProducts = allProducts.filter((p) => p.status === 'pending').length;
  const totalUnitsSold = allProducts.reduce((sum, p) => sum + (p.total_sold || 0), 0);

  // ─── Process Order Stats ───
  const totalOrders = allOrdersRes.data?.length || 0;
  const todayOrders = todayOrdersRes.data?.length || 0;

  // Revenue calculations
  const paidOrders = paidOrdersRes.data || [];
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const thisMonthOrders = thisMonthOrdersRes.data || [];
  const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  // ─── Process Monthly Revenue ───
  const monthlyRevenueData = monthlyRevenueRes.data || [];
  const monthlyRevenueMap: { [key: string]: { revenue: number; orders: number } } = {};

  monthlyRevenueData.forEach((order) => {
    const date = new Date(order.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyRevenueMap[monthKey]) {
      monthlyRevenueMap[monthKey] = { revenue: 0, orders: 0 };
    }

    monthlyRevenueMap[monthKey].revenue += order.total_amount || 0;
    monthlyRevenueMap[monthKey].orders += 1;
  });

  const monthlyRevenue = Object.entries(monthlyRevenueMap)
    .map(([month, data]) => ({
      month,
      revenue: data.revenue,
      orders: data.orders,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // ─── Process Pending Approvals ───
  const pendingApprovals = (pendingApprovalsRes.data || []).map((p) => ({
    id: p.id,
    full_name: p.full_name || 'Unnamed User',
    email: null,
    role: p.role,
    avatar_url: p.avatar_url,
    created_at: p.created_at,
  }));

  // ─── Process Recent Activity ───
  const recentActivity: any[] = [];

  // Add enrollments
  (recentEnrollmentsRes.data || []).forEach((e: any) => {
    recentActivity.push({
      id: `enrollment-${e.id}`,
      type: 'enrollment',
      description: `${e.profiles?.full_name || 'Someone'} enrolled in ${e.courses?.title || 'a course'}`,
      timestamp: e.created_at,
      user: e.profiles,
    });
  });

  // Add orders
  (recentOrdersRes.data || []).forEach((o: any) => {
    recentActivity.push({
      id: `order-${o.id}`,
      type: 'order',
      description: `${o.profiles?.full_name || 'Someone'} placed an order`,
      timestamp: o.created_at,
      amount: o.total_amount,
      user: o.profiles,
    });
  });

  // Add signups
  (recentProfilesRes.data || []).forEach((p: any) => {
    recentActivity.push({
      id: `signup-${p.id}`,
      type: 'signup',
      description: `${p.full_name || 'Someone'} joined as ${p.role}`,
      timestamp: p.created_at,
      role: p.role,
    });
  });

  // Sort by timestamp and limit to 20
  recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const limitedActivity = recentActivity.slice(0, 20);

  // ─── Prepare Platform Stats ───
  const platformStats = {
    totalUsers,
    totalStudents,
    totalInstructors,
    totalSellers,
    newThisMonth,
    totalRevenue,
    thisMonthRevenue,
    totalCourses,
    publishedCourses,
    pendingCourses,
    totalEnrollments,
    totalProducts,
    activeProducts,
    pendingProducts,
    totalUnitsSold,
    totalOrders,
    todayOrders,
  };

  return (
    <DashboardClient
      platformStats={platformStats}
      monthlyRevenue={monthlyRevenue}
      pendingApprovals={pendingApprovals}
      recentActivity={limitedActivity}
    />
  );
}
