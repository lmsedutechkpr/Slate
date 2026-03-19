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
      let { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', user.id)
        .single()

      if (!profile) {
        const role = (user.user_metadata?.role as string) || 'student';
        const status = role === 'instructor' || role === 'seller' ? 'pending_approval' : 'active';

        // New user or missing profile — create a safe default profile from auth metadata.
        await supabase.from('profiles').upsert({
          id: user.id,
          full_name: user.user_metadata.full_name || user.email?.split('@')[0],
          avatar_url: user.user_metadata.avatar_url,
          role,
          status,
          preferred_language: 'en',
          registration_source: user.app_metadata?.provider === 'google' ? 'google' : 'self'
        });
        await supabase.from('user_preferences').upsert({ user_id: user.id }, { onConflict: 'user_id' });

        if (role === 'instructor') {
          await supabase.from('instructor_profiles').upsert(
            {
              user_id: user.id,
              headline: user.user_metadata?.headline || null,
              expertise_tags: user.user_metadata?.expertise_tags || [],
              teaching_languages: user.user_metadata?.teaching_languages || ['en'],
              bio: user.user_metadata?.short_bio || null,
              linkedin_url: user.user_metadata?.linkedin_url || null,
              commission_rate: 70,
            },
            { onConflict: 'user_id' }
          );
        }

        if (role === 'seller') {
          const rawBusinessType =
            typeof user.user_metadata?.business_type === 'string'
              ? user.user_metadata.business_type
              : '';
          const normalizedBusinessType =
            rawBusinessType.toLowerCase() === 'company' ? 'company' : 'individual';

          await supabase.from('seller_profiles').upsert(
            {
              user_id: user.id,
              store_name: user.user_metadata?.store_name || null,
              store_name_ta: user.user_metadata?.store_name_ta || null,
              store_slug: user.user_metadata?.store_slug || null,
              store_description: user.user_metadata?.store_description || null,
              business_type: normalizedBusinessType,
              commission_rate: 85,
              contact_email: user.email || null,
            },
            { onConflict: 'user_id' }
          );
        }

        profile = { role, status };
      }

      // Check if user is pending
      if (profile.status === 'pending' || profile.status === 'pending_approval') {
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
