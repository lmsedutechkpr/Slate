import { redirect } from 'next/navigation';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { CourseEditorClient } from '@/components/instructor/courses/CourseEditorClient';

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function AdminCourseEditPage({ params }: PageProps) {
  const { courseId } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') redirect('/student/dashboard');

  const { data: course } = await admin.from('courses').select('*').eq('id', courseId).single();
  if (!course) redirect('/admin/courses');

  const { data: categories } = await admin.from('categories').select('id, name, slug').order('name');

  const { data: primaryLink } = await admin
    .from('course_instructors')
    .select('instructor_id')
    .eq('course_id', courseId)
    .eq('is_primary', true)
    .maybeSingle();

  const primaryInstructorId = primaryLink?.instructor_id || null;

  const { data: instructorProfile } = primaryInstructorId
    ? await admin
        .from('instructor_profiles')
        .select('commission_rate')
        .eq('user_id', primaryInstructorId)
        .single()
    : { data: null };

  return (
    <CourseEditorClient
      course={course}
      categories={categories ?? []}
      commissionRate={instructorProfile?.commission_rate ?? 70}
      userId={user.id}
      listPath="/admin/courses"
      backLabel="Admin Course Builder"
    />
  );
}
