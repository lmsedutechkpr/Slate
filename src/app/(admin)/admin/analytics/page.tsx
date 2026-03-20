import { redirect } from 'next/navigation';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import AnalyticsPageClient from '../../../../components/admin/analytics/AnalyticsPageClient';

export const dynamic = 'force-dynamic';

type Row = Record<string, any>;

async function safeSelect(table: string, builder: (q: any) => any): Promise<Row[]> {
  const admin = createAdminClient();
  try {
    const { data, error } = await builder(admin.from(table));
    if (error) return [];
    return (data || []) as Row[];
  } catch {
    return [];
  }
}

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') redirect('/student/dashboard');

  const now = new Date();
  const lastYear = new Date(now);
  lastYear.setMonth(lastYear.getMonth() - 12);
  const sinceIso = lastYear.toISOString();

  const [
    userRows,
    paidOrderRows,
    enrollmentRows,
    orderItemRows,
    sellerProfileRows,
    categoryRows,
    addressRows,
    allProfiles,
    approvedCourses,
  ] = await Promise.all([
    safeSelect('profiles', (q) => q.select('id,role,created_at').gte('created_at', sinceIso)),
    safeSelect('orders', (q) =>
      q
        .select('id,total_amount,created_at,payment_method,status')
        .or('status.eq.confirmed,status.eq.delivered,status.eq.shipped,status.eq.processing')
        .gte('created_at', sinceIso),
    ),
    safeSelect('enrollments', (q) =>
      q
        .select(
          `
          id,created_at,enrolled_at,course_id,
          courses!course_id (
            id,title,thumbnail_url,total_enrolled,avg_rating,total_reviews,
            price,discounted_price,is_free,
            categories(name),
            course_instructors(instructor_id,is_primary,profiles!instructor_id(full_name,avatar_url))
          )
        `,
        )
        .gte('created_at', sinceIso),
    ),
    safeSelect('order_items', (q) =>
      q
        .select('id,order_id,seller_id,product_id,product_name,product_image_url,quantity,total_price')
        .gte('created_at', sinceIso),
    ),
    safeSelect('seller_profiles', (q) => q.select('user_id,store_name,avg_rating,profiles!user_id(full_name,avatar_url)')),
    safeSelect('courses', (q) => q.select('id,total_enrolled,categories(id,name,slug)').eq('status', 'approved')),
    safeSelect('addresses', (q) => q.select('city,state')),
    safeSelect('profiles', (q) => q.select('id,role,created_at')),
    safeSelect('courses', (q) => q.select('id,status').eq('status', 'approved')),
  ]);

  const paidOrderIds = new Set(paidOrderRows.map((o) => String(o.id || '')));
  const paidOrderItemRows = orderItemRows.filter((item) => paidOrderIds.has(String(item.order_id || '')));

  const topCourseMap = new Map<string, Row>();
  enrollmentRows.forEach((enrollment) => {
    const course = enrollment.courses;
    if (!course?.id) return;
    const id = String(course.id);
    const current = topCourseMap.get(id) || {
      id,
      title: course.title,
      thumbnail_url: course.thumbnail_url,
      avg_rating: course.avg_rating || 0,
      total_reviews: course.total_reviews || 0,
      total_enrolled: 0,
      course_instructors: course.course_instructors || [],
    };
    current.total_enrolled = Number(current.total_enrolled || 0) + 1;
    topCourseMap.set(id, current);
  });
  const topCourseRows = Array.from(topCourseMap.values())
    .sort((a, b) => Number(b.total_enrolled || 0) - Number(a.total_enrolled || 0))
    .slice(0, 10);

  const topInstructorMap = new Map<string, Row>();
  enrollmentRows.forEach((enrollment) => {
    const course = enrollment.courses;
    const instructors = Array.isArray(course?.course_instructors) ? course.course_instructors : [];
    const primary =
      instructors.find((i: any) => i?.is_primary) ||
      instructors[0] ||
      null;
    const instructorId = String(primary?.instructor_id || '').trim();
    if (!instructorId) return;
    const current = topInstructorMap.get(instructorId) || {
      user_id: instructorId,
      total_students: 0,
      total_courses: 0,
      avg_rating: 0,
      profiles: primary?.profiles || null,
      _courseIds: new Set<string>(),
    };
    current.total_students = Number(current.total_students || 0) + 1;
    if (course?.id) current._courseIds.add(String(course.id));
    const ratings = Number(course?.avg_rating || 0);
    if (ratings > 0) {
      const prev = Number(current.avg_rating || 0);
      current.avg_rating = prev > 0 ? (prev + ratings) / 2 : ratings;
    }
    topInstructorMap.set(instructorId, current);
  });
  const topInstructorRows = Array.from(topInstructorMap.values())
    .map((row) => ({ ...row, total_courses: row._courseIds?.size || Number(row.total_courses || 0) }))
    .sort((a, b) => Number(b.total_students || 0) - Number(a.total_students || 0))
    .slice(0, 10);

  const sellerMap = new Map<string, Row>();
  sellerProfileRows.forEach((s) => sellerMap.set(String(s.user_id || ''), s));
  const topSellerAgg = new Map<string, Row>();
  paidOrderItemRows.forEach((item) => {
    const sellerId = String(item.seller_id || '').trim();
    if (!sellerId) return;
    const sellerProfile = sellerMap.get(sellerId) || null;
    const current = topSellerAgg.get(sellerId) || {
      user_id: sellerId,
      store_name: sellerProfile?.store_name || sellerProfile?.profiles?.full_name || 'Seller',
      total_revenue: 0,
      total_sales: 0,
      avg_rating: sellerProfile?.avg_rating || 0,
      profiles: sellerProfile?.profiles || null,
    };
    current.total_revenue = Number(current.total_revenue || 0) + Number(item.total_price || 0);
    current.total_sales = Number(current.total_sales || 0) + Number(item.quantity || 1);
    topSellerAgg.set(sellerId, current);
  });
  const topSellerRows = Array.from(topSellerAgg.values())
    .sort((a, b) => Number(b.total_revenue || 0) - Number(a.total_revenue || 0))
    .slice(0, 10);

  const courseRevenue = enrollmentRows.reduce((sum, enrollment) => {
    const course = enrollment.courses;
    if (!course || course.is_free) return sum;
    return sum + Number(course.discounted_price ?? course.price ?? 0);
  }, 0);
  const productRevenue = paidOrderItemRows.reduce((sum, item) => sum + Number(item.total_price || 0), 0);
  const platformFees = Math.max(0, paidOrderRows.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) - productRevenue);

  const { count: enrollmentsCount } = await admin.from('enrollments').select('*', { count: 'exact', head: true });

  return (
    <div className="p-6">
      <AnalyticsPageClient
        rawUsers={userRows}
        rawRevenueOrders={paidOrderRows}
        rawEnrollments={enrollmentRows}
        topCourses={topCourseRows}
        topSellers={topSellerRows}
        topInstructors={topInstructorRows}
        rawCategoryCourses={categoryRows}
        rawAddresses={addressRows}
        rawAllProfiles={allProfiles}
        totalCoursesCount={approvedCourses.length}
        totalEnrollmentsCount={enrollmentsCount || 0}
        revenueBreakdown={{ courseRevenue, productRevenue, platformFees }}
      />
    </div>
  );
}
