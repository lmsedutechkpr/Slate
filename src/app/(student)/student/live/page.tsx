import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import LivePageClient from '@/components/student/live/LivePageClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Live Classes – Slate',
  description: 'Join upcoming and live sessions from your enrolled courses.',
};

export default async function LiveClassesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Admin client to bypass RLS for live classes (same pattern as other pages)
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // QUERY 1 — All live classes (bypasses RLS)
  const { data: liveClassesRaw, error: lcError } = await supabaseAdmin
    .from('live_classes')
    .select(`
      id, title, title_ta, description,
      scheduled_at, duration_mins,
      status, max_attendees, actual_attendees,
      meeting_url, meeting_id, recording_url,
      course_id,
      courses (
        id, title, title_ta, slug,
        course_instructors (
          profiles ( full_name, avatar_url )
        )
      )
    `)
    .order('scheduled_at', { ascending: true })
    .limit(50);

  if (lcError) {
    console.error('[LiveClassesPage] Error fetching live classes:', lcError.message);
  }

  // --- Auto-healing the database status ---
  // Find any stray "live" or "scheduled" classes that have passed their duration threshold
  const now = new Date();
  const expiredToUpdate = (liveClassesRaw || []).filter((lc: any) => {
    if (lc.status === 'completed' || lc.status === 'cancelled') return false;
    const endObj = new Date(new Date(lc.scheduled_at).getTime() + (lc.duration_mins || 60) * 60000);
    return now > endObj;
  });

  if (expiredToUpdate.length > 0) {
    // Fire and forget update so we don't block rendering
    Promise.all(
      expiredToUpdate.map((lc: any) =>
        supabaseAdmin.from('live_classes').update({ status: 'completed' }).eq('id', lc.id)
      )
    ).catch(e => console.error("[LiveClassesPage] Failed to auto-update expired live classes", e));
    
    // Patch local raw data so the client sees it as completed instantly
    expiredToUpdate.forEach((lc: any) => lc.status = 'completed');
  }

  // QUERY 2 — Student enrolled course IDs
  const { data: enrollments } = await supabaseAdmin
    .from('enrollments')
    .select('course_id')
    .eq('student_id', user.id)
    .eq('is_active', true);

  // QUERY 3 — Reminders via user_events (live_class_reminders table doesn't exist)
  const { data: eventReminders } = await supabaseAdmin
    .from('user_events')
    .select('metadata')
    .eq('user_id', user.id)
    .eq('event_type', 'live_reminder');

  const enrolledCourseIds = enrollments?.map(e => e.course_id).filter(Boolean) as string[] || [];

  const reminderIds = (eventReminders || [])
    .map(e => (e.metadata as any)?.live_class_id)
    .filter(Boolean) as string[];

  // Normalise courses nested object (Supabase returns it as object on 1:1 FK joins)
  // Strictly filter to only include classes from courses the student is enrolled in
  const liveClasses = (liveClassesRaw || [])
    .map((lc: any) => ({
      ...lc,
      courses: Array.isArray(lc.courses) ? lc.courses[0] : lc.courses,
    }))
    .filter((lc: any) => lc.courses?.id && enrolledCourseIds.includes(lc.courses.id));
  // Get user language preference
  const { data: prefs } = await supabaseAdmin
    .from('user_preferences')
    .select('language')
    .eq('user_id', user.id)
    .single();

  return (
    <LivePageClient
      liveClasses={liveClasses}
      enrolledCourseIds={enrolledCourseIds}
      reminderIds={reminderIds}
      userId={user.id}
      language={prefs?.language}
    />
  );
}
