import {redirect} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';
import DashboardShell from '@/components/student/layout/DashboardShell';
import SuspensionGuard from '@/components/auth/SuspensionGuard';

interface StudentLayoutProps {
  children: React.ReactNode;
}

export default async function StudentLayout({children}: StudentLayoutProps) {
  const supabase = await createClient();

  const {
    data: {user}
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?callbackUrl=/student/dashboard');
  }

  const {data: profile} = await supabase
    .from('profiles')
    .select('id, role, status, full_name, avatar_url, preferred_language')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  if (profile.status === 'suspended') {
    redirect('/login?error=suspended');
  }

  if (profile.role !== 'student') {
    const roleRoutes: Record<string, string> = {
      admin: '/admin/dashboard',
      instructor: '/instructor/dashboard',
      seller: '/seller/dashboard'
    };
    redirect(roleRoutes[profile.role] || '/login');
  }

  return (
    <DashboardShell profile={profile}>
      <SuspensionGuard userId={user.id} />
      {children}
    </DashboardShell>
  );
}
