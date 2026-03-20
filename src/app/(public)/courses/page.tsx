/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from 'next/link';
import { Search } from 'lucide-react';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import CourseCatalogCard from '@/components/courses/CourseCatalogCard';
import PublicNavbar from '@/components/shared/PublicNavbar';
import PublicFooter from '@/components/shared/PublicFooter';
import StudentTopbar from '@/components/student/StudentTopbar';
import StudentSidebar from '@/components/student/StudentSidebar';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Browse Courses - Slate',
  description: 'Public catalog of approved Slate courses.',
};

export default async function PublicCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; difficulty?: string; language?: string; price?: string }>;
}) {
  const params = await searchParams;
  const q = String(params.q || '').trim();

  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isStudent = false;
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    isStudent = profile?.role === 'student';
  }

  const { data: categories } = await admin
    .from('categories')
    .select('id,name,slug')
    .eq('is_active', true)
    .order('sort_order');

  let query = admin
    .from('courses')
    .select(
      `
      id, title, title_ta, slug, thumbnail_url,
      subtitle, is_free, price, discounted_price,
      avg_rating, total_reviews, total_enrolled,
      total_lectures, total_duration_mins,
      difficulty, language, certificate_enabled,
      published_at, category_id,
      categories ( id, name, slug ),
      course_instructors (
        is_primary,
        profiles!instructor_id ( id, full_name, avatar_url )
      )
    `,
    )
    .eq('status', 'approved')
    .order('total_enrolled', { ascending: false })
    .limit(60);

  if (q) query = query.ilike('title', `%${q}%`);
  if (params.category) {
    const cat = (categories || []).find((c: any) => c.slug === params.category);
    if (cat) query = query.eq('category_id', cat.id);
  }
  if (params.difficulty) query = query.eq('difficulty', params.difficulty);
  if (params.language) query = query.eq('language', params.language);
  if (params.price === 'free') query = query.eq('is_free', true);
  if (params.price === 'paid') query = query.eq('is_free', false);

  const { data: coursesRaw } = await query;
  const courses = (coursesRaw || []) as any[];

  const courseIds = courses.map((c) => c.id);
  const userEnrollments = new Set<string>();
  const userWishlists = new Set<string>();

  if (user && courseIds.length) {
    const [{ data: enrolls }, { data: wishes }] = await Promise.all([
      admin.from('enrollments').select('course_id').eq('student_id', user.id).eq('is_active', true).in('course_id', courseIds),
      admin.from('wishlists').select('course_id').eq('user_id', user.id).in('course_id', courseIds),
    ]);

    (enrolls || []).forEach((row: any) => userEnrollments.add(row.course_id));
    (wishes || []).forEach((row: any) => userWishlists.add(row.course_id));
  }

  const grid = (
    <div className="mx-auto w-full max-w-6xl px-8 py-8">
      <div className="mb-6">
        <h1 className="text-[32px] font-extrabold text-[#1D1D1F]">Browse Courses</h1>
        <p className="mt-1 text-[13px] text-[#6E6E73]">{courses.length} approved courses</p>
      </div>

      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white px-5 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
        <Search className="h-[18px] w-[18px] text-[#AEAEB2]" />
        <form action="/courses" method="GET" className="w-full">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search courses"
            className="w-full border-none bg-transparent text-[14px] text-[#1D1D1F] outline-none"
          />
        </form>
      </div>

      {courses.length ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCatalogCard
              key={course.id}
              course={course}
              initialIsEnrolled={userEnrollments.has(course.id)}
              initialIsWishlisted={userWishlists.has(course.id)}
              userId={user?.id || null}
              isStudentView={isStudent}
              forceLightTheme={!isStudent}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-10 text-center shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
          <p className="text-[16px] font-semibold text-[#1D1D1F]">No courses found</p>
          <p className="mt-2 text-[13px] text-[#6E6E73]">Try a different search term or category.</p>
          <Link href="/courses" className="mt-4 inline-block rounded-full border border-[rgba(0,0,0,0.08)] px-4 py-2 text-[12px] font-semibold text-[#1D1D1F]">
            Reset
          </Link>
        </div>
      )}
    </div>
  );

  if (isStudent) {
    return (
      <div className="min-h-screen bg-[#F5F5F7]">
        <StudentTopbar />
        <div className="flex pt-[52px]">
          <StudentSidebar />
          <main className="min-w-0 flex-1 px-6 py-6 lg:ml-0">{grid}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      <div className="pt-14">{grid}</div>
      <PublicFooter />
    </div>
  );
}
