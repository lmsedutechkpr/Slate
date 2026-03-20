/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { BookOpen, Star, Users } from 'lucide-react';
import PublicNavbar from '@/components/shared/PublicNavbar';
import PublicFooter from '@/components/shared/PublicFooter';

type InstructorCourse = {
  id: string;
  title: string;
  slug: string | null;
  thumbnail_url: string | null;
  is_free: boolean | null;
  discounted_price: number | null;
  price: number | null;
};

type InstructorProfilePageProps = {
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
  };
  instructorProfile: {
    headline?: string | null;
    total_students?: number | null;
    avg_rating?: number | null;
    total_courses?: number | null;
    is_verified?: boolean | null;
    expertise_tags?: string[] | null;
  } | null;
  courses: InstructorCourse[];
  reviewCount: number;
};

function trafficLights() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
      <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
      <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
    </div>
  );
}

export default function InstructorProfilePage({
  profile,
  instructorProfile,
  courses,
  reviewCount,
}: InstructorProfilePageProps) {
  const avgRating = Number(instructorProfile?.avg_rating || 0);
  const students = Number(instructorProfile?.total_students || 0);
  const displayName = profile.full_name || 'Instructor';

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <PublicNavbar />

      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-24">
        <section className="overflow-hidden rounded-[24px] border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
          <div className="flex h-[44px] items-center justify-between border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
            {trafficLights()}
            <p className="text-[12px] font-semibold text-[#6E6E73]">Instructor Profile</p>
          </div>

          <div className="grid gap-6 p-7 md:grid-cols-[140px_1fr]">
            <div className="h-[120px] w-[120px] overflow-hidden rounded-full border border-[rgba(0,0,0,0.08)] bg-[#F5F5F7]">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[34px] font-extrabold text-[#AEAEB2]">
                  {displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[30px] font-extrabold tracking-[-0.02em] text-[#1D1D1F]">{displayName}</h1>
                {instructorProfile?.is_verified ? (
                  <span className="rounded-full border border-[rgba(40,200,64,0.24)] bg-[#EDFAF0] px-3 py-1 text-[11px] font-semibold text-[#1F9A34]">
                    Verified
                  </span>
                ) : null}
              </div>
              {instructorProfile?.headline ? (
                <p className="mt-2 text-[15px] text-[#6E6E73]">{instructorProfile.headline}</p>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-4 text-[13px] text-[#6E6E73]">
                <p className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {students.toLocaleString('en-IN')} students
                </p>
                <p className="inline-flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  {courses.length} courses
                </p>
                <p className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-[#FEBC2E] text-[#FEBC2E]" />
                  {avgRating > 0 ? avgRating.toFixed(1) : 'New'} ({reviewCount})
                </p>
              </div>

              {profile.bio ? <p className="mt-4 max-w-3xl text-[14px] leading-relaxed text-[#6E6E73]">{profile.bio}</p> : null}

              {!!instructorProfile?.expertise_tags?.length && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {instructorProfile.expertise_tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[rgba(0,0,0,0.08)] bg-[#F5F5F7] px-3 py-1 text-[12px] font-semibold text-[#6E6E73]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[22px] font-bold text-[#1D1D1F]">Courses by {displayName.split(' ')[0]}</h2>
            <Link href="/courses" className="text-[13px] font-semibold text-[#0071E3]">
              Explore all courses
            </Link>
          </div>

          {courses.length ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={course.slug ? `/courses/${course.slug}` : `/courses/${course.id}`}
                  className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_6px_20px_rgba(0,0,0,0.08)] transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="aspect-video bg-[#F5F5F7]">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt={course.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[12px] font-semibold text-[#AEAEB2]">
                        No thumbnail
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="line-clamp-2 text-[14px] font-bold text-[#1D1D1F]">{course.title}</p>
                    <p className="mt-2 text-[13px] font-semibold text-[#1D1D1F]">
                      {course.is_free ? 'Free' : `Rs ${course.discounted_price ?? course.price ?? 0}`}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-10 text-center text-[14px] text-[#6E6E73]">
              No published courses yet.
            </div>
          )}
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
