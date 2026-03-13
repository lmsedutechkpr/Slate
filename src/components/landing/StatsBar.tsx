import {getTranslations} from 'next-intl/server';
import {createClient} from '@/lib/supabase/server';
import StatsCounter from '@/components/landing/StatsCounter';

export default async function StatsBar() {
  const t = await getTranslations('landing.stats');

  try {
    const supabase = await createClient();

    const [students, courses, products, certificates] = await Promise.all([
      supabase.from('profiles').select('*', {count: 'exact', head: true}).eq('role', 'student').eq('status', 'active'),
      supabase.from('courses').select('*', {count: 'exact', head: true}).eq('status', 'approved'),
      supabase.from('products').select('*', {count: 'exact', head: true}).eq('status', 'active'),
      supabase.from('certificates').select('*', {count: 'exact', head: true})
    ]);

    const stats = [
      {label: t('students'), value: students.count ?? 0},
      {label: t('courses'), value: courses.count ?? 0},
      {label: t('products'), value: products.count ?? 0},
      {label: t('certificates'), value: certificates.count ?? 0}
    ];

    return (
      <section className="border-y border-[var(--border)] bg-[var(--surface)] py-12">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 px-4 md:grid-cols-4 md:px-6">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={index < 3 ? 'md:border-r md:border-[var(--border)] md:pr-6' : ''}
            >
              <StatsCounter value={stat.value} />
              <p className="mt-1 text-[12px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    );
  } catch (error) {
    console.error('StatsBar error', error);
    return null;
  }
}
