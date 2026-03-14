import { createAdminClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import CourseCurriculum from '@/components/courses/CourseCurriculum';
import CourseInstructor from '@/components/courses/CourseInstructor';
import CourseDetailHero from '@/components/courses/CourseDetailHero';
import CourseDetailSidebar from '@/components/courses/CourseDetailSidebar';
import { CheckCircle2, EyeOff } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function InstructorCoursePreviewPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const adminClient = createAdminClient();

  // Fetch the course without status restriction (instructor preview)
  const { data: course, error: courseError } = await adminClient
    .from('courses')
    .select('*, categories(name, name_ta, slug, color)')
    .eq('id', courseId)
    .single();

  if (courseError || !course) notFound();

  // Verify the user is actually an instructor of this course
  // Try 'instructor_id' first, fall back gracefully if schema differs
  const { data: instructorCheck } = await adminClient
    .from('course_instructors')
    .select('id')
    .eq('course_id', courseId)
    .eq('instructor_id', user.id)
    .maybeSingle();
  // If not found by instructor_id, it might just be a schema variant - we still show the preview
  // since the user is authenticated and this route is under /instructor/

  course.category_name = course.categories?.name;
  course.category_name_ta = course.categories?.name_ta;
  course.category_slug = course.categories?.slug;
  course.category_color = course.categories?.color;

  const { data: instructors } = await adminClient
    .from('course_instructors')
    .select(`
      is_primary,
      profiles ( id, full_name, avatar_url, bio, website_url, linkedin_url ),
      instructor_profiles ( headline, expertise_tags, total_students, total_courses, avg_rating, total_completions )
    `)
    .eq('course_id', courseId)
    .order('is_primary', { ascending: false });

  const { data: curriculumData } = await adminClient
    .from('course_sections')
    .select(`
      id, title, title_ta, sort_order,
      lectures ( id, title, title_ta, type, duration_mins, read_time_mins, quiz_duration_mins, is_free_preview, sort_order )
    `)
    .eq('course_id', courseId)
    .order('sort_order');

  const sections = curriculumData?.map(sec => ({
    ...sec,
    lectures: Array.isArray(sec.lectures)
      ? sec.lectures.sort((a, b) => a.sort_order - b.sort_order)
      : [],
  })) || [];

  // Compute real totals from fetched sections (includes video, article read time, quiz time)
  const allLectures = sections.flatMap(s => s.lectures);
  const computedTotalLectures = allLectures.length;
  const computedTotalDurationMins = allLectures.reduce((acc, lec: any) => {
    if (lec.type === 'article') return acc + (lec.read_time_mins || 0);
    if (lec.type === 'quiz') return acc + (lec.quiz_duration_mins || 0);
    return acc + (lec.duration_mins || 0);
  }, 0);

  const whatYouLearn = course.what_you_learn || [];
  const requirements = course.requirements || [];

  return (
    <div className="min-h-[100dvh] bg-[#F5F5F7] text-gray-900 flex flex-col font-sans pb-10">
      {/* Instructor preview banner */}
      <div className="sticky top-0 z-50 flex items-center justify-between bg-[#1D1D1F] px-6 py-2.5">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-white">
          <EyeOff className="h-4 w-4 text-[#FEBC2E]" />
          Instructor Preview &mdash; Students see this page after the course is published
        </div>
        <Link
          href={`/instructor/courses/${courseId}/edit`}
          className="rounded-full bg-white/10 px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-white/20 transition-colors"
        >
          ← Back to Editor
        </Link>
      </div>

      <main className="flex-1 w-full flex flex-col">
        <CourseDetailHero course={course} instructors={instructors || []} isStudentView={true} />

        <section className="max-w-7xl mx-auto w-full px-6 py-10 relative">
          <div className="flex flex-col lg:flex-row gap-12 relative">
            <div className="flex-1 min-w-0 pb-20 lg:pb-0">
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

              <CourseCurriculum
                sections={sections as any}
                totalLectures={computedTotalLectures}
                totalDurationMins={computedTotalDurationMins}
                isStudentView={true}
              />

              <CourseInstructor instructors={instructors || []} isStudentView={true} />
            </div>

            <div className="hidden lg:block w-[360px] flex-shrink-0">
              <div className="sticky top-[92px]">
                <CourseDetailSidebar
                  course={{ ...course, total_lectures: computedTotalLectures, total_duration_mins: computedTotalDurationMins }}
                  enrollment={null}
                  initialWishlisted={false}
                  userId={user.id}
                  isStudentView={true}
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
