'use client';

import {Menu} from 'lucide-react';
import {motion, useMotionTemplate, useScroll, useTransform} from 'framer-motion';
import {usePathname, Link} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';
import LanguageToggle from '@/components/landing/LanguageToggle';
import {Sheet, SheetContent, SheetTrigger, SheetClose} from '@/components/ui/sheet';
import {cn} from '@/lib/utils';

const links = [
  {key: 'forInstructors', href: '/signup?role=instructor'},
  {key: 'forSellers', href: '/signup?role=seller'}
];

function TrafficDots() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full bg-[var(--traffic-red)]" />
      <span className="h-2.5 w-2.5 rounded-full bg-[var(--traffic-yellow)]" />
      <span className="h-2.5 w-2.5 rounded-full bg-[var(--traffic-green)]" />
    </div>
  );
}

export default function Navbar() {
  const t = useTranslations('landing.navbar');
  const pathname = usePathname();
  const {scrollY} = useScroll();
  const bg = useTransform(
    scrollY,
    [0, 24],
    ['rgba(10,10,10,0)', 'rgba(10,10,10,0.72)']
  );
  const border = useTransform(
    scrollY,
    [0, 24],
    ['rgba(255,255,255,0)', 'rgba(255,255,255,0.08)']
  );
  const blur = useTransform(scrollY, [0, 24], [0, 20]);
  const backdropFilter = useMotionTemplate`blur(${blur}px) saturate(180%)`;

  return (
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <motion.header
        style={{
          backgroundColor: bg,
          borderBottomColor: border,
          backdropFilter
        }}
        className="w-full max-w-5xl rounded-[26px] border shadow-sm shadow-black/5"
      >
        <nav className="mx-auto flex h-[52px] w-full items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-3 text-[17px] font-bold text-white">
          <TrafficDots />
          Slate
        </Link>

        {/* Center nav — desktop only */}
        <div className="hidden items-center gap-6 lg:flex">
          {links.map((link) => {
            const active = pathname === link.href.split('?')[0];
            return (
              <Link
                key={link.key}
                href={link.href}
                className={cn(
                  'text-[13px] font-medium transition-colors duration-150',
                  active ? 'text-white' : 'text-white/60 hover:text-white'
                )}
              >
                {t(`links.${link.key}`)}
              </Link>
            );
          })}
        </div>

        {/* Right — desktop */}
        <div className="hidden items-center gap-3 lg:flex">
          <LanguageToggle />
          <Link
            href="/login"
            className="rounded-full border border-[var(--border-hover)] px-4 py-1.5 text-sm font-medium text-white transition hover:bg-[rgba(255,255,255,0.06)]"
          >
            {t('login')}
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-[#0A0A0A] transition hover:scale-[1.02] hover:bg-[rgba(255,255,255,0.8)]"
          >
            {t('getStarted')}
          </Link>
        </div>

        {/* Mobile menu */}
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label={t('openMenu')}
                className="p-1 text-[var(--text)]"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-[var(--surface)] border-l border-[var(--border)]">
              <div className="mt-8 flex flex-col">
                {links.map((link) => (
                  <SheetClose asChild key={link.key}>
                    <Link
                      href={link.href}
                      className="border-b border-[var(--border)] py-3 text-base font-medium text-[var(--text-secondary)] hover:text-[var(--text)]"
                    >
                      {t(`links.${link.key}`)}
                    </Link>
                  </SheetClose>
                ))}
                <div className="mt-6 flex flex-col gap-3">
                  <LanguageToggle />
                  <SheetClose asChild>
                    <Link
                      href="/login"
                      className="rounded-full border border-[var(--border-hover)] px-4 py-2.5 text-center text-sm font-medium text-[var(--text)] transition hover:bg-[rgba(0,0,0,0.06)]"
                    >
                      {t('login')}
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      href="/signup"
                      className="rounded-full bg-[var(--white-surface)] px-4 py-2.5 text-center text-sm font-semibold text-[var(--white-text)] transition hover:bg-[rgba(0,0,0,0.8)]"
                    >
                      {t('getStarted')}
                    </Link>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
      </motion.header>
    </div>
  );
}
