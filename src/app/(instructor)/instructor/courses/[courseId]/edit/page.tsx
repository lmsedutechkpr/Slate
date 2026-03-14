import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CourseEditorClient } from '@/components/instructor/courses/CourseEditorClient';

export default async function CourseEditPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch course
  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (!course) redirect('/instructor/courses');

  // Verify instructor owns this course
  const { data: ownership } = await supabase
    .from('course_instructors')
    .select('instructor_id')
    .eq('course_id', courseId)
    .eq('instructor_id', user.id)
    .single();

  if (!ownership) redirect('/instructor/courses');

  // Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('name');

  // Fetch instructor commission rate
  const { data: instructorProfile } = await supabase
    .from('instructor_profiles')
    .select('commission_rate')
    .eq('user_id', user.id)
    .single();

  return (
    <CourseEditorClient
      course={course}
      categories={categories ?? []}
      commissionRate={instructorProfile?.commission_rate ?? 70}
      userId={user.id}
    />
  );
}
