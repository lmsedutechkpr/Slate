import Image from 'next/image';
import {Star} from 'lucide-react';
import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {createClient} from '@/lib/supabase/server';
import {formatMinutes} from '@/lib/utils';

type CourseRow = {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  is_free: boolean;
  price: number | null;
  discounted_price: number | null;
  avg_rating: number | null;
  total_reviews: number | null;
  total_enrolled: number | null;
  total_duration_mins: number | null;
  difficulty: string | null;
  categories: Array<{name: string; color: string | null}> | null;
  course_instructors: Array<{
    profiles: Array<{full_name: string | null; avatar_url: string | null}> | null;
  }>;
};

export default async function FeaturedCourses() {
  const t = await getTranslations('landing.featuredCourses');

  try {
    const supabase = await createClient();
    const {data, error} = await supabase
      .from('courses')
      .select(
        'id, title, title_ta, slug, thumbnail_url, is_free, price, discounted_price, avg_rating, total_reviews, total_enrolled, total_duration_mins, difficulty, categories(name, color), course_instructors!inner(is_primary, profiles!inner(full_name, avatar_url))'
      )
      .eq('status', 'approved')
      .eq('course_instructors.is_primary', true)
      .order('total_enrolled', {ascending: false})
      .limit(6);

    if (error) throw error;
    if (!data?.length) return null;

    const courses = data as unknown as CourseRow[];

    return (
      <section className="mx-auto max-w-7xl px-4 py-24 md:px-6">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">COURSES</p>
        <h2 className="text-[30px] font-bold text-[var(--text)]">{t('title')}</h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => {
            const instructor = course.course_instructors?.[0]?.profiles?.[0] ?? null;
            const category = course.categories?.[0] ?? null;
            const color = category?.color ?? '#8E8E93';

            return (
              <article
                key={course.id}
                className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] transition-all duration-[250ms] ease-out hover:-translate-y-1 hover:border-[var(--border-hover)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden">
                  {course.thumbnail_url ? (
                    <Image
                      src={course.thumbnail_url}
                      alt={course.title}
                      fill
                      className="object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[var(--surface-raised)] text-[32px] font-bold text-[var(--text-muted)]">
                      {(category?.name ?? 'C').slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  {/* Traffic light dots overlay */}
                  <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[rgba(0,0,0,0.55)] px-2 py-1 backdrop-blur-sm">
                    <span className="h-[7px] w-[7px] rounded-full bg-[var(--traffic-red)]" />
                    <span className="h-[7px] w-[7px] rounded-full bg-[var(--traffic-yellow)]" />
                    <span className="h-[7px] w-[7px] rounded-full bg-[var(--traffic-green)]" />
                  </div>
                  {/* Category badge top-right */}
                  <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[rgba(0,0,0,0.6)] px-2.5 py-1 backdrop-blur-sm">
                    <span className="h-[3px] w-[3px] rounded-full" style={{backgroundColor: color}} />
                    <span className="text-[11px] font-medium text-[var(--text)]">{category?.name ?? t('uncategorized')}</span>
                  </div>
                </div>

                <div className="p-4 pt-3">
                  <h3 className="line-clamp-2 text-[15px] font-semibold text-[var(--text)]">{course.title}</h3>

                  <div className="mb-3 mt-2 flex items-center gap-2 text-[12px] text-[var(--text-secondary)]">
                    {instructor?.avatar_url ? (
                      <Image
                        src={instructor.avatar_url}
                        alt={instructor.full_name ?? 'Instructor'}
                        width={20}
                        height={20}
                        loading="lazy"
                        className="h-5 w-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--surface-raised)] text-[10px]">
                        {(instructor?.full_name ?? 'I').slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <span>{instructor?.full_name ?? t('instructor')}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {Array.from({length: 5}).map((_, i) => (
                      <Star
                        key={i}
                        className="h-3 w-3"
                        fill={i < Math.floor(course.avg_rating ?? 0) ? '#FEBC2E' : 'none'}
                        color="#FEBC2E"
                      />
                    ))}
                    <span className="ml-1 text-xs font-semibold text-[var(--traffic-yellow)]">{(course.avg_rating ?? 0).toFixed(1)}</span>
                    <span className="text-xs text-[var(--text-muted)]">({course.total_reviews ?? 0})</span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)]">
                    <span>{t('studentsCount', {count: course.total_enrolled ?? 0})}</span>
                    <span>·</span>
                    <span>{formatMinutes(course.total_duration_mins ?? 0)}</span>
                    <span>·</span>
                    <span className="rounded bg-[rgba(0,0,0,0.05)] px-1.5 py-0.5 uppercase tracking-wide text-[10px] text-[var(--text-muted)]">
                      {course.difficulty ?? t('allLevels')}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-[rgba(255,255,255,0.05)] pt-3">
                    <div>
                      {course.is_free ? (
                        <span className="rounded-full bg-[rgba(40,200,64,0.1)] px-2.5 py-0.5 text-xs font-semibold text-[var(--traffic-green)]">{t('free')}</span>
                      ) : course.discounted_price ? (
                        <p className="text-[15px] font-bold text-[var(--text)]">
                          {'\u20B9'}{Number(course.discounted_price).toLocaleString()}
                          <span className="ml-2 text-sm text-[var(--text-muted)] line-through">
                            {'\u20B9'}{Number(course.price ?? 0).toLocaleString()}
                          </span>
                        </p>
                      ) : (
                        <p className="text-[15px] font-bold text-[var(--text)]">{'\u20B9'}{Number(course.price ?? 0).toLocaleString()}</p>
                      )}
                    </div>
                    <Link href={`/courses/${course.id}`} className="text-sm font-medium text-[var(--text)] hover:text-[var(--text-secondary)]">
                      {t('viewCourse')} →
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    );
  } catch (error) {
    console.error('FeaturedCourses error', error);
    return null;
  }
}
