import {GraduationCap, ShoppingBag} from 'lucide-react';
import {getTranslations} from 'next-intl/server';
import {createClient} from '@/lib/supabase/server';
import {Link} from '@/i18n/navigation';

export default async function SplitCTA() {
  const t = await getTranslations('landing.splitCta');

  try {
    const supabase = await createClient();

    const [instructors, sellers] = await Promise.all([
      supabase.from('instructor_profiles').select('*', {count: 'exact', head: true}),
      supabase.from('seller_profiles').select('*', {count: 'exact', head: true})
    ]);

    const instructorCount = instructors.count ?? 0;
    const sellerCount = sellers.count ?? 0;

    const instructorPoints = [t('instructorPoint1'), t('instructorPoint2'), t('instructorPoint3')];
    const sellerPoints = [t('sellerPoint1'), t('sellerPoint2'), t('sellerPoint3')];

    return (
      <section className="mx-auto max-w-7xl px-4 py-24 md:px-6">
        <h2 className="mb-8 text-center text-[30px] font-bold text-[var(--text)]">Join the platform</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
          {/* Instructor card */}
          <article className="flex flex-col justify-between rounded-3xl border border-[var(--border)] bg-[var(--surface-raised)] p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md sm:p-10">
            <div className="flex flex-col flex-grow">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--traffic-red)]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--traffic-yellow)]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--traffic-green)]" />
              </div>

              <GraduationCap className="mt-8 h-8 w-8 text-[var(--text)]" />
              <h3 className="mt-4 text-[22px] font-bold tracking-tight text-[var(--text)]">{t('instructorTitle')}</h3>
              <p className="mt-1 text-[13px] font-medium text-[var(--text-secondary)]">{instructorCount}+ instructors earning on Slate</p>
              <p className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]">
                {t('instructorBody', {count: instructorCount})}
              </p>

              <ul className="mt-8 mb-8 flex flex-col gap-3">
              {instructorPoints.map((point) => (
                <li key={point} className="flex items-center gap-2 text-[13px] text-[var(--text)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--traffic-green)]" />
                  {point}
                </li>
              ))}
              </ul>
            </div>

            <Link
              href="/signup?role=instructor"
              className="mt-auto flex h-[50px] w-full items-center justify-center rounded-full bg-[var(--text)] px-6 text-[15px] font-semibold text-[var(--bg)] shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              {t('applyInstructor')} →
            </Link>
          </article>

          {/* Seller card */}
          <article className="flex flex-col justify-between rounded-3xl border border-[var(--border)] bg-[var(--surface-raised)] p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md sm:p-10">
            <div className="flex flex-col flex-grow">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--traffic-red)]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--traffic-yellow)]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--traffic-green)]" />
              </div>

              <ShoppingBag className="mt-8 h-8 w-8 text-[var(--text)]" />
              <h3 className="mt-4 text-[22px] font-bold tracking-tight text-[var(--text)]">{t('sellerTitle')}</h3>
              <p className="mt-1 text-[13px] font-medium text-[var(--text-secondary)]">{sellerCount}+ sellers already active</p>
              <p className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]">
              {t('sellerBody', {count: sellerCount})}
            </p>

            <ul className="mt-6 flex flex-col gap-2">
              {sellerPoints.map((point) => (
                <li key={point} className="flex items-center gap-2 text-[13px] text-[var(--text)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--traffic-green)]" />
                  {point}
                </li>
              ))}
              </ul>
            </div>

            <Link
              href="/signup?role=seller"
              className="mt-auto flex h-[50px] w-full items-center justify-center rounded-full bg-[var(--text)] px-6 text-[15px] font-semibold text-[var(--bg)] shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              {t('applySeller')} →
            </Link>
          </article>
        </div>
      </section>
    );
  } catch (error) {
    console.error('SplitCTA error', error);
    return null;
  }
}
