import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export default async function NewCoursePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const adminClient = createAdminClient();

  // Create a draft course immediately using admin client to easily bypass RLS
  const { data: course, error } = await adminClient
    .from('courses')
    .insert({
      title: 'Untitled Course',
      slug: `untitled-course-${uuidv4().slice(0, 8)}`,
      status: 'draft',
      language: 'en',
      difficulty: 'beginner',
      price: 0,
      is_free: true,
    })
    .select('id')
    .single();

  if (error || !course) {
    console.error('FAILED TO CREATE COURSE:', error);
    redirect('/instructor/courses');
  }

  // Link instructor
  const { error: linkError } = await adminClient.from('course_instructors').insert({
    course_id: course.id,
    instructor_id: user.id,
    is_primary: true,
    revenue_share: 70,
  });

  if (linkError) {
    console.error('FAILED TO LINK INSTRUCTOR:', linkError);
    redirect('/instructor/courses');
  }

  redirect(`/instructor/courses/${course.id}/edit`);
}
