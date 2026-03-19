import { notFound, redirect } from 'next/navigation';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import CourseDetailClient from '@/components/admin/content/CourseDetailClient';
import type { CourseItem, InstructorOption } from '@/components/admin/content/types';

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function AdminCourseDetailPage({ params }: PageProps) {
  const { courseId } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') redirect('/student/dashboard');

  const { data, error } = await admin
    .from('courses')
    .select(`
      *,
      categories ( name, slug ),
      course_instructors (
        instructor_id, is_primary, revenue_share,
        profiles!instructor_id (
          id, full_name, avatar_url,
          bio,
          instructor_profiles (
            headline, total_students,
            avg_rating, total_courses
          )
        )
      )
    `)
    .eq('id', courseId)
    .single();

  if (error || !data) {
    console.error('Failed to load course review detail:', error);
    notFound();
  }

  const { data: sectionRows } = await admin
    .from('course_sections')
    .select(`
      id, title, sort_order,
      lectures (
        id, title, title_ta, type,
        video_duration_secs,
        read_time_mins,
        quiz_duration_mins,
        video_url,
        article_content,
        is_published, is_free_preview,
        sort_order
      )
    `)
    .eq('course_id', courseId)
    .order('sort_order', { ascending: true });

  const allQuizLectureIds = (sectionRows || []).flatMap((section) =>
    (section.lectures || []).filter((lecture) => lecture.type === 'quiz').map((lecture) => lecture.id)
  );

  const quizzesByLectureId = new Map<
    string,
    {
      id: string;
      title: string | null;
      title_ta: string | null;
      pass_percentage: number | null;
      time_limit_mins: number | null;
      is_published: boolean | null;
      question_count: number;
    }
  >();

  if (allQuizLectureIds.length > 0) {
    const { data: quizRows } = await admin
      .from('quizzes')
      .select('id, lecture_id, title, title_ta, pass_percentage, time_limit_mins, is_published')
      .in('lecture_id', allQuizLectureIds);

    const { data: questionRows } = await admin
      .from('quiz_questions')
      .select('id, lecture_id')
      .in('lecture_id', allQuizLectureIds);

    const questionCountByLectureId = new Map<string, number>();
    (questionRows || []).forEach((row) => {
      questionCountByLectureId.set(row.lecture_id, (questionCountByLectureId.get(row.lecture_id) || 0) + 1);
    });

    (quizRows || []).forEach((row) => {
      quizzesByLectureId.set(row.lecture_id, {
        id: row.id,
        title: row.title || null,
        title_ta: row.title_ta || null,
        pass_percentage: row.pass_percentage,
        time_limit_mins: row.time_limit_mins,
        is_published: row.is_published,
        question_count: questionCountByLectureId.get(row.lecture_id) || 0,
      });
    });
  }

  const mergedCourse = {
    ...(data as CourseItem),
    course_sections: (sectionRows || []).map((section) => ({
      ...section,
      lectures: (section.lectures || []).map((lecture) => ({
        ...lecture,
        quiz: quizzesByLectureId.get(lecture.id) || null,
      })),
    })),
  };

  const { data: instructorProfiles } = await admin
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('role', 'instructor')
    .eq('status', 'active')
    .order('full_name', { ascending: true });

  const instructorIds = (instructorProfiles || []).map((row) => row.id);
  const { data: instructorMeta } = instructorIds.length
    ? await admin
        .from('instructor_profiles')
        .select('user_id, headline')
        .in('user_id', instructorIds)
    : { data: [] as Array<{ user_id: string; headline: string | null }> };

  const headlineMap = new Map((instructorMeta || []).map((row) => [row.user_id, row.headline]));
  const instructorOptions: InstructorOption[] = (instructorProfiles || []).map((row) => ({
    id: row.id,
    full_name: row.full_name || 'Unnamed Instructor',
    avatar_url: row.avatar_url || null,
    headline: headlineMap.get(row.id) || null,
  }));

  return (
    <CourseDetailClient
      course={mergedCourse}
      adminId={user.id}
      instructorOptions={instructorOptions}
    />
  );
}
