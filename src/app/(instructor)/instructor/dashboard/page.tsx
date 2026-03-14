import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { DashboardClient } from '@/components/instructor/dashboard/DashboardClient';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export const dynamic = 'force-dynamic';

function adminDb() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function InstructorDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const db = adminDb();

  // ── 1. Profile + role guard ──
  const { data: profile } = await db
    .from('profiles')
    .select('role, status, full_name, avatar_url')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'instructor') redirect('/student/dashboard');
  if (profile.status === 'pending') redirect('/pending-approval?role=instructor');

  // ── 2. Instructor profile ──
  const { data: instructorProfile } = await db
    .from('instructor_profiles')
    .select('total_students, total_courses, avg_rating, total_revenue, commission_rate, pending_payout')
    .eq('user_id', user.id)
    .single();

  // ── 3. My course IDs ──
  const { data: ciRows } = await db
    .from('course_instructors')
    .select('course_id')
    .eq('instructor_id', user.id);
  const myCourseIds = (ciRows ?? []).map((r: any) => r.course_id).filter(Boolean);

  // ── 4. My courses ──
  let courses: any[] = [];
  if (myCourseIds.length > 0) {
    const { data } = await db
      .from('courses')
      .select('id, title, thumbnail_url, status, total_enrolled, avg_rating, total_reviews, price, discounted_price')
      .in('id', myCourseIds)
      .order('total_enrolled', { ascending: false });
    courses = data ?? [];
  }

  // ── 5. Recent enrollments ──
  let recentEnrollments: any[] = [];
  if (myCourseIds.length > 0) {
    const { data } = await db
      .from('enrollments')
      .select(`
        id, created_at, progress_pct,
        courses ( id, title ),
        profiles!student_id ( id, full_name, avatar_url )
      `)
      .in('course_id', myCourseIds)
      .order('created_at', { ascending: false })
      .limit(10);
    recentEnrollments = data ?? [];
  }

  // ── 6. Upcoming live classes (scheduled OR live) ──
  const { data: upcomingLive } = await db
    .from('live_classes')
    .select('*')
    .eq('instructor_id', user.id)
    .in('status', ['scheduled', 'live'])
    .order('scheduled_at')
    .limit(3);

  // ── 7. Monthly earnings from enrollments × course price (last 6 months) ──
  const monthlyEarnings: { month: string; amount: number }[] = [];
  let computedTotalRevenue = 0;
  if (myCourseIds.length > 0) {
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const start = startOfMonth(d).toISOString();
      const end   = endOfMonth(d).toISOString();

      const { data: enrRows } = await db
        .from('enrollments')
        .select('course_id, courses(price, discounted_price)')
        .in('course_id', myCourseIds)
        .gte('enrolled_at', start)   // ← correct column name
        .lte('enrolled_at', end);

      const commRate = (instructorProfile?.commission_rate ?? 70) / 100;
      const gross = (enrRows ?? []).reduce((sum: number, e: any) => {
        const p = e.courses?.discounted_price ?? e.courses?.price ?? 0;
        return sum + (p * commRate);
      }, 0);

      computedTotalRevenue += gross;
      monthlyEarnings.push({ month: format(d, 'MMM yy'), amount: Math.round(gross) });
    }
  }

  // ── 8. Trend: this month vs last month enrollments ──
  const now = new Date();
  const thisMonthStart = startOfMonth(now).toISOString();
  const lastMonthStart = startOfMonth(subMonths(now, 1)).toISOString();
  const lastMonthEnd   = endOfMonth(subMonths(now, 1)).toISOString();

  let enrollTrend = 0;
  let revenueTrend = 0;
  if (myCourseIds.length > 0) {
    const [thisEnr, lastEnr] = await Promise.all([
      db.from('enrollments').select('id', { count: 'exact', head: true }).in('course_id', myCourseIds).gte('enrolled_at', thisMonthStart),
      db.from('enrollments').select('id', { count: 'exact', head: true }).in('course_id', myCourseIds).gte('enrolled_at', lastMonthStart).lte('enrolled_at', lastMonthEnd),
    ]);
    const thisCount = thisEnr.count ?? 0;
    const lastCount = lastEnr.count ?? 1;
    enrollTrend = Math.round(((thisCount - lastCount) / lastCount) * 100);

    // Revenue trend from monthlyEarnings
    const thisMo = monthlyEarnings[monthlyEarnings.length - 1]?.amount ?? 0;
    const lastMo = monthlyEarnings[monthlyEarnings.length - 2]?.amount ?? 1;
    revenueTrend = lastMo > 0 ? Math.round(((thisMo - lastMo) / lastMo) * 100) : 0;
  }

  // ── 9. Unanswered Q&A ──
  let unansweredQA = 0;
  if (myCourseIds.length > 0) {
    const { count } = await db
      .from('course_qa')
      .select('id', { count: 'exact', head: true })
      .in('course_id', myCourseIds)
      .eq('is_answered', false)
      .is('parent_id', null);
    unansweredQA = count ?? 0;
  }

  return (
    <DashboardClient
      instructorProfile={instructorProfile}
      courses={courses}
      recentEnrollments={recentEnrollments}
      upcomingLive={upcomingLive ?? []}
      monthlyEarnings={monthlyEarnings}
      unansweredQA={unansweredQA}
      profile={profile}
      userId={user.id}
      myCourseIds={myCourseIds}
      enrollTrend={enrollTrend}
      revenueTrend={revenueTrend}
      computedTotalRevenue={Math.round(computedTotalRevenue)}
    />
  );

}
