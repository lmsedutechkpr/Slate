import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import ProfilePageClient from '@/components/instructor/profile/ProfilePageClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'My Profile – Slate Instructor',
  description: 'Manage your instructor profile, credentials and account settings.',
};

function adminDb() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function InstructorProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const db = adminDb();

  // ── Parallel queries ──
  const [profileRes, instructorRes, courseRes] = await Promise.all([
    db.from('profiles').select('*').eq('id', user.id).single(),
    db.from('instructor_profiles').select('*').eq('user_id', user.id).single(),
    db.from('course_instructors').select('course_id', { count: 'exact' }).eq('instructor_id', user.id),
  ]);

  const profile = profileRes.data;
  const instructorProfile = instructorRes.data;
  const totalCourses = courseRes.count ?? 0;
  const myCourseIds = (courseRes.data || []).map((r: any) => r.course_id);

  // ── Reviews count ──
  let totalReviews = 0;
  if (myCourseIds.length > 0) {
    const { count } = await db.from('reviews').select('id', { count: 'exact' }).in('course_id', myCourseIds);
    totalReviews = count ?? 0;
  }

  const stats = {
    totalCourses,
    totalStudents: instructorProfile?.total_students ?? 0,
    avgRating: instructorProfile?.avg_rating ?? 0,
    totalReviews,
  };

  return (
    <ProfilePageClient
      profile={profile}
      instructorProfile={instructorProfile}
      stats={stats}
      userEmail={user.email ?? ''}
      userId={user.id}
    />
  );
}
