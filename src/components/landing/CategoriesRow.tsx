import {getTranslations} from 'next-intl/server';
import {createClient} from '@/lib/supabase/server';
import CategoriesRowClient from '@/components/landing/CategoriesRowClient';

type CategoryRow = {
  id: string;
  name: string;
  name_ta: string | null;
  slug: string;
  color: string | null;
  courses: Array<{id: string; status: string}> | null;
};

export default async function CategoriesRow() {
  const t = await getTranslations('landing.categories');

  try {
    const supabase = await createClient();
    const {data, error} = await supabase
      .from('categories')
      .select('id, name, name_ta, slug, color, sort_order, courses!left(id, status)')
      .eq('is_active', true)
      .order('sort_order', {ascending: true});

    if (error) throw error;

    const categories =
      (data as CategoryRow[] | null)
        ?.map((row) => ({
          id: row.id,
          name: row.name,
          name_ta: row.name_ta,
          slug: row.slug,
          color: row.color,
          course_count: (row.courses ?? []).filter((course) => course.status === 'approved').length
        }))
        .filter((category) => category.course_count > 0) ?? [];

    if (!categories.length) return null;

    return (
      <section className="mx-auto max-w-7xl px-4 py-24 md:px-6">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">EXPLORE</p>
        <h2 className="mb-8 text-[30px] font-bold text-[var(--text)]">{t('title')}</h2>
        <CategoriesRowClient categories={categories} />
      </section>
    );
  } catch (error) {
    console.error('CategoriesRow error', error);
    return null;
  }
}
