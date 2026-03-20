import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardClient from '@/components/admin/dashboard/DashboardClient';

const DEFAULT_SELLER_SHARE = 85;
const DEFAULT_INSTRUCTOR_SHARE = 70;

function isRevenueOrder(order: { status?: string | null; payment_status?: string | null }) {
  const status = String(order.status || '').toLowerCase();
  const paymentStatus = String(order.payment_status || '').toLowerCase();
  const paidByPaymentStatus = ['paid', 'captured', 'succeeded'].includes(paymentStatus);
  const fulfilledByOrderStatus = ['confirmed', 'processing', 'shipped', 'delivered', 'completed'].includes(status);
  return paidByPaymentStatus || fulfilledByOrderStatus;
}

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
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Fetch all data in parallel for performance
  const [
    allProfilesRes,
    allCoursesRes,
    allProductsRes,
    allOrdersRes,
    revenueOrderRowsRes,
    orderItemsRes,
    sellerProfilesRes,
    enrollmentRevenueRowsRes,
    instructorProfilesRes,
    todayOrdersRes,
    totalEnrollmentsRes,
    pendingApprovalsRes,
    recentEnrollmentsRes,
    recentOrdersRes,
    recentProfilesRes,
  ] = await Promise.all([
    // 1. All profiles
    supabase.from('profiles').select('id, role, created_at'),

    // 2. All courses
    supabase.from('courses').select('id, status, total_enrolled'),

    // 3. All products
    supabase.from('products').select('id, status, total_sold'),

    // 4. All orders
    supabase.from('orders').select('id, created_at'),

    // 5. Orders for commission-eligible commerce revenue
    supabase
      .from('orders')
      .select('id,total_amount,created_at,status,payment_status')
      .order('created_at', { ascending: true }),

    // 6. Order items for seller commission split
    supabase
      .from('order_items')
      .select('id,order_id,seller_id,total_price'),

    // 7. Seller commission rates
    supabase
      .from('seller_profiles')
      .select('user_id,commission_rate'),

    // 8. Enrollments with course/instructor data for course commission split
    supabase
      .from('enrollments')
      .select(`
        id,
        created_at,
        enrolled_at,
        course_id,
        courses!course_id (
          id,
          price,
          discounted_price,
          is_free,
          course_instructors(instructor_id,is_primary)
        )
      `),

    // 9. Instructor commission rates
    supabase
      .from('instructor_profiles')
      .select('user_id,commission_rate'),

    // 10. Today's orders
    supabase.from('orders').select('id').gte('created_at', startOfToday),

    // 11. Total enrollments count
    supabase.from('enrollments').select('*', { count: 'exact', head: true }),

    // 12. Pending approvals (top 10)
    supabase
      .from('profiles')
      .select('id, full_name, role, avatar_url, created_at')
      .eq('status', 'pending_approval')
      .in('role', ['instructor', 'seller'])
      .order('created_at', { ascending: true })
      .limit(10),

    // 13. Recent enrollments for activity feed
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

    // 14. Recent orders for activity feed
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

    // 15. Recent profile signups for activity feed
    supabase
      .from('profiles')
      .select('id, full_name, role, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
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
  const totalEnrollments = totalEnrollmentsRes.count || 0;

  // ─── Process Product Stats ───
  const allProducts = allProductsRes.data || [];
  const totalProducts = allProducts.length;
  const activeProducts = allProducts.filter((p) => p.status === 'active').length;
  const pendingProducts = allProducts.filter((p) => p.status === 'pending').length;
  const totalUnitsSold = allProducts.reduce((sum, p) => sum + (p.total_sold || 0), 0);

  // ─── Process Order Stats ───
  const totalOrders = allOrdersRes.data?.length || 0;
  const todayOrders = todayOrdersRes.data?.length || 0;

  // ─── Process Platform Revenue (Order Commission + Course Commission) ───
  const revenueOrders = (revenueOrderRowsRes.data || []).filter(isRevenueOrder);
  const revenueOrderIdSet = new Set(revenueOrders.map((o) => String(o.id || '')));
  const orderCreatedAtMap = new Map<string, string>();
  revenueOrders.forEach((o) => orderCreatedAtMap.set(String(o.id), String(o.created_at || '')));

  const sellerShareMap = new Map<string, number>();
  (sellerProfilesRes.data || []).forEach((row: any) => {
    sellerShareMap.set(String(row.user_id || ''), Number(row.commission_rate ?? DEFAULT_SELLER_SHARE));
  });

  const instructorShareMap = new Map<string, number>();
  (instructorProfilesRes.data || []).forEach((row: any) => {
    instructorShareMap.set(String(row.user_id || ''), Number(row.commission_rate ?? DEFAULT_INSTRUCTOR_SHARE));
  });

  const monthlyRevenueMap: { [key: string]: { revenue: number; orders: number } } = {};

  revenueOrders.forEach((order) => {
    const date = new Date(order.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyRevenueMap[monthKey]) {
      monthlyRevenueMap[monthKey] = { revenue: 0, orders: 0 };
    }
    monthlyRevenueMap[monthKey].orders += 1;
  });

  let orderCommissionRevenue = 0;
  ((orderItemsRes.data || []) as any[]).forEach((item) => {
    const orderId = String(item.order_id || '');
    if (!revenueOrderIdSet.has(orderId)) return;

    const gross = Number(item.total_price || 0);
    if (gross <= 0) return;

    const sellerId = String(item.seller_id || '');
    const sellerShare = sellerShareMap.get(sellerId) ?? DEFAULT_SELLER_SHARE;
    const platformCut = gross * Math.max(0, (100 - sellerShare) / 100);
    orderCommissionRevenue += platformCut;

    const createdAt = orderCreatedAtMap.get(orderId);
    if (!createdAt) return;
    const date = new Date(createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyRevenueMap[monthKey]) {
      monthlyRevenueMap[monthKey] = { revenue: 0, orders: 0 };
    }
    monthlyRevenueMap[monthKey].revenue += platformCut;
  });

  let courseCommissionRevenue = 0;
  ((enrollmentRevenueRowsRes.data || []) as any[]).forEach((enrollment) => {
    const course = enrollment.courses;
    if (!course || course.is_free) return;

    const gross = Number(course.discounted_price ?? course.price ?? 0);
    if (gross <= 0) return;

    const instructors = Array.isArray(course.course_instructors) ? course.course_instructors : [];
    const primaryInstructor = instructors.find((i: any) => i?.is_primary) || instructors[0] || null;
    const instructorId = String(primaryInstructor?.instructor_id || '');
    const instructorShare = instructorShareMap.get(instructorId) ?? DEFAULT_INSTRUCTOR_SHARE;
    const platformCut = gross * Math.max(0, (100 - instructorShare) / 100);
    courseCommissionRevenue += platformCut;

    const createdAt = String(enrollment.created_at || enrollment.enrolled_at || '');
    if (!createdAt) return;
    const date = new Date(createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyRevenueMap[monthKey]) {
      monthlyRevenueMap[monthKey] = { revenue: 0, orders: 0 };
    }
    monthlyRevenueMap[monthKey].revenue += platformCut;
  });

  const totalRevenue = Math.round(orderCommissionRevenue + courseCommissionRevenue);
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthRevenue = Math.round(monthlyRevenueMap[thisMonthKey]?.revenue || 0);

  const monthlyRevenue = Object.entries(monthlyRevenueMap)
    .map(([month, data]) => ({
      month,
      revenue: Math.round(data.revenue),
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
