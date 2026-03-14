import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import InstructorSidebar from '@/components/instructor/InstructorSidebar';
import InstructorTopbar from '@/components/instructor/InstructorTopbar';

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status, full_name, avatar_url')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'instructor') redirect('/student/dashboard');
  if (profile.status === 'pending') redirect('/pending-approval?role=instructor');

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <InstructorSidebar serverProfile={profile} />
      <main className="flex flex-1 flex-col overflow-hidden">
        <InstructorTopbar userId={user.id} />
        <div className="flex-1 overflow-y-auto bg-[#F5F5F7] p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

