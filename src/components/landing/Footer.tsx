import {Github, Instagram, Twitter} from 'lucide-react';
import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import LanguageToggle from '@/components/landing/LanguageToggle';

const learnLinks = [
  {key: 'allCourses', href: '/courses'},
  {key: 'liveClasses', href: '/live'},
  {key: 'certificates', href: '/certificates'},
  {key: 'instructors', href: '/instructors'}
];

const shopLinks = [
  {key: 'allProducts', href: '/shop'},
  {key: 'categories', href: '/shop/categories'},
  {key: 'sellers', href: '/sellers'},
  {key: 'deals', href: '/shop?sort=discount'}
];

const platformLinks = [
  {key: 'forInstructors', href: '/signup?role=instructor'},
  {key: 'forSellers', href: '/signup?role=seller'},
  {key: 'helpCenter', href: '/help'},
  {key: 'privacy', href: '/privacy'},
  {key: 'terms', href: '/terms'}
];

export default async function Footer() {
  const t = await getTranslations('landing.footer');

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg)] pb-10 pt-16">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div>
            <div className="inline-flex items-center gap-3 text-[17px] font-bold text-[var(--text)]">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--traffic-red)]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--traffic-yellow)]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--traffic-green)]" />
              </div>
              Slate
            </div>
            <p className="mt-2 text-[13px] text-[var(--text-muted)]">{t('tagline')}</p>
            <div className="mt-4">
              <LanguageToggle compact />
            </div>
          </div>

          {/* Learn */}
          <div>
            <h4 className="mb-4 text-[12px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{t('learn')}</h4>
            <div className="flex flex-col gap-2.5">
              {learnLinks.map((link) => (
                <Link key={link.key} href={link.href} className="text-[14px] text-[var(--text-secondary)] transition-colors hover:text-[var(--text)]">
                  {t(`links.${link.key}`)}
                </Link>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="mb-4 text-[12px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{t('shop')}</h4>
            <div className="flex flex-col gap-2.5">
              {shopLinks.map((link) => (
                <Link key={link.key} href={link.href} className="text-[14px] text-[var(--text-secondary)] transition-colors hover:text-[var(--text)]">
                  {t(`links.${link.key}`)}
                </Link>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="mb-4 text-[12px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{t('platform')}</h4>
            <div className="flex flex-col gap-2.5">
              {platformLinks.map((link) => (
                <Link key={link.key} href={link.href} className="text-[14px] text-[var(--text-secondary)] transition-colors hover:text-[var(--text)]">
                  {t(`links.${link.key}`)}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] pt-8">
          <p className="text-[12px] text-[var(--text-muted)]">{t('copyright')}</p>
          <div className="flex items-center gap-4 text-[var(--text-muted)]">
            <Link href="https://github.com" target="_blank" aria-label="GitHub" className="transition-colors hover:text-[var(--text)]"><Github className="h-4 w-4" /></Link>
            <Link href="https://twitter.com" target="_blank" aria-label="Twitter" className="transition-colors hover:text-[var(--text)]"><Twitter className="h-4 w-4" /></Link>
            <Link href="https://instagram.com" target="_blank" aria-label="Instagram" className="transition-colors hover:text-[var(--text)]"><Instagram className="h-4 w-4" /></Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
