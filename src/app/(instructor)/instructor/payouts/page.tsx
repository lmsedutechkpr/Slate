import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import PayoutsPageClient from '@/components/instructor/payouts/PayoutsPageClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Payouts – Slate Instructor',
  description: 'Track your earnings and manage payout settings.',
};

function adminDb() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function PayoutsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const db = adminDb();

  // ─── Query 1: Instructor Profile ───
  const { data: profile } = await db
    .from('instructor_profiles')
    .select('total_revenue, pending_payout, commission_rate, payout_method, payout_details, total_paid_out')
    .eq('user_id', user.id)
    .single();

  const commissionRate = profile?.commission_rate ?? 70;

  // ─── Query 2: Instructor's courses ───
  const { data: courseRows } = await db
    .from('course_instructors')
    .select('course_id, courses(id, title, price, discounted_price, thumbnail_url)')
    .eq('instructor_id', user.id);

  const myCourseIds = (courseRows || []).map((r: any) => r.course_id).filter(Boolean);

  // ─── Query 3: All enrollments in instructor courses ───
  let enrollments: any[] = [];
  if (myCourseIds.length > 0) {
    const { data: enr } = await db
      .from('enrollments')
      .select('id, course_id, student_id, enrolled_at, courses(id, title, price, discounted_price, thumbnail_url)')
      .in('course_id', myCourseIds)
      .order('enrolled_at', { ascending: false });
    enrollments = enr || [];
  }

  // ─── Derive transactions from enrollments ───
  const transactions = enrollments.map((e: any) => {
    const course = Array.isArray(e.courses) ? e.courses[0] : e.courses;
    const gross = course?.discounted_price ?? course?.price ?? 0;
    const net = Math.round(gross * (commissionRate / 100));
    return {
      id: e.id,
      type: 'enrollment' as const,
      status: 'paid' as const,
      description: `Enrollment — ${course?.title ?? 'Unknown Course'}`,
      course_title: course?.title ?? '',
      course_id: e.course_id,
      gross_amount: gross,
      net_amount: net,
      created_at: e.enrolled_at,
    };
  });

  // ─── Per-course earnings breakdown ───
  const courseMap: Record<string, any> = {};
  for (const row of courseRows || []) {
    const c = Array.isArray(row.courses) ? row.courses[0] : row.courses;
    if (!c) continue;
    courseMap[c.id] = { ...c, enrollmentCount: 0, grossRevenue: 0, netEarnings: 0 };
  }
  for (const t of transactions) {
    if (courseMap[t.course_id]) {
      courseMap[t.course_id].enrollmentCount += 1;
      courseMap[t.course_id].grossRevenue += t.gross_amount;
      courseMap[t.course_id].netEarnings += t.net_amount;
    }
  }
  const courseEarnings = Object.values(courseMap);

  // ─── Monthly breakdown (last 12 months) ───
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
  const totalEarnings = transactions.reduce((s, t) => s + t.net_amount, 0);
  const totalPaidOut = profile?.total_revenue
    ? Math.round((profile.total_revenue) * (commissionRate / 100))
    : totalEarnings; // If total_revenue is 0, derived from transactions
  const pendingBalance = profile?.pending_payout ?? 0;

  const currMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevMonthD = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = `${prevMonthD.getFullYear()}-${String(prevMonthD.getMonth() + 1).padStart(2, '0')}`;

  const thisMonthEarnings = monthlyMap[currMonth] ?? 0;
  const lastMonthEarnings = monthlyMap[prevMonth] ?? 0;
  const monthOverMonth = lastMonthEarnings > 0
    ? Math.round(((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100)
    : 0;

  const stats = {
    totalEarnings,
    totalPaidOut,
    pendingBalance,
    thisMonthEarnings,
    lastMonthEarnings,
    monthOverMonth,
    commissionRate,
  };

  return (
    <PayoutsPageClient
      instructorProfile={profile}
      transactions={transactions}
      courseEarnings={courseEarnings}
      monthlyData={monthlyData}
      stats={stats}
      userId={user.id}
    />
  );
}
