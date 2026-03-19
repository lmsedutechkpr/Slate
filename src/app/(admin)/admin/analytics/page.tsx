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
    topCourseRows,
    topSellerRows,
    topInstructorRows,
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
    safeSelect('enrollments', (q) => q.select('id,created_at,enrolled_at').gte('created_at', sinceIso)),
    safeSelect('courses', (q) =>
      q
        .select(
          'id,title,thumbnail_url,total_enrolled,avg_rating,total_reviews,categories(name),course_instructors(profiles!instructor_id(full_name))',
        )
        .eq('status', 'approved')
        .order('total_enrolled', { ascending: false })
        .limit(10),
    ),
    safeSelect('seller_profiles', (q) =>
      q
        .select('user_id,store_name,total_revenue,total_sales,avg_rating,profiles!user_id(full_name,avatar_url)')
        .order('total_revenue', { ascending: false })
        .limit(10),
    ),
    Promise.all([
      safeSelect('instructor_profiles', (q) =>
        q
          .select('user_id,total_students,total_courses,avg_rating,total_revenue,profiles!user_id(full_name,avatar_url)')
          .order('total_students', { ascending: false })
          .limit(10),
      ),
      safeSelect('instructor_profiles', (q) =>
        q
          .select('user_id,total_students,total_courses,avg_rating,profiles!user_id(full_name,avatar_url)')
          .order('total_students', { ascending: false })
          .limit(10),
      ),
    ]).then(([primary, fallback]) => (primary.length ? primary : fallback)),
    safeSelect('courses', (q) => q.select('id,total_enrolled,categories(id,name,slug)').eq('status', 'approved')),
    safeSelect('addresses', (q) => q.select('city,state')),
    safeSelect('profiles', (q) => q.select('id,role,created_at')),
    safeSelect('courses', (q) => q.select('id,status').eq('status', 'approved')),
  ]);

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
      />
    </div>
  );
}
