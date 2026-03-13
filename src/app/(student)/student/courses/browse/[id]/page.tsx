/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import CourseCurriculum from '@/components/courses/CourseCurriculum';
import CourseInstructor from '@/components/courses/CourseInstructor';
import CourseReviews from '@/components/courses/CourseReviews';
import CourseDetailHero from '@/components/courses/CourseDetailHero';
import CourseDetailSidebar from '@/components/courses/CourseDetailSidebar';
import { CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: course } = await supabase
    .from('courses')
    .select('title, subtitle, thumbnail_url')
    .eq('id', id)
    .single();

  if (!course) return { title: 'Not Found | Slate' };

  return {
    title: `${course.title} | Slate`,
    description: course.subtitle,
    openGraph: {
      title: course.title,
      description: course.subtitle,
      images: course.thumbnail_url ? [course.thumbnail_url] : []
    }
  }
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  // 1. Fetch Course
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*, categories(name, name_ta, slug, color)')
    .eq('id', id)
    .eq('status', 'approved')
    .single();

  if (courseError || !course) {
    notFound();
  }

  // Flatten category onto course for easy props
  course.category_name = course.categories?.name;
  course.category_name_ta = course.categories?.name_ta;
  course.category_slug = course.categories?.slug;
  course.category_color = course.categories?.color;

  // 2. Fetch Instructors
  const { data: instructors } = await supabase
    .from('course_instructors')
    .select(`
      is_primary,
      profiles (
        id, full_name, avatar_url, bio, website_url, linkedin_url
      ),
      instructor_profiles (
        headline, expertise_tags, total_students, total_courses, avg_rating, total_completions
      )
    `)
    .eq('course_id', course.id)
    .order('is_primary', { ascending: false });

  // 3. Fetch Curriculum
  const { data: curriculumData } = await supabase
    .from('course_sections')
    .select(`
      id, title, title_ta, sort_order,
      lectures (
        id, title, title_ta, type, duration_mins, is_free_preview, sort_order
      )
    `)
    .eq('course_id', course.id)
    .order('sort_order');

  // Sort lectures manually since we can't reliably inner order with PostgREST always
  const sections = curriculumData?.map(sec => ({
    ...sec,
    lectures: Array.isArray(sec.lectures) ? sec.lectures.sort((a, b) => a.sort_order - b.sort_order) : []
  })) || [];

  // 4. Fetch Reviews
  const { createClient: createAdminClient } = await import('@supabase/supabase-js');
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: topReviews } = await supabaseAdmin
    .from('reviews')
    .select(`
      id, rating, title, body, helpful_count, created_at, is_verified,
      profiles!reviews_reviewer_id_fkey ( id, full_name, avatar_url )
    `)
    .eq('course_id', course.id)
    .eq('target_type', 'course')
    .eq('is_approved', true)
    .order('helpful_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(10);

  const formattedReviews = topReviews?.map(r => {
    const prof = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    return {
      ...r,
      reviewer_id: (prof as any)?.id,
      full_name: (prof as any)?.full_name || 'Anonymous User',
      avatar_url: (prof as any)?.avatar_url
    };
  }) || [];

  // 5. Rating breakdown
  const { data: breakdown } = await supabaseAdmin
    .from('reviews')
    .select('rating')
    .eq('course_id', course.id)
    .eq('target_type', 'course')
    .eq('is_approved', true);

  const breakdownMap = { 5:0, 4:0, 3:0, 2:0, 1:0 };
  if (breakdown) {
    breakdown.forEach(b => {
      if (b.rating >= 1 && b.rating <= 5) breakdownMap[b.rating as keyof typeof breakdownMap]++;
    });
  }
  const ratingBreakdown = Object.entries(breakdownMap).map(([rating, count]) => ({
    rating: Number(rating),
    count
  })).sort((a, b) => b.rating - a.rating);

  const [enrollResp, wishResp] = await Promise.all([
    supabase.from('enrollments').select('id, progress_pct, completed_at').eq('student_id', user.id).eq('course_id', course.id).eq('is_active', true).single(),
    supabase.from('wishlists').select('id').eq('user_id', user.id).eq('course_id', course.id).single()
  ]);

  // Read the user's explicit review using admin privileges just in case their is_approved string flags are false, which hides it in the global fetch.
  const reviewResp = await supabaseAdmin.from('reviews').select(`
    id, rating, title, body, helpful_count, created_at, is_verified,
    profiles!reviews_reviewer_id_fkey ( full_name, avatar_url )
  `).eq('reviewer_id', user.id).eq('course_id', course.id).single();

  const enrollment = enrollResp.data;
  const isWishlisted = !!wishResp.data;
  let userReview = null;
  
  if (reviewResp.data) {
    const prof = Array.isArray(reviewResp.data.profiles) ? reviewResp.data.profiles[0] : reviewResp.data.profiles;
    userReview = {
      ...reviewResp.data,
      full_name: (prof as any)?.full_name || 'You',
      avatar_url: (prof as any)?.avatar_url
    };
  }

  const requirements = course.requirements || [];
  const whatYouLearn = course.what_you_learn || [];

  return (
    <div className="min-h-[100dvh] bg-[#F5F5F7] text-gray-900 flex flex-col font-sans pb-10">
      <main className="flex-1 w-full flex flex-col">
        
        {/* HERO SECTION */}
        <CourseDetailHero 
          course={course}
          instructors={instructors || []}
          isStudentView={true}
        />

        {/* MAIN BODY LAYOUT */}
        <section className="max-w-7xl mx-auto w-full px-6 py-10 relative">
          <div className="flex flex-col lg:flex-row gap-12 relative">
            
            {/* LEFT COLUMN: Main Content */}
            <div className="flex-1 min-w-0 pb-20 lg:pb-0">
              
              {/* What you'll learn */}
              {whatYouLearn.length > 0 && (
                <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 lg:p-8">
                  <h2 className="font-sans font-bold text-[22px] text-gray-900 mb-6">What you'll learn</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {whatYouLearn.map((item: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="w-[18px] h-[18px] text-[#28C840] shrink-0 mt-[2px]" />
                        <span className="text-[14px] text-gray-600 leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Requirements */}
              {requirements.length > 0 && (
                <div className="mt-12">
                  <h2 className="font-sans font-bold text-[22px] text-gray-900 mb-5">Requirements</h2>
                  <ul className="flex flex-col gap-3">
                    {requirements.map((req: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-[6px] h-[6px] rounded-full bg-gray-400 mt-2 shrink-0" />
                        <span className="text-[14px] text-gray-600 leading-relaxed">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Curriculum */}
              <CourseCurriculum 
                sections={sections as any} 
                totalLectures={course.total_lectures || 0}
                totalDurationMins={course.total_duration_mins || 0}
                isStudentView={true}
              />

              {/* Instructor */}
              <CourseInstructor instructors={instructors || []} isStudentView={true} />

              {/* Reviews */}
              <CourseReviews 
                courseId={course.id}
                enrollmentId={enrollment?.id || null}
                avgRating={course.avg_rating || 0}
                totalReviews={course.total_reviews || 0}
                ratingBreakdown={ratingBreakdown}
                initialReviews={formattedReviews}
                existingReview={userReview as any}
                userId={user?.id || null}
                isEnrolled={!!enrollment}
                isStudentView={true}
              />
            </div>

            {/* RIGHT COLUMN: Sticky Sidebar Enroll Card */}
            <div className="hidden lg:block w-[360px] flex-shrink-0">
              <div className="sticky top-[92px]">
                <CourseDetailSidebar 
                  course={course}
                  enrollment={enrollment}
                  initialWishlisted={isWishlisted}
                  userId={user.id}
                  isStudentView={true}
                />
              </div>
            </div>

          </div>
        </section>

        {/* MOBILE FLOATING CTA BAR */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-gray-200 px-4 py-3 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.1)] safe-area-bottom">
          <div className="flex-1">
             {course.is_free ? (
                <div className="font-sans font-bold text-[18px] text-gray-900">Free</div>
             ) : (!course.is_free && course.discounted_price < course.price) ? (
                <div className="flex items-center gap-2">
                  <span className="font-sans font-bold text-[18px] text-gray-900">₹{course.discounted_price}</span>
                  <span className="text-[12px] text-gray-500 line-through">₹{course.price}</span>
                </div>
             ) : (
                <div className="font-sans font-bold text-[18px] text-gray-900">₹{course.price}</div>
             )}
          </div>
          
           <div className="flex items-center gap-3">
             <Link href="#enroll">
               {enrollment ? (
                 <div className="bg-green-50 text-green-600 border border-green-200 px-6 py-2.5 rounded-full font-semibold text-[14px]">
                   Continue
                 </div>
               ) : (
                 <div className="bg-gray-900 text-white px-6 py-2.5 rounded-full font-bold text-[14px]">
                   Enroll Now
                 </div>
               )}
             </Link>
          </div>
        </div>

      </main>
    </div>
  );
}
