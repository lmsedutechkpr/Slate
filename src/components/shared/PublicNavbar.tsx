'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/#features', label: 'Features' },
  { href: '/#roles', label: 'Roles' },
  { href: '/#flow', label: 'Flow' },
  { href: '/#benefits', label: 'Benefits' },
  { href: '/courses', label: 'Courses' },
  { href: '/search', label: 'Search' },
  { href: '/instructors', label: 'Instructors' },
  { href: '/sellers', label: 'Sellers' },
  { href: '/support', label: 'Support' },
];

function roleCta(role: string | null) {
  if (role === 'student') return { href: '/student/dashboard', label: 'My Dashboard' };
  if (role === 'instructor') return { href: '/instructor/dashboard', label: 'Instructor Hub' };
  if (role === 'seller') return { href: '/seller/dashboard', label: 'Seller Hub' };
  if (role === 'admin') return { href: '/admin/dashboard', label: 'Admin' };
  return null;
}

export default function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) {
        setIsAuthed(false);
        setRole(null);
        return;
      }
      setIsAuthed(true);
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
      setRole(profile?.role || null);
    });
  }, []);

  const cta = useMemo(() => roleCta(role), [role]);

  return (
    <header className="fixed left-1/2 top-4 z-50 w-[calc(100%-1rem)] max-w-6xl -translate-x-1/2 sm:w-[calc(100%-2rem)]">
      <div className="rounded-2xl border border-[rgba(20,20,20,0.09)] bg-[rgba(250,250,250,0.72)] shadow-[0_24px_70px_rgba(18,18,18,0.12)] backdrop-blur-2xl">
        <div className="flex h-14 items-center justify-between px-4 sm:px-5">
          <div className="hidden w-10 lg:block" />

          <nav className="hidden items-center gap-4 lg:flex">
          {LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="text-[13px] font-semibold text-[#555A62] transition-colors hover:text-[#17181C]">
              {item.label}
            </Link>
          ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            {isAuthed && cta ? (
              <Link href={cta.href} className="rounded-full bg-[#121317] px-4 py-2 text-[12px] font-semibold text-white">
                {cta.label}
              </Link>
            ) : (
              <>
                <Link href="/login" className="rounded-full border border-[rgba(24,24,24,0.12)] bg-white px-4 py-2 text-[12px] font-semibold text-[#16171B]">
                  Sign in
                </Link>
                <Link href="/signup" className="rounded-full bg-[#121317] px-4 py-2 text-[12px] font-semibold text-white">
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-lg border border-[rgba(20,20,20,0.12)] bg-white text-[#17181C] lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Open menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {open ? (
          <div className="border-t border-[rgba(20,20,20,0.1)] px-4 pb-4 lg:hidden">
            <div className="flex flex-col gap-2 pt-3">
              {LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl border border-[rgba(20,20,20,0.1)] bg-white px-3 py-2 text-left text-[13px] font-semibold text-[#16171B]"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {isAuthed && cta ? (
                <Link href={cta.href} className="col-span-2 rounded-xl bg-[#121317] px-3 py-2 text-center text-[12px] font-semibold text-white" onClick={() => setOpen(false)}>
                  {cta.label}
                </Link>
              ) : (
                <>
                  <Link href="/login" className="rounded-xl border border-[rgba(20,20,20,0.1)] bg-white px-3 py-2 text-center text-[12px] font-semibold text-[#16171B]" onClick={() => setOpen(false)}>
                    Sign in
                  </Link>
                  <Link href="/signup" className="rounded-xl bg-[#121317] px-3 py-2 text-center text-[12px] font-semibold text-white" onClick={() => setOpen(false)}>
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
