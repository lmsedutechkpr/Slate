import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

type OAuthIdentity = { provider?: string; id?: string | null; provider_id?: string | null };

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const roleParam = searchParams.get('role')
  const intentParam = searchParams.get('intent')
  const languageParam = searchParams.get('lang')
  const oauthRole = roleParam === 'student' || roleParam === 'instructor' || roleParam === 'seller' ? roleParam : null
  const oauthIntent = intentParam === 'login' || intentParam === 'signup' ? intentParam : null
  const oauthLanguage = languageParam === 'ta' ? 'ta' : 'en'

  if (code) {
    const supabase = await createClient()
    const { data: { user }, error } =
      await supabase.auth.exchangeCodeForSession(code)

    if (!error && user) {
      const provider = String(user.app_metadata?.provider || '').toLowerCase();
      const identities = (Array.isArray((user as { identities?: unknown }).identities)
        ? (user as { identities?: OAuthIdentity[] }).identities
        : []) || [];
      const googleIdentity = identities.find((identity) => identity?.provider === 'google');
      const googleSub =
        googleIdentity?.id ||
        googleIdentity?.provider_id ||
        (typeof user.user_metadata?.sub === 'string' ? user.user_metadata.sub : null);

      // Prevent duplicate app accounts for same email in OAuth flows.
      if (provider === 'google' && user.email) {
        try {
          const admin = createAdminClient();
          const { data: allUsers } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
          const sameEmailUsers = (allUsers?.users || []).filter(
            (u) => String(u.email || '').toLowerCase() === String(user.email || '').toLowerCase()
          );

          const duplicateIds = sameEmailUsers.map((u) => u.id).filter((id) => id !== user.id);
          if (duplicateIds.length) {
            const { data: existingProfiles } = await supabase
              .from('profiles')
              .select('id')
              .in('id', duplicateIds)
              .limit(1);

            if (existingProfiles?.length) {
              // A profile already exists for this email under another auth user; remove current duplicate auth user.
              await admin.auth.admin.deleteUser(user.id).catch(() => {});
              await supabase.auth.signOut().catch(() => {});
              return NextResponse.redirect(`${origin}/login?error=oauth_account_linked`);
            }
          }
        } catch {
          // Do not fail OAuth callback on optional dedupe checks.
        }
      }

      // Check if profile exists
      let { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', user.id)
        .single()

      if (!profile) {
        const metadataRole = typeof user.user_metadata?.role === 'string' ? user.user_metadata.role : null;
        const role = metadataRole || oauthRole;

        // New OAuth user from login page should not be auto-assigned as student.
        if (!role && oauthIntent === 'login') {
          await supabase.auth.signOut().catch(() => {});
          return NextResponse.redirect(`${origin}/signup?error=google_choose_role`);
        }

        if (!role) {
          await supabase.auth.signOut().catch(() => {});
          return NextResponse.redirect(`${origin}/signup?error=google_choose_role`);
        }

        const status = role === 'instructor' || role === 'seller' ? 'pending_approval' : 'active';

        // New user or missing profile — create a safe default profile from auth metadata.
        const profilePayload = {
          id: user.id,
          full_name: user.user_metadata.full_name || user.email?.split('@')[0],
          avatar_url: user.user_metadata.avatar_url,
          role,
          status,
          preferred_language: oauthLanguage,
          registration_source: provider === 'google' ? 'google' : 'self',
          google_sub: provider === 'google' ? googleSub : null,
        };

        const { error: profileInsertError } = await supabase.from('profiles').upsert(profilePayload);
        if (profileInsertError?.message?.toLowerCase().includes('google_sub')) {
          // Backward-compatible path if google_sub column is not migrated yet.
          const { google_sub, ...fallbackPayload } = profilePayload;
          await supabase.from('profiles').upsert(fallbackPayload);
        }

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
      } else if (provider === 'google' && googleSub) {
        // Keep google_sub synced for existing OAuth users when schema supports it.
        const { error: updateGoogleError } = await supabase
          .from('profiles')
          .update({ google_sub: googleSub, registration_source: 'google' })
          .eq('id', user.id);

        if (updateGoogleError?.message?.toLowerCase().includes('google_sub')) {
          await supabase
            .from('profiles')
            .update({ registration_source: 'google' })
            .eq('id', user.id);
        }
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
