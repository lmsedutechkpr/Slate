import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import MessagesClient from '@/components/student/messages/MessagesClient';

export const dynamic = 'force-dynamic';

export default async function InstructorMessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch instructor profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, display_name, avatar_url, role')
    .eq('id', user.id)
    .single();

  // 1. Fetch all conversations where instructor is a participant
  const { data: convosData } = await supabase
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

  // 2. Fetch students enrolled in any of the instructor's courses
  //    so the instructor can start a new conversation with them
  const { data: instructorCourseRows } = await supabase
    .from('course_instructors')
    .select('course_id')
    .eq('instructor_id', user.id);

  const courseIds = (instructorCourseRows ?? []).map((r: any) => r.course_id).filter(Boolean);

  let students: any[] = [];
  if (courseIds.length > 0) {
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select(`
        student_id,
        profiles!enrollments_student_id_fkey (
          id, full_name, display_name, avatar_url, role
        )
      `)
      .in('course_id', courseIds)
      .eq('is_active', true);

    // Deduplicate by student id
    const studentMap = new Map<string, any>();
    for (const e of enrollments ?? []) {
      const p = (e as any).profiles;
      if (p && p.id !== user.id && !studentMap.has(p.id)) {
        studentMap.set(p.id, p);
      }
    }
    students = Array.from(studentMap.values());
  }

  return (
    <div className="-m-6 h-[calc(100vh-56px)] flex overflow-hidden">
      <MessagesClient
        initialConversations={convosData || []}
        instructors={students}
        userId={user.id}
        userProfile={profile}
        contactLabel="Message a Student"
        emptyHint="Start a conversation with any student enrolled in your courses."
      />
    </div>
  );
}
