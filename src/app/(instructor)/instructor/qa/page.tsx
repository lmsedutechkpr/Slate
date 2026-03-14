import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { QAPageClient } from '@/components/instructor/qa/QAPageClient';
import { createClient as adminClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export default async function InstructorQAPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Step 1 — Get instructor's course IDs
  const { data: instructorCourseRows } = await supabase
    .from('course_instructors')
    .select('course_id, courses(id, title, thumbnail_url)')
    .eq('instructor_id', user.id);

  const courseIds = (instructorCourseRows ?? []).map((r: any) => r.course_id).filter(Boolean);
  const instructorCourses = (instructorCourseRows ?? []).map((r: any) => r.courses).filter(Boolean);

  let questions: any[] = [];

  if (courseIds.length > 0) {
    // Use service role to bypass RLS — simpler query without self-join
    const db = adminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Fetch top-level questions only (NO nested course_qa join — PostgREST breaks on self-referential FK)
    const { data, error } = await db
      .from('course_qa')
      .select(`
        id, body, upvotes, reply_count,
        is_answered, is_pinned, is_deleted,
        created_at, course_id, lecture_id,
        courses ( id, title, thumbnail_url ),
        lectures ( id, title ),
        profiles!author_id ( id, full_name, avatar_url, role )
      `)
      .in('course_id', courseIds)
      .is('parent_id', null)
      .eq('is_deleted', false)
      .order('is_answered', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) console.error('QA fetch error:', error.message);
    questions = (data ?? []).map((q: any) => ({ ...q, course_qa: [] })); // replies loaded client-side
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const stats = {
    totalQuestions: questions.length,
    unanswered: questions.filter(q => !q.is_answered).length,
    answered: questions.filter(q => q.is_answered).length,
    thisWeek: questions.filter(q => new Date(q.created_at) >= sevenDaysAgo).length,
  };

  return (
    <QAPageClient
      questions={questions}
      stats={stats}
      instructorCourses={instructorCourses}
      courseIds={courseIds}
      userId={user.id}
    />
  );
}
