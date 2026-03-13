'use client';

import {useTranslations} from 'next-intl';
import {useUIStore} from '@/store/useUIStore';
import {Link} from '@/i18n/navigation';

type Category = {
  id: string;
  name: string;
  name_ta: string | null;
  slug: string;
  color: string | null;
  course_count: number;
};

export default function CategoriesRowClient({categories}: {categories: Category[]}) {
  const t = useTranslations('landing.categories');
  const language = useUIStore((state) => state.language);

  return (
    <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-2">
      {categories.map((category) => {
        const color = category.color ?? '#8E8E93';
        const name = language === 'ta' && category.name_ta ? category.name_ta : category.name;
        return (
          <Link
            key={category.id}
            href={`/courses?category=${category.slug}`}
            className="min-w-[180px] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-all duration-200 hover:scale-[1.02] hover:border-[rgba(255,255,255,0.16)] hover:shadow-xl"
            style={{borderLeftWidth: '3px', borderLeftColor: color}}
          >
            {/* Traffic light dots */}
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--traffic-red)]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--traffic-yellow)]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--traffic-green)]" />
            </div>
            <p className="mt-4 text-[15px] font-semibold text-[var(--text)]">{name}</p>
            <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
              {t('courseCount', {count: category.course_count.toLocaleString()})}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
