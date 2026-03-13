/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import CourseFiltersPanel from '@/components/courses/CourseFiltersPanel';
import CourseCatalogCard from '@/components/courses/CourseCatalogCard';
import CourseSortSelect from '@/components/courses/CourseSortSelect';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

export const dynamic = 'force-dynamic';

export default async function CoursesCatalogPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'student') {
      redirect('/student/courses/browse')
    }
    if (profile?.role === 'instructor') {
      redirect('/instructor/courses/browse')
    }
    if (profile?.role === 'seller') {
      redirect('/seller/browse')
    }
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
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 w-full flex flex-col pt-[72px]">
        {/* HERO BAR */}
        <section className="w-full bg-[#111111] border-b border-[rgba(255,255,255,0.07)] py-10 px-6">
          <div className="max-w-7xl mx-auto">
            
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[13px] font-medium text-[#48484A]">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <span className="text-[#8E8E93]">Courses</span>
            </div>

            <h1 className="font-sans font-bold text-[28px] text-white mt-2">
              All Courses
            </h1>
            <p className="text-[14px] text-[#8E8E93] mt-1">
              {totalPlatformCourses || 0} courses available
            </p>

            {/* Main Search Bar */}
            <div className="mt-6 max-w-xl flex items-center gap-3 bg-[#1C1C1E] border border-[rgba(255,255,255,0.1)] rounded-2xl px-5 py-3 focus-within:border-[rgba(255,255,255,0.25)] transition-colors">
              <Search className="h-[18px] w-[18px] text-[#48484A] shrink-0" />
              <form action="/courses" method="GET" className="w-full h-full">
                <input 
                  type="text" 
                  name="q"
                  defaultValue={queryParam || ''}
                  placeholder="Search courses..."
                  className="w-full h-full bg-transparent text-[15px] text-white outline-none placeholder:text-[#48484A]"
                />
              </form>
            </div>

            {/* Quick Filter Chips */}
            <div className="mt-6 flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              <Link 
                href="/courses"
                className={`flex-shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium border transition-all duration-150 ${
                  !categoryParam
                    ? 'bg-white text-[#0A0A0A] border-white font-semibold'
                    : 'border-[rgba(255,255,255,0.08)] text-[#8E8E93] hover:border-[rgba(255,255,255,0.15)] hover:text-white'
                }`}
              >
                All
              </Link>
              {categories?.slice(0, 8).map(cat => (
                <Link
                  key={cat.id}
                  href={`/courses?category=${cat.slug}`}
                  className={`flex-shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium border transition-all duration-150 ${
                    categoryParam === cat.slug
                      ? 'bg-white text-[#0A0A0A] border-white font-semibold'
                      : 'border-[rgba(255,255,255,0.08)] text-[#8E8E93] hover:border-[rgba(255,255,255,0.15)] hover:text-white'
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>

          </div>
        </section>

        {/* MAIN LISTINGS */}
        <section className="max-w-7xl mx-auto w-full px-6 py-8 flex flex-col lg:flex-row gap-8">
          
          <CourseFiltersPanel 
            categories={categories || []}
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

          <div className="flex-1 flex flex-col">
            
            {/* Sort Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div className="text-[14px]">
                <span className="font-semibold text-white">Showing {count || 0}</span>
                <span className="text-[#8E8E93]"> results</span>
                {queryParam && (
                  <span className="text-[#8E8E93]"> for <span className="text-white">"{queryParam}"</span></span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <CourseSortSelect defaultSort={sortParam || 'popular'} />
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
                    isStudentView={false}
                  />
                ))}
              </div>
            ) : (
              <div className="w-full bg-[#111111] rounded-2xl border border-[rgba(255,255,255,0.08)] p-10 flex flex-col items-center justify-center relative mt-4">
                <div className="absolute top-4 left-4 flex gap-1.5 items-center">
                  <div className="h-[8px] w-[8px] rounded-full bg-[#FF5F57]" />
                  <div className="h-[8px] w-[8px] rounded-full bg-[#FEBC2E]" />
                  <div className="h-[8px] w-[8px] rounded-full bg-[#28C840]" />
                </div>
                
                <Search className="h-10 w-10 text-[#48484A] mt-4" />
                <h3 className="font-sans font-semibold text-[17px] text-white mt-4">
                  No courses found
                </h3>
                {queryParam && (
                  <p className="text-[14px] text-[#8E8E93] text-center mt-2 max-w-sm">
                     No results for "{queryParam}". Try adjusting your filters or search terms.
                  </p>
                )}
                <Link 
                  href="/courses"
                  className="mt-6 border border-[rgba(255,255,255,0.12)] text-[13px] font-medium text-white px-5 py-2.5 rounded-full hover:bg-[rgba(255,255,255,0.05)] transition-colors"
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
                      href={`/courses?${new URLSearchParams({ ...params as any, page: pNum.toString() }).toString()}`}
                      className={`h-9 w-9 flex items-center justify-center rounded-xl text-[13px] font-medium transition-colors ${
                        isCurrent 
                          ? 'bg-white text-[#0A0A0A]' 
                          : 'text-[#8E8E93] hover:bg-[rgba(255,255,255,0.06)] hover:text-white'
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

      </main>

      <Footer />
    </div>
  );
}
