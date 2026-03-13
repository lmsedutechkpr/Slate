import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import CourseList from '@/components/student/courses/CourseList';

export const metadata = {
  title: 'My Courses - Slate',
};

export default async function MyCoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Fetch Enrollments with deeply nested course data
  const { data: enrollmentsData, error } = await supabase
    .from('enrollments')
    .select(`
      id,
      progress_pct,
      enrolled_at,
      last_accessed_at,
      completed_at,
      is_active,
      courses:course_id (
        id, 
        title, 
        title_ta, 
        slug,
        thumbnail_url, 
        total_lectures,
        total_duration_mins, 
        avg_rating,
        total_reviews, 
        certificate_enabled,
        difficulty, 
        is_free, 
        price,
        categories:category_id (
          id, name, name_ta, color
        ),
        course_instructors (
          is_primary,
          profiles:instructor_id (
            full_name, avatar_url
          )
        )
      )
    `)
    .eq('student_id', user.id)
    .eq('is_active', true)
    // Supabase JS doesn't support complex ordering with nulls in relationships easily in a single query string,
    // so we handle the specific order by last_accessed_at later or let PSQL do it if there's no null bug.
    .order('last_accessed_at', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('Error fetching enrollments:', error);
  }

  // To prevent multiple single fetches per array item, we'll fetch aggregates in parallel if there are enrollments.
  const enrollments = enrollmentsData || [];
  
  // Transform the data to match the expected format for the client component
  // We need completed_lectures, downloaded_lectures, has_certificate
  
  // Fetch all relevant aggregate data for this user in bulk
  const [
    { data: lectureProgressData },
    { data: offlineDownloadsData },
    { data: certificatesData }
  ] = await Promise.all([
    supabase.from('lecture_progress').select('enrollment_id').eq('is_completed', true).in('enrollment_id', enrollments.map(e => e.id)),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.from('offline_downloads').select('lecture_id, lectures!inner(course_id)').eq('user_id', user.id).eq('is_active', true).in('lectures.course_id', enrollments.map((e: any) => (e.courses as any)?.id)),
    supabase.from('certificates').select('enrollment_id').in('enrollment_id', enrollments.map(e => e.id))
  ]);

  const progressCounts = (lectureProgressData || []).reduce((acc: Record<string, number>, curr: { enrollment_id: string }) => {
    acc[curr.enrollment_id] = (acc[curr.enrollment_id] || 0) + 1;
    return acc;
  }, {});

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const downloadCounts = (offlineDownloadsData || []).reduce((acc: Record<string, number>, curr: any) => {
    // Type casting because we know 'lectures' is joined
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const courseId = (curr.lectures as any).course_id;
    acc[courseId] = (acc[courseId] || 0) + 1;
    return acc;
  }, {});

  const certificateMap = new Set((certificatesData || []).map(c => c.enrollment_id));

  const formattedEnrollments = enrollments.map(e => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const course = e.courses as any;
    
    // Find primary instructor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const primaryInstructor = course.course_instructors?.find((ci: any) => ci.is_primary)?.profiles || course.course_instructors?.[0]?.profiles || {};

    return {
      enrollment_id: e.id,
      progress_pct: e.progress_pct,
      enrolled_at: e.enrolled_at,
      last_accessed_at: e.last_accessed_at,
      completed_at: e.completed_at,
      is_active: e.is_active,
      course_id: course.id,
      title: course.title,
      id: course.id,
      thumbnail_url: course.thumbnail_url,
      total_lectures: course.total_lectures,
      total_duration_mins: course.total_duration_mins,
      avg_rating: course.avg_rating,
      total_reviews: course.total_reviews,
      certificate_enabled: course.certificate_enabled,
      difficulty: course.difficulty,
      is_free: course.is_free,
      price: course.price,
      category_id: course.categories?.id,
      category_name: course.categories?.name,
      category_name_ta: course.categories?.name_ta,
      category_color: course.categories?.color,
      instructor_name: primaryInstructor.full_name,
      instructor_avatar: primaryInstructor.avatar_url,
      completed_lectures: progressCounts[e.id] || 0,
      downloaded_lectures: downloadCounts[course.id] || 0,
      has_certificate: certificateMap.has(e.id) ? 1 : 0
    };
  });

  return (
    <div className="w-full">
      <div className="w-full">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[13px] text-gray-500 font-medium tracking-tight">
          <Link href="/student/dashboard" className="hover:text-gray-900 transition-colors">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900">My Courses</span>
        </div>

        {/* Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mt-4 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Courses</h1>
            <p className="text-[14px] text-gray-500 mt-1">
              {formattedEnrollments.length} {formattedEnrollments.length === 1 ? 'course' : 'courses'} enrolled
            </p>
          </div>
          <Link 
            href="/student/courses/browse"
            className="inline-flex items-center justify-center border border-gray-200 text-gray-900 font-medium text-[13px] px-5 py-2 rounded-full hover:bg-gray-50 transition-colors max-w-fit shadow-sm"
          >
            Browse more courses
          </Link>
        </div>

      </div>

      <CourseList initialEnrollments={formattedEnrollments} userId={user.id} />
    </div>
  );
}
