/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import InstructorProfilePage from '@/components/public/InstructorProfilePage';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data: profile } = await admin.from('profiles').select('full_name').eq('id', id).maybeSingle();

  return {
    title: profile?.full_name ? `${profile.full_name} - Instructor` : 'Instructor Profile - Slate',
    description: 'Public instructor profile on Slate LMS.',
  };
}

export default async function PublicInstructorByIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const [profileRes, instructorRes, courseLinksRes, reviewsRes] = await Promise.all([
    admin.from('profiles').select('id, full_name, avatar_url, bio').eq('id', id).maybeSingle(),
    admin.from('instructor_profiles').select('headline,total_students,avg_rating,total_courses,is_verified,expertise_tags').eq('user_id', id).maybeSingle(),
    admin
      .from('course_instructors')
      .select(
        `
        course_id,
        courses (
          id, title, slug, thumbnail_url, is_free, discounted_price, price, status
        )
      `,
      )
      .eq('instructor_id', id),
    admin.from('course_reviews').select('id', { count: 'exact', head: true }).eq('instructor_id', id),
  ]);

  if (!profileRes.data) notFound();

  const courses = (courseLinksRes.data || [])
    .map((row: any) => row.courses)
    .filter((c: any) => c && (c.status === 'approved' || c.status === 'published'));

  return (
    <InstructorProfilePage
      profile={profileRes.data}
      instructorProfile={instructorRes.data}
      courses={courses}
      reviewCount={reviewsRes.count || 0}
    />
  );
}
