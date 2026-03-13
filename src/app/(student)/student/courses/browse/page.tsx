/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server';
import { Search } from 'lucide-react';
import Link from 'next/link';
import CourseFiltersPanel from '@/components/courses/CourseFiltersPanel';
import CourseCatalogCard from '@/components/courses/CourseCatalogCard';
import CourseSortSelect from '@/components/courses/CourseSortSelect';

export const dynamic = 'force-dynamic';

export default async function CoursesCatalogPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Await searchParams in Next.js 15
  const params = await searchParams;

  const categoryParam = params.category as string | undefined;
  const difficultyParam = params.difficulty as string | undefined;
  const languageParam = params.language as string | undefined;
  const priceParam = params.price as string | undefined;
  const minPriceParam = params.min_price ? Number(params.min_price) : undefined;
  const maxPriceParam = params.max_price ? Number(params.max_price) : undefined;
  const ratingParam = params.rating ? Number(params.rating) : undefined;
  const queryParam = params.q as string | undefined;
  const sortParam = params.sort as string | undefined;
  const pageParam = parseInt((params.page as string) || '1');

  const ITEMS_PER_PAGE = 12;

  // 1. Fetch Categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, name_ta, slug, color')
    .eq('is_active', true)
    .order('sort_order');

  // 2. Fetch User specific states
  const userEnrollments = new Set<string>();
  const userWishlists = new Set<string>();

  if (user) {
    const [{ data: enrolls }, { data: wishes }] = await Promise.all([
      supabase.from('enrollments').select('course_id').eq('student_id', user.id).eq('is_active', true),
      supabase.from('wishlists').select('course_id').eq('user_id', user.id)
    ]);
    if (enrolls) enrolls.forEach(e => userEnrollments.add(e.course_id));
    if (wishes) wishes.forEach(w => userWishlists.add(w.course_id));
  }

  // 3. Build main courses query
  let query = supabase
    .from('courses')
    .select(`
      id, title, title_ta, slug, thumbnail_url,
      subtitle, is_free, price, discounted_price,
      avg_rating, total_reviews, total_enrolled,
      total_lectures, total_duration_mins,
      difficulty, language, certificate_enabled,
      published_at,
      categories ( id, name, name_ta, color, slug ),
      course_instructors!inner (
        is_primary,
        profiles!inner (
          id, full_name, avatar_url
        )
      )
    `, { count: 'exact' })
    .eq('status', 'approved')
    .eq('course_instructors.is_primary', true);

  // Apply Filters
  if (categoryParam) {
    // We need to filter by category slug. We join categories above, but PostgREST filtering on joined columns can sometimes be tricky.
    // However, since we have the categories array, we can lookup the ID.
    const catObj = categories?.find(c => c.slug === categoryParam);
    if (catObj) {
      query = query.eq('category_id', catObj.id);
    }
  }

  if (difficultyParam) {
    const diffs = difficultyParam.split(',').map(d => d.toLowerCase());
    query = query.in('difficulty', diffs);
  }

  if (languageParam) {
    const langs = languageParam.split(',');
    query = query.in('language', langs);
  }

  if (priceParam === 'free') {
    query = query.eq('is_free', true);
  } else if (priceParam === 'paid') {
    query = query.eq('is_free', false);
    if (minPriceParam) query = query.gte('price', minPriceParam);
    if (maxPriceParam) query = query.lte('price', maxPriceParam);
  }

  if (ratingParam) {
    query = query.gte('avg_rating', ratingParam);
  }

  if (queryParam) {
    query = query.ilike('title', `%${queryParam}%`);
  }

  // Apply Sorting
  switch (sortParam) {
    case 'rating': query = query.order('avg_rating', { ascending: false }); break;
    case 'newest': query = query.order('published_at', { ascending: false }); break;
    case 'price_low': query = query.order('price', { ascending: true }); break;
    case 'price_high': query = query.order('price', { ascending: false }); break;
    case 'popular':
    default:
      query = query.order('total_enrolled', { ascending: false }); break;
  }

  // Pagination
  const from = (pageParam - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;
  query = query.range(from, to);

  const { data: rawCourses, count, error } = await query;
  
  if (error) {
    console.error("Error fetching courses:", error);
  }

  // Next.js requires us to be careful with JSON types, but let's assume it works here like in the other pages
  const courses = rawCourses as any[];

  // 4. Platform Stats
  const { count: totalPlatformCourses } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved');

  const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE);

  return (
    <div>
      {/* Simple Page Header (Student Version) */}
      <div>
        <div className="flex items-center gap-2 text-[13px] font-medium text-gray-500 mb-4">
          <Link href="/student/dashboard" className="hover:text-gray-900 transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-gray-900">Browse Courses</span>
        </div>

        <h1 className="font-bold text-[28px] text-gray-900">
          Browse Courses
        </h1>
        <p className="text-[14px] text-gray-500 mt-1">
          {totalPlatformCourses || 0} courses available
        </p>

        <div className="mt-4 max-w-md flex items-center gap-3 bg-white border border-gray-200 shadow-sm rounded-2xl px-5 py-3 focus-within:border-gray-300 transition-colors">
          <Search className="h-[18px] w-[18px] text-gray-400 shrink-0" />
          <form action="/student/courses/browse" method="GET" className="w-full h-full">
            <input 
              type="text" 
              name="q"
              defaultValue={queryParam || ''}
              placeholder="Search courses..."
              className="w-full h-full bg-transparent text-[15px] text-gray-900 outline-none placeholder:text-gray-400"
            />
          </form>
        </div>

        {/* Quick Filter Chips */}
        <div className="mt-4 flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">

            <Link 
              href="/student/courses/browse"
              className={`flex-shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium border transition-all duration-150 ${
                !categoryParam
                  ? 'bg-gray-900 text-white border-gray-900 font-semibold'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900 shadow-sm'
              }`}
            >
              All
            </Link>
            {categories?.slice(0, 8).map(cat => (
              <Link
                key={cat.id}
                href={`/student/courses/browse?category=${cat.slug}`}
                className={`flex-shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium border transition-all duration-150 ${
                  categoryParam === cat.slug
                    ? 'bg-gray-900 text-white border-gray-900 font-semibold'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900 shadow-sm'
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>

        {/* MAIN LISTINGS */}
        <section className="w-full py-8 flex flex-col lg:flex-row gap-8">
          
          <div className="w-full lg:w-[280px] shrink-0">
            <div className="sticky top-[24px]">
              <CourseFiltersPanel 
                categories={categories || []}
                isStudentView={true}
                currentFilters={{
                  category: categoryParam,
                  difficulty: difficultyParam,
                  language: languageParam,
                  price: priceParam as any,
                  min_price: minPriceParam,
                  max_price: maxPriceParam,
                  rating: ratingParam
                }}
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            
            {/* Sort Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div className="text-[14px]">
                <span className="font-semibold text-gray-900">Showing {count || 0}</span>
                <span className="text-gray-500"> results</span>
                {queryParam && (
                  <span className="text-gray-500"> for <span className="text-gray-900">"{queryParam}"</span></span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <CourseSortSelect defaultSort={sortParam || 'popular'} isStudentView={true} />
              </div>
            </div>

            {/* Grid */}
            {courses && courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {courses.map(course => (
                  <CourseCatalogCard
                    key={course.id}
                    course={course}
                    initialIsEnrolled={userEnrollments.has(course.id)}
                    initialIsWishlisted={userWishlists.has(course.id)}
                    userId={user?.id || null}
                    isStudentView={true}
                  />
                ))}
              </div>
            ) : (
              <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-10 flex flex-col items-center justify-center relative mt-4">
                <div className="absolute top-4 left-4 flex gap-1.5 items-center">
                  <div className="h-[8px] w-[8px] rounded-full bg-[#FF5F57]" />
                  <div className="h-[8px] w-[8px] rounded-full bg-[#FEBC2E]" />
                  <div className="h-[8px] w-[8px] rounded-full bg-[#28C840]" />
                </div>
                
                <Search className="h-10 w-10 text-gray-400 mt-4" />
                <h3 className="font-sans font-semibold text-[17px] text-gray-900 mt-4">
                  No courses found
                </h3>
                {queryParam && (
                  <p className="text-[14px] text-gray-500 text-center mt-2 max-w-sm">
                     No results for "{queryParam}". Try adjusting your filters or search terms.
                  </p>
                )}
                <Link 
                  href="/student/courses/browse"
                  className="mt-6 border border-gray-200 text-[13px] font-medium text-gray-700 px-5 py-2.5 rounded-full hover:bg-gray-50 transition-colors"
                >
                  Clear all filters
                </Link>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                {/* Simplified generic pagination rows for SSR */}
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pNum = i + 1;
                  const isCurrent = pNum === pageParam;
                  return (
                    <Link
                      key={pNum}
                      href={`/student/courses/browse?${new URLSearchParams({ ...params as any, page: pNum.toString() }).toString()}`}
                      className={`h-9 w-9 flex items-center justify-center rounded-xl text-[13px] font-medium transition-colors ${
                        isCurrent 
                          ? 'bg-gray-900 text-white' 
                          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-transparent hover:border-gray-200'
                      }`}
                    >
                      {pNum}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
