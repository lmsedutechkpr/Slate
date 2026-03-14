import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { CourseListClient } from '@/components/instructor/courses/CourseListClient';

export default async function InstructorCoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get course IDs for this instructor
  const { data: instructorCourses } = await supabase
    .from('course_instructors')
    .select('course_id')
    .eq('instructor_id', user.id)
    .eq('is_primary', true);

  const courseIds = (instructorCourses ?? []).map((r: any) => r.course_id).filter(Boolean);

  let courses: any[] = [];
  if (courseIds.length > 0) {
    // Use admin client to bypass RLS on nested course_sections/lectures/enrollments reads
    const adminClient = createAdminClient();

    const { data } = await adminClient
      .from('courses')
      .select(`
        id, title, slug, thumbnail_url, status,
        price, discounted_price, is_free, created_at, published_at,
        avg_rating, total_reviews,
        course_sections(id, lectures(id)),
        enrollments(id)
      `)
      .in('id', courseIds)
      .order('created_at', { ascending: false });

    courses = (data ?? []).map((c: any) => ({
      ...c,
      total_lectures: (c.course_sections ?? []).flatMap((s: any) => s.lectures ?? []).length,
      total_enrolled: (c.enrollments ?? []).length,
    }));
  }

  return <CourseListClient courses={courses} userId={user.id} />;
}
