/* eslint-disable @typescript-eslint/no-explicit-any */
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import PublicNavbar from '@/components/shared/PublicNavbar';
import PublicFooter from '@/components/shared/PublicFooter';

export const dynamic = 'force-dynamic';

export default async function PublicCoursePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: course } = await admin
    .from('courses')
    .select(
      `
      id,title,title_ta,subtitle,description,thumbnail_url,
      is_free,price,discounted_price,avg_rating,total_reviews,total_enrolled,
      total_lectures,total_duration_mins,difficulty,language,status,
      categories(name,slug),
      course_instructors(is_primary,profiles!instructor_id(id,full_name,avatar_url))
    `,
    )
    .eq('id', id)
    .eq('status', 'approved')
    .maybeSingle();

  if (!course) notFound();

  const { data: sectionsRaw } = await admin
    .from('course_sections')
    .select('id,title,title_ta,sort_order,lectures(id,title,title_ta,type,video_duration_secs,read_time_mins,quiz_duration_mins,is_published,sort_order)')
    .eq('course_id', id)
    .order('sort_order', { ascending: true });

  const sections = (sectionsRaw || []).map((s: any) => ({
    ...s,
    lectures: (s.lectures || []).filter((l: any) => l.is_published).sort((a: any, b: any) => a.sort_order - b.sort_order),
  }));

  const instructorRaw =
    (course.course_instructors || []).find((x: any) => x.is_primary)?.profiles ||
    (course.course_instructors || [])[0]?.profiles ||
    null;
  const instructor = Array.isArray(instructorRaw) ? instructorRaw[0] || null : instructorRaw;

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      <main className="mx-auto w-full max-w-6xl px-6 pb-12 pt-24 sm:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
            <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-xl bg-[#F5F5F7]">
              {course.thumbnail_url ? (
                <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover" />
              ) : null}
            </div>

            <h1 className="text-[28px] font-extrabold text-[#1D1D1F]">{course.title}</h1>
            {course.subtitle ? <p className="mt-2 text-[14px] text-[#6E6E73]">{course.subtitle}</p> : null}

            <div className="mt-4 flex flex-wrap gap-2 text-[12px] text-[#6E6E73]">
              <span className="rounded-full bg-[#F5F5F7] px-3 py-1">{course.total_lectures || 0} lectures</span>
              <span className="rounded-full bg-[#F5F5F7] px-3 py-1">{course.total_duration_mins || 0} mins</span>
              <span className="rounded-full bg-[#F5F5F7] px-3 py-1">{course.difficulty || 'all levels'}</span>
              <span className="rounded-full bg-[#F5F5F7] px-3 py-1">{(course.avg_rating || 0).toFixed(1)} rating</span>
            </div>

            {course.description ? (
              <div className="mt-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-[#FAFAFA] p-4 text-[13px] leading-relaxed text-[#4E535C]">
                {course.description}
              </div>
            ) : null}

            <div className="mt-6 space-y-3">
              <h2 className="text-[18px] font-bold text-[#1D1D1F]">Curriculum Preview</h2>
              {sections.length ? (
                sections.map((section: any) => (
                  <div key={section.id} className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-white">
                    <div className="border-b border-[rgba(0,0,0,0.06)] px-4 py-2.5 text-[13px] font-semibold text-[#1D1D1F]">{section.title}</div>
                    <div className="px-4 py-2.5">
                      {section.lectures.length ? (
                        section.lectures.map((lecture: any) => (
                          <div key={lecture.id} className="flex items-center justify-between border-b border-[rgba(0,0,0,0.04)] py-2 text-[12px] last:border-b-0">
                            <span className="text-[#1D1D1F]">{lecture.title}</span>
                            <span className="text-[#6E6E73]">{lecture.type}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[12px] text-[#6E6E73]">No published lectures yet.</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[13px] text-[#6E6E73]">No sections available yet.</p>
              )}
            </div>
          </div>

          <aside className="h-fit rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
            <p className="text-[12px] uppercase tracking-wide text-[#6E6E73]">Instructor</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-full bg-[#F5F5F7]">
                {instructor?.avatar_url ? <Image src={instructor.avatar_url} alt={instructor.full_name || 'Instructor'} fill className="object-cover" /> : null}
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#1D1D1F]">{instructor?.full_name || 'Instructor'}</p>
                {instructor?.id ? (
                  <Link href={`/instructor/${instructor.id}`} className="text-[12px] text-[#0071E3]">
                    View public profile
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="mt-4 border-t border-[rgba(0,0,0,0.06)] pt-4">
              {course.is_free ? (
                <p className="text-[24px] font-extrabold text-[#28C840]">Free</p>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-[24px] font-extrabold text-[#1D1D1F]">₹{course.discounted_price || course.price || 0}</p>
                  {course.discounted_price && course.price && course.discounted_price < course.price ? (
                    <span className="text-[12px] text-[#8E8E93] line-through">₹{course.price}</span>
                  ) : null}
                </div>
              )}

              <Link href="/login" className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#1D1D1F] px-4 py-2 text-[13px] font-semibold text-white">
                Sign in to enroll
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
