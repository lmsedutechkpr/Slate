import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  let supabaseResponse = intlMiddleware(request);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          );
          
          // Re-apply intl middleware headers after updating cookies
          const intlRes = intlMiddleware(request);
          intlRes.headers.forEach((val, key) => supabaseResponse.headers.set(key, val));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Protect portal routes
  if (
    pathname.startsWith('/student') ||
    pathname.startsWith('/instructor') ||
    pathname.startsWith('/seller') ||
    pathname.startsWith('/admin')
  ) {
    if (!user) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (profile.status === 'pending') {
      return NextResponse.redirect(new URL(`/pending-approval?role=${profile.role}`, request.url));
    }

    const role = profile.role;

    if (pathname.startsWith('/student') && role !== 'student') {
      return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url));
    }
    if (pathname.startsWith('/instructor') && role !== 'instructor') {
      return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url));
    }
    if (pathname.startsWith('/seller') && role !== 'seller') {
      return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url));
    }
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
