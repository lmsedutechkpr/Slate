import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import MessagesClient from '@/components/student/messages/MessagesClient';

export const dynamic = 'force-dynamic';

export default async function StudentMessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch full user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, display_name, avatar_url, role')
    .eq('id', user.id)
    .single();

  // 1. Fetch conversations where user is participant_1 OR participant_2
  // We need to fetch the profiles of BOTH participants to resolve 'the other user'
  const { data: convosData, error: convosErr } = await supabase
    .from('conversations')
    .select(`
      id,
      participant_1,
      participant_2,
      last_message_at,
      unread_count_p1,
      unread_count_p2,
      created_at,
      p1:profiles!participant_1(id, full_name, display_name, avatar_url, role),
      p2:profiles!participant_2(id, full_name, display_name, avatar_url, role)
    `)
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
    .order('last_message_at', { ascending: false });

  // 2. Fetch instructors the student is enrolled with (for starting new messages)
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      course_id,
      courses (
        course_instructors (
          profiles (id, full_name, avatar_url, role)
        )
      )
    `)
    .eq('student_id', user.id)
    .eq('is_active', true);

  // Extract unique instructors
  const instructorMap = new Map();
  if (enrollments) {
    for (const en of enrollments) {
      const course = en.courses as any;
      if (!course?.course_instructors) continue;
      
      const courseInstructors = Array.isArray(course.course_instructors) 
        ? course.course_instructors 
        : [course.course_instructors];
        
      for (const ci of courseInstructors) {
        const prof = ci.profiles;
        if (prof && prof.id !== user.id && !instructorMap.has(prof.id)) {
          instructorMap.set(prof.id, prof);
        }
      }
    }
  }

  const instructors = Array.from(instructorMap.values());

  return (
    <div className="h-[calc(100vh-64px)] flex overflow-hidden">
      <MessagesClient
        initialConversations={convosData || []}
        instructors={instructors}
        userId={user.id}
        userProfile={profile}
      />
    </div>
  );
}
