import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PlayerShell from '@/components/student/player/PlayerShell';

export const dynamic = 'force-dynamic';

export default async function CoursePlayerPage({
  params
}: {
  params: Promise<{ courseId: string }>
}) {
  const resolvedParams = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Fetch enrollment + course (Must exist and be active)
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select(`
      id, progress_pct, last_accessed_at, completed_at, is_active,
      courses ( id, title, title_ta, slug, total_lectures, certificate_enabled )
    `)
    .eq('student_id', user.id)
    .eq('course_id', resolvedParams.courseId)
    .eq('is_active', true)
    .single();

  if (!enrollment || !enrollment.courses) {
    redirect('/student/courses/browse');
  }

  // 2. Query sections + lectures separately to avoid silent nested failure
  // RLS hides course_sections from students directly, so we use the admin key
  // since we already explicitly authorized the student with the enrollment check above
  const { createClient: createAdminClient } = await import('@supabase/supabase-js');
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: sectionsRaw } = await supabaseAdmin
    .from('course_sections')
    .select(`
      id, title, title_ta, sort_order,
      lectures (
        id, title, title_ta, type,
        video_url, video_duration_secs,
        read_time_mins, quiz_duration_mins,
        article_content, is_free_preview,
        is_published, sort_order, resources
      )
    `)
    .eq('course_id', resolvedParams.courseId)
    .order('sort_order', { ascending: true });

  const sections = (sectionsRaw ?? []).map((section: any) => ({
    ...section,
    lectures: (section.lectures ?? [])
      .filter((l: any) => l.is_published)
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
  }));

  // 3. Fetch all quizzes + questions using admin client (RLS blocks students)
  const allQuizLectureIds = (sectionsRaw ?? []).flatMap((s: any) =>
    (s.lectures ?? []).filter((l: any) => l.type === 'quiz').map((l: any) => l.id)
  );

  const quizzesMap: Record<string, any> = {};
  if (allQuizLectureIds.length > 0) {
    const { data: quizzesRaw } = await supabaseAdmin
      .from('quizzes')
      .select('id, lecture_id, title, title_ta, pass_percentage, time_limit_mins, is_published')
      .in('lecture_id', allQuizLectureIds)
      .eq('is_published', true);

    const { data: questionsRaw } = await supabaseAdmin
      .from('quiz_questions')
      .select('id, quiz_id, lecture_id, question, question_text, options, correct_answer, explanation, sort_order')
      .in('lecture_id', allQuizLectureIds)
      .order('sort_order', { ascending: true });

    for (const quiz of (quizzesRaw ?? [])) {
      const rawQuestions = (questionsRaw ?? []).filter((q: any) => q.lecture_id === quiz.lecture_id);

      const questions = rawQuestions.map((q: any) => {
        const rawOpts: any[] = Array.isArray(q.options) ? q.options : [];
        const isObjects = rawOpts.length > 0 && typeof rawOpts[0] === 'object';

        // CANONICAL: emit options as {label, value: '0-based-index'}
        // QuizPlayer stores answers as opt.value ('0','1','2','3')
        const normOpts = rawOpts.map((o: any, i: number) => ({
          label: typeof o === 'string' ? o : (o?.label ?? ''),
          value: String(i),  // 0-based index — this is what gets stored in answers state
        }));

        // CANONICAL: correct_answer = opt.value of the correct option
        // DB stores: correct_answer = '1' meaning the option at index 1 (value='1')
        // findIndex(o.value === raw) returns 1 → but we need to return value='1' for comparison
        // Since normOpts values ARE 0-based indices, and correct_answer IS a 0-based index string,
        // we just need to verify the correct_answer is a valid 0-based index string.
        const rawCA = String(q.correct_answer ?? '0');
        let correctValue = '0';
        if (isObjects) {
          // Find which original option had that value (matches canonical format directly)
          const idx = rawOpts.findIndex((o: any) => String(o?.value) === rawCA);
          // idx is the 0-based position; normOpts[idx].value === String(idx)
          correctValue = idx >= 0 ? String(idx) : rawCA;
        } else {
          correctValue = rawCA; // Already 0-based index string
        }

        return {
          ...q,
          question: (q.question ?? q.question_text ?? '') as string,
          options: normOpts,        // {label, value:'0'-'3'}[]
          correct_answer: correctValue, // '0'|'1'|'2'|'3' — matches opt.value
          explanation: q.explanation ?? '',
        };
      });

      quizzesMap[quiz.lecture_id] = { ...quiz, questions };
    }
  }

  // 4. Fetch all lecture progress for this enrollment

  const { data: progress } = await supabase
    .from('lecture_progress')
    .select('lecture_id, is_completed, progress_secs')
    .eq('enrollment_id', enrollment.id);

  // 3. Calculate Resume Lecture
  const completedIds = new Set(
    progress?.filter(p => p.is_completed).map(p => p.lecture_id) || []
  );
  
  const allLectures = sections.flatMap((s: any) => s.lectures);
  const resumeLecture = allLectures.find((l: any) => !completedIds.has(l.id)) ?? allLectures[0];

  // 4. User Preferences
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('language, playback_speed, autoplay_next, show_subtitles')
    .eq('user_id', user.id)
    .single();

  return (
    <PlayerShell 
      enrollment={enrollment}
      sections={sections as any[]}
      progress={progress || []}
      resumeLecture={resumeLecture as any}
      userId={user.id}
      prefs={prefs}
      quizzesMap={quizzesMap}
    />
  );
}
