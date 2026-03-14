import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StudentsPageClient } from '@/components/instructor/students/StudentsPageClient';

export const dynamic = 'force-dynamic';

export default async function InstructorStudentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Step 1: Course IDs for this instructor
  const { data: instructorCourses } = await supabase
    .from('course_instructors')
    .select('course_id, courses(id, title, thumbnail_url, status)')
    .eq('instructor_id', user.id);

  const courseIds = (instructorCourses ?? []).map((r: any) => r.course_id).filter(Boolean);
  const courses = (instructorCourses ?? []).map((r: any) => r.courses).filter(Boolean);

  let rawEnrollments: any[] = [];

  if (courseIds.length > 0) {
    // Step 2: All enrollments for those courses
    const { data } = await supabase
      .from('enrollments')
      .select(`
        id, progress_pct, enrolled_at,
        completed_at, last_accessed_at,
        is_active, course_id,
        courses ( id, title, thumbnail_url ),
        profiles!enrollments_student_id_fkey (
          id, full_name, display_name,
          avatar_url, preferred_language,
          created_at
        )
      `)
      .in('course_id', courseIds)
      .eq('is_active', true)
      .order('enrolled_at', { ascending: false });

    rawEnrollments = data ?? [];
  }

  // Step 3: Aggregate per student
  const studentMap = new Map<string, any>();

  for (const enr of rawEnrollments) {
    const profile = enr.profiles;
    if (!profile) continue;
    const sid = profile.id;

    if (!studentMap.has(sid)) {
      studentMap.set(sid, {
        id: sid,
        full_name: profile.full_name ?? profile.display_name ?? 'Unknown',
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        preferred_language: profile.preferred_language ?? 'en',
        member_since: profile.created_at,
        enrollments: [],
        totalCourses: 0,
        completedCourses: 0,
        avgProgress: 0,
        lastActive: null,
        firstEnrolled: enr.enrolled_at,
      });
    }

    const student = studentMap.get(sid)!;
    student.enrollments.push({
      id: enr.id,
      course_id: enr.course_id,
      course: enr.courses,
      progress_pct: enr.progress_pct ?? 0,
      completed_at: enr.completed_at,
      last_accessed_at: enr.last_accessed_at,
      enrolled_at: enr.enrolled_at,
    });

    if (enr.completed_at) student.completedCourses++;
    if (!student.lastActive || (enr.last_accessed_at && enr.last_accessed_at > student.lastActive)) {
      student.lastActive = enr.last_accessed_at;
    }
    if (enr.enrolled_at < student.firstEnrolled) student.firstEnrolled = enr.enrolled_at;
  }

  // Finalise aggregates
  const students = Array.from(studentMap.values()).map((s) => {
    s.totalCourses = s.enrollments.length;
    s.avgProgress = s.totalCourses > 0
      ? Math.round(s.enrollments.reduce((a: number, e: any) => a + (e.progress_pct ?? 0), 0) / s.totalCourses)
      : 0;
    return s;
  });

  // Step 4: Overall stats
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const totalStudents = students.length;
  const avgCompletion = totalStudents > 0
    ? Math.round(students.reduce((a, s) => a + s.avgProgress, 0) / totalStudents)
    : 0;
  const completionRate = totalStudents > 0
    ? Math.round((students.filter((s) => s.completedCourses > 0).length / totalStudents) * 100)
    : 0;
  const newThisMonth = rawEnrollments.filter((e) => new Date(e.enrolled_at) >= thirtyDaysAgo).length;

  const stats = { totalStudents, avgCompletion, completionRate, newThisMonth };

  return (
    <StudentsPageClient
      students={students}
      stats={stats}
      courses={courses}
      courseIds={courseIds}
      userId={user.id}
      instructorName={user.user_metadata?.full_name ?? user.email ?? 'Instructor'}
    />
  );
}
