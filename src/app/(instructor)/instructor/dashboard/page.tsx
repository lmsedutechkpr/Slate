import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from '@/components/instructor/dashboard/DashboardClient';
import { format, subMonths, startOfMonth } from 'date-fns';

function generateMockEarnings(courses: any[], commissionRate: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    const baseAmount = courses.reduce((sum, c) => sum + ((c.total_enrolled ?? 0) * (c.discounted_price ?? c.price ?? 0)), 0);
    const mock = Math.round((baseAmount * (commissionRate / 100)) * (0.7 + Math.random() * 0.6));
    return {
      month: format(d, 'MMM yy'),
      amount: mock,
    };
  });
}

export default async function InstructorDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Role guard
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status, full_name, avatar_url')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'instructor') redirect('/student/dashboard');
  if (profile.status === 'pending') redirect('/pending-approval?role=instructor');

  // Query 1 — Instructor profile stats
  const { data: instructorProfile } = await supabase
    .from('instructor_profiles')
    .select('total_students, total_courses, avg_rating, total_revenue, commission_rate')
    .eq('user_id', user.id)
    .single();

  // Query 2 — My courses (via course_instructors join)
  const { data: myInstructorCourses } = await supabase
    .from('course_instructors')
    .select('course_id')
    .eq('instructor_id', user.id);

  const myCourseIds = (myInstructorCourses ?? []).map((r: any) => r.course_id).filter(Boolean);

  let courses: any[] = [];
  if (myCourseIds.length > 0) {
    const { data } = await supabase
      .from('courses')
      .select('id, title, slug, thumbnail_url, status, total_enrolled, total_lectures, avg_rating, total_reviews, price, discounted_price, created_at')
      .in('id', myCourseIds)
      .order('total_enrolled', { ascending: false });
    courses = data ?? [];
  }

  // Query 3 — Recent enrollments
  let recentEnrollments: any[] = [];
  if (myCourseIds.length > 0) {
    const { data } = await supabase
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

  // Query 4 — Upcoming live classes
  const { data: upcomingLive } = await supabase
    .from('live_classes')
    .select('*')
    .eq('instructor_id', user.id)
    .eq('status', 'scheduled')
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at')
    .limit(3);

  // Query 5 — Monthly earnings (from payout_transactions or fallback)
  let monthlyEarnings: { month: string; amount: number }[] = [];
  const { data: payouts } = await supabase
    .from('payout_transactions')
    .select('amount, created_at')
    .eq('instructor_id', user.id)
    .gte('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString());

  if (payouts && payouts.length > 0) {
    // Group by month
    const grouped: Record<string, number> = {};
    payouts.forEach((p: any) => {
      const key = format(new Date(p.created_at), 'MMM yy');
      grouped[key] = (grouped[key] ?? 0) + p.amount;
    });
    monthlyEarnings = Object.entries(grouped).map(([month, amount]) => ({ month, amount }));
  } else {
    // Generate mock data from enrollments × price × commission
    const commissionRate = instructorProfile?.commission_rate ?? 70;
    monthlyEarnings = generateMockEarnings(courses, commissionRate);
  }

  // Query 6 — Unanswered Q&A count
  let unansweredQA = 0;
  if (myCourseIds.length > 0) {
    const { count } = await supabase
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
    />
  );
}
