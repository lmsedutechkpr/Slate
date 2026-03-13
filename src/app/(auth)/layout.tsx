import {redirect} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';

export default async function AuthLayout({children}: {children: React.ReactNode}) {
  const supabase = await createClient();
  const {
    data: {user}
  } = await supabase.auth.getUser();

  if (user) {
    const {data: profile} = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile) {
      const redirectMap: Record<string, string> = {
        admin: '/admin/dashboard',
        instructor: '/instructor/dashboard',
        seller: '/seller/dashboard',
        student: '/student/dashboard'
      };
      redirect(redirectMap[profile.role] ?? '/student/dashboard');
    } else {
        redirect('/student/dashboard');
    }
  }

  return (
    <div
      className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center bg-[var(--bg)] px-4 py-8 sm:px-6 md:py-12"
      style={{
        backgroundImage:
          'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)',
        backgroundSize: '64px 64px'
      }}
    >
      <div className="relative w-full z-10">{children}</div>
    </div>
  );
}
