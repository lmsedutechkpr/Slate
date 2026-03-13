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

  // 2. Fetch all lecture progress for this enrollment
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
    />
  );
}
