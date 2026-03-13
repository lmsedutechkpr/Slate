import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

interface PlayerLayoutProps {
  children: React.ReactNode;
}

export default async function PlayerLayout({ children }: PlayerLayoutProps) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Ensure they are actually a student
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'student') {
    redirect('/login');
  }

  return <>{children}</>;
}
