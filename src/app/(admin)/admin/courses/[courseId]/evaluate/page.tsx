import { notFound, redirect } from 'next/navigation';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import CourseEvaluationPlayer from '@/components/admin/content/CourseEvaluationPlayer';
import type { CourseItem } from '@/components/admin/content/types';

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function AdminCourseEvaluatePage({ params }: PageProps) {
  const { courseId } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') redirect('/student/dashboard');

  const { data: courseRow, error: courseError } = await admin
    .from('courses')
    .select('id, title, title_ta, status, language, course_sections(id)')
    .eq('id', courseId)
    .single();

  if (courseError || !courseRow) {
    notFound();
  }

  const { data: sectionRows } = await admin
    .from('course_sections')
    .select(`
      id, title, sort_order,
      lectures (
        id, title, title_ta, type,
        video_duration_secs, read_time_mins, quiz_duration_mins,
        video_url, article_content,
        is_published, is_free_preview,
        sort_order
      )
    `)
    .eq('course_id', courseId)
    .order('sort_order', { ascending: true });

  const quizLectureIds = (sectionRows || []).flatMap((section) =>
    (section.lectures || []).filter((lecture) => lecture.type === 'quiz').map((lecture) => lecture.id)
  );

  const quizzesByLectureId = new Map<string, any>();

  if (quizLectureIds.length > 0) {
    const { data: quizRows } = await admin
      .from('quizzes')
      .select('id, lecture_id, title, title_ta, pass_percentage, time_limit_mins, is_published')
      .in('lecture_id', quizLectureIds);

    const { data: questionRows } = await admin
      .from('quiz_questions')
      .select('id, lecture_id, question, question_text, options, correct_answer, explanation, sort_order')
      .in('lecture_id', quizLectureIds)
      .order('sort_order', { ascending: true });

    (quizRows || []).forEach((quiz) => {
      const linkedQuestions = (questionRows || []).filter((q) => q.lecture_id === quiz.lecture_id);
      quizzesByLectureId.set(quiz.lecture_id, {
        id: quiz.id,
        title: quiz.title || null,
        title_ta: quiz.title_ta || null,
        pass_percentage: quiz.pass_percentage,
        time_limit_mins: quiz.time_limit_mins,
        is_published: quiz.is_published,
        question_count: linkedQuestions.length,
        questions: linkedQuestions,
      });
    });
  }

  const course: CourseItem = {
    ...(courseRow as unknown as CourseItem),
    course_sections: (sectionRows || []).map((section) => ({
      ...section,
      lectures: (section.lectures || []).map((lecture) => ({
        ...lecture,
        quiz: quizzesByLectureId.get(lecture.id) || null,
      })),
    })),
  };

  return <CourseEvaluationPlayer course={course} />;
}
