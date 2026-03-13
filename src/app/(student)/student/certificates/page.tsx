import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CertificatesPageClient from '@/components/student/certificates/CertificatesPageClient';

export const dynamic = 'force-dynamic';

export default async function CertificatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Earned certificates
  const { data: certificates } = await supabase
    .from('certificates')
    .select(`
      id, enrollment_id, certificate_number, issued_at, pdf_url, is_revoked,
      courses:course_id (
        id, title, title_ta, slug,
        thumbnail_url, difficulty,
        total_duration_mins,
        course_instructors (
          profiles ( full_name, avatar_url )
        )
      )
    `)
    .eq('student_id', user.id)
    .eq('is_revoked', false)
    .order('issued_at', { ascending: false });

  // In-progress enrollments for certificate-enabled courses
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id, progress_pct,
      courses:course_id (
        id, title, title_ta, slug,
        thumbnail_url, difficulty,
        total_lectures, certificate_enabled,
        course_instructors (
          profiles ( full_name )
        )
      )
    `)
    .eq('student_id', user.id)
    .eq('is_active', true)
    .is('completed_at', null);

  // Student profile for certificate display
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, display_name')
    .eq('id', user.id)
    .single();

  // Filter: only certificate-enabled courses not yet complete
  const inProgress = (enrollments || []).filter(
    (e: any) => e.courses?.certificate_enabled && (e.progress_pct ?? 0) < 100
  );

  return (
    <CertificatesPageClient
      certificates={(certificates || []) as any[]}
      inProgressEnrollments={inProgress as any[]}
      profile={profile as any}
      userId={user.id}
    />
  );
}
