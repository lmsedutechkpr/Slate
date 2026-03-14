import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import LivePageClient from '@/components/instructor/live/LivePageClient';

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function InstructorLivePage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const db = adminDb();

  // 1. Fetch all live classes for this instructor bypassing RLS
  const { data: liveClasses } = await db
    .from('live_classes')
    .select(`
      id, title, title_ta, description,
      scheduled_at, duration_mins,
      status, max_attendees,
      actual_attendees, meeting_url,
      meeting_id, meeting_password,
      recording_url, started_at,
      ended_at, cancelled_reason,
      created_at,
      courses (
        id, title, thumbnail_url, slug
      )
    `)
    .eq('instructor_id', user.id)
    .order('scheduled_at', { ascending: false });

  // 2. Fetch instructor courses (for creating a new class)
  const { data: instructorCourses } = await supabase
    .from('course_instructors')
    .select(`
      courses ( id, title, slug )
    `)
    .eq('instructor_id', user.id);

  const coursesList = instructorCourses?.map((ic: any) => ic.courses).filter(Boolean) || [];

  // 3. Compute Stats
  const classes = liveClasses || [];
  const completedClasses = classes.filter(c => c.status === 'completed');
  
  const totalSessions = classes.length;
  const totalAttendees = classes.reduce((sum, c) => sum + (c.actual_attendees || 0), 0);
  const upcomingSessions = classes.filter(c => c.status === 'scheduled').length;
  
  let avgAttendees = 0;
  if (completedClasses.length > 0) {
    const completedAttendees = completedClasses.reduce((sum, c) => sum + (c.actual_attendees || 0), 0);
    avgAttendees = Math.round(completedAttendees / completedClasses.length);
  }

  const stats = {
    totalSessions,
    totalAttendees,
    upcomingSessions,
    avgAttendees,
  };

  return (
    <LivePageClient 
      liveClasses={classes} 
      instructorCourses={coursesList}
      stats={stats}
      userId={user.id}
    />
  );
}
