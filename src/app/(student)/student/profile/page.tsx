import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ProfilePageClient from '@/components/student/profile/ProfilePageClient';

export const dynamic = 'force-dynamic';

export default async function StudentProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 1. Full profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // 2. User preferences (fallback to defaults if missing)
  const { data: prefData } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const preferences = prefData || {
    language: 'en',
    playback_speed: 1,
    autoplay_next: true,
    show_subtitles: false,
  };

  // 3. Learning stats (parallel)
  const [enrolledRes, completedRes, certsRes, streakRes] = await Promise.all([
    supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('student_id', user.id).eq('is_active', true),
    supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('student_id', user.id).not('completed_at', 'is', null),
    supabase.from('certificates').select('id', { count: 'exact', head: true }).eq('student_id', user.id), // Schema has student_id
    supabase.from('user_streaks').select('*').eq('user_id', user.id).single(),
  ]);

  const stats = {
    totalEnrolled: enrolledRes.count ?? 0,
    completed: completedRes.count ?? 0,
    certificates: certsRes.count ?? 0,
    currentStreak: streakRes.data?.current_streak ?? 0,
  };

  return (
    <div className="max-w-[1000px] mx-auto pb-12">
      <ProfilePageClient
        profile={profile}
        preferences={preferences}
        stats={stats}
        userEmail={user.email ?? ''}
        userId={user.id}
      />
    </div>
  );
}
