import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CoursesPageClient from '@/components/admin/content/CoursesPageClient';
import type { CourseItem, CoursesStats } from '@/components/admin/content/types';

export default async function AdminCoursesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') redirect('/student/dashboard');

  const { data, error } = await supabase
    .from('courses')
    .select(`
      id, title, title_ta, slug,
      description, thumbnail_url,
      status, language, difficulty,
      price, discounted_price, is_free,
      total_enrolled, total_lectures,
      total_duration_mins, avg_rating,
      total_reviews, certificate_enabled,
      created_at, published_at, tags,
      categories ( name, slug ),
      course_instructors (
        instructor_id,
        profiles!instructor_id (
          id, full_name, avatar_url
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load admin courses:', error);
  }

  const courses = ((data || []) as any[]).map((row) => ({ ...row })) as CourseItem[];

  const stats: CoursesStats = {
    totalCourses: courses.length,
    pendingCourses: courses.filter((c) => c.status === 'pending').length,
    approvedCourses: courses.filter((c) => c.status === 'approved').length,
    rejectedCourses: courses.filter((c) => c.status === 'rejected').length,
    draftCourses: courses.filter((c) => c.status === 'draft').length,
    totalEnrollments: courses.reduce((sum, c) => sum + (c.total_enrolled || 0), 0),
  };

  return <CoursesPageClient courses={courses} stats={stats} adminId={user.id} />;
}
