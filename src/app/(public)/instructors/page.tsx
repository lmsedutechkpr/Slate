/* eslint-disable @typescript-eslint/no-explicit-any */
import Image from 'next/image';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import PublicNavbar from '@/components/shared/PublicNavbar';
import PublicFooter from '@/components/shared/PublicFooter';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Instructors - Slate',
  description: 'Discover all instructors on Slate LMS.',
};

export default async function PublicInstructorsPage() {
  const admin = createAdminClient();

  const { data: instructorsRaw } = await admin
    .from('instructor_profiles')
    .select(
      `
      user_id,headline,total_students,total_courses,avg_rating,is_verified,expertise_tags,
      profiles!user_id(id,full_name,avatar_url,bio)
    `,
    )
    .order('total_students', { ascending: false })
    .limit(200);

  const instructors = (instructorsRaw || []) as any[];

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      <main className="mx-auto w-full max-w-6xl px-6 pb-12 pt-24 sm:px-8">
        <div className="mb-7">
          <h1 className="text-[32px] font-extrabold text-[#1D1D1F]">All Instructors</h1>
          <p className="mt-1 text-[13px] text-[#6E6E73]">{instructors.length} verified and emerging educators</p>
        </div>

        {instructors.length ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {instructors.map((row) => {
              const profile = row.profiles || null;
              const name = profile?.full_name || 'Instructor';
              const initials = String(name || 'I').charAt(0).toUpperCase();

              return (
                <Link
                  key={row.user_id}
                  href={`/instructor/${row.user_id}`}
                  className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-transform hover:-translate-y-[2px]"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-full bg-[#F5F5F7]">
                      {profile?.avatar_url ? (
                        <Image src={profile.avatar_url} alt={name} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[14px] font-bold text-[#1D1D1F]">{initials}</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-[#1D1D1F]">{name}</p>
                      <p className="truncate text-[12px] text-[#6E6E73]">{row.headline || 'Instructor at Slate'}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-[#6E6E73]">
                    <span className="rounded-full bg-[#F5F5F7] px-2.5 py-1">{Number(row.total_courses || 0)} courses</span>
                    <span className="rounded-full bg-[#F5F5F7] px-2.5 py-1">{Number(row.total_students || 0)} students</span>
                    <span className="rounded-full bg-[#F5F5F7] px-2.5 py-1">{Number(row.avg_rating || 0).toFixed(1)} rating</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-8 text-center text-[13px] text-[#6E6E73] shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
            No instructors found.
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
