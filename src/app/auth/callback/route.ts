import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data: { user }, error } =
      await supabase.auth.exchangeCodeForSession(code)

    if (!error && user) {
      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', user.id)
        .single()

      if (!profile) {
        // New OAuth user — create profile as student
        await supabase.from('profiles').insert({
          id: user.id,
          full_name: user.user_metadata.full_name || user.email?.split('@')[0],
          avatar_url: user.user_metadata.avatar_url,
          role: 'student',
          status: 'active',
          preferred_language: 'en',
          registration_source: 'google'
        });
        await supabase.from('user_preferences').insert({ user_id: user.id });
        return NextResponse.redirect(`${origin}/student/dashboard`);
      }

      // Check if user is pending
      if (profile.status === 'pending') {
        return NextResponse.redirect(
          `${origin}/pending-approval?role=${profile.role}`
        );
      }

      // Active user - route to their dashboard
      const redirectMap: Record<string, string> = {
        admin: '/admin/dashboard',
        instructor: '/instructor/dashboard',
        seller: '/seller/dashboard',
        student: '/student/dashboard',
      };
      
      const targetRoute = redirectMap[profile.role] || '/student/dashboard';
      return NextResponse.redirect(`${origin}${targetRoute}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
