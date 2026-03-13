/* eslint-disable @typescript-eslint/no-explicit-any */
import {createClient} from '@/lib/supabase/server';
import GreetingHeader from '@/components/student/dashboard/GreetingHeader';
import StreakWidget from '@/components/student/dashboard/StreakWidget';
import StatsRow from '@/components/student/dashboard/StatsRow';
import ContinueLearning from '@/components/student/dashboard/ContinueLearning';
import UpcomingLive from '@/components/student/dashboard/UpcomingLive';
import DailyGoal from '@/components/student/dashboard/DailyGoal';
import RecommendedCourses from '@/components/student/dashboard/RecommendedCourses';
import RecommendedProducts from '@/components/student/dashboard/RecommendedProducts';
import BadgesRow from '@/components/student/dashboard/BadgesRow';

export const dynamic = 'force-dynamic';

export default async function StudentDashboardPage() {
  const supabase = await createClient();

  // Validate session
  const {
    data: {user}
  } = await supabase.auth.getUser();

  if (!user) return null; // Let the layout middleware handle redirection

  // Execute queries in parallel
  const [
    {data: profile},
    {data: streak},
    {count: enrolledCount},
    {count: completedCount},
    {data: hoursData},
    {data: continueEnrollments},
    {data: upcomingLive},
    {data: recommendedCourses},
    {data: recommendedProducts},
    {data: preferences},
    {data: badgesEarned},
    {data: allBadges}
  ] = await Promise.all([
    supabase.from('profiles').select('id, full_name, avatar_url, preferred_language').eq('id', user.id).single(),

    supabase.from('user_streaks').select('current_streak, longest_streak, last_activity_date').eq('user_id', user.id).maybeSingle(),

    // Enrolled metric
    supabase.from('enrollments').select('*', {count: 'exact', head: true}).eq('student_id', user.id).eq('is_active', true),
    
    // Completed metric
    supabase.from('enrollments').select('*', {count: 'exact', head: true}).eq('student_id', user.id).not('completed_at', 'is', null),
    
    // Total Hours
    supabase.from('lecture_progress').select('progress_secs').eq('student_id', user.id),

    // Continue Learning
    supabase
      .from('enrollments')
      .select(`
        id, progress_pct, last_accessed_at,
        courses (
          id, title, title_ta, slug, thumbnail_url, total_lectures,
          course_instructors ( profiles ( full_name ) )
        )
      `)
      .eq('student_id', user.id)
      .eq('is_active', true)
      .is('completed_at', null)
      .order('last_accessed_at', {ascending: false})
      .limit(3),

    // Upcoming Live Classes
    supabase
      .from('live_classes')
      .select(`
        id, title, scheduled_at, status, meeting_url, actual_attendees,
        courses!inner ( title, thumbnail_url, enrollments!inner ( student_id ) ),
        profiles!inner ( full_name, avatar_url )
      `)
      .eq('courses.enrollments.student_id', user.id)
      .in('status', ['scheduled', 'live'])
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', {ascending: true})
      .limit(3),

    // Recommended Courses
    supabase
      .from('courses')
      .select(`
        id, title, title_ta, slug, thumbnail_url, price, is_free, avg_rating, difficulty,
        categories ( name, color ),
        course_instructors!inner ( profiles!inner ( full_name ) )
      `)
      .eq('status', 'approved')
      .order('avg_rating', {ascending: false})
      // In a real query we exclude enrolled, but this is a rough approximation due to postgREST limits:
      .limit(4),

    // Recommended Products
    supabase.from('v_user_recommendations').select('*').eq('user_id', user.id).limit(4),

    // User Preferences (for daily goal)
    supabase.from('user_preferences').select('language, daily_goal_minutes').eq('user_id', user.id).maybeSingle(),

    // Earned Badges
    supabase
      .from('user_badges')
      .select(`earned_at, badges ( id, name, name_ta, icon_url, criteria )`)
      .eq('user_id', user.id)
      .order('earned_at', {ascending: false})
      .limit(6),

    // All Badges
    supabase.from('badges').select('*').order('id', {ascending: true})
  ]);

  // Aggregate Hours
  const totalHours = Math.floor(
    (hoursData?.reduce((sum, lp) => sum + (lp.progress_secs || 0), 0) ?? 0) / 3600
  );

  // Real daily goal query
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();

  const {data: todayProgress} = await supabase
    .from('lecture_progress')
    .select('progress_secs')
    .eq('student_id', user.id)
    .gte('updated_at', todayIso);
  
  const todayWatchedMinutes = Math.floor(
    (todayProgress?.reduce((sum, lp) => sum + (lp.progress_secs || 0), 0) ?? 0) / 60
  ) || 0;

  // Fetch full details for the recommended products
  const productIds = (recommendedProducts || []).map((rp: any) => rp.product_id).filter(Boolean);
  const { data: fullRecommendedProducts } = productIds.length > 0 
    ? await supabase.from('products').select('id, name, slug, price, images, avg_rating, stock_qty').in('id', productIds)
    : { data: [] };

  // Fetch product wishlists for this user
  const { data: wishlists } = await supabase
    .from('wishlists')
    .select('product_id')
    .eq('user_id', user.id)
    .not('product_id', 'is', null);

  const wishlistedProductIds = (wishlists || []).map(w => w.product_id);

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Greeting */}
      <GreetingHeader 
        fullName={profile?.full_name || ''} 
      />

      {/* 2. Streak + Stats */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <StreakWidget 
            currentStreak={streak?.current_streak || 0}
            longestStreak={streak?.longest_streak || 0}
            lastActivityDate={streak?.last_activity_date || null}
          />
        </div>
        <div className="lg:col-span-3">
          <StatsRow 
            enrolled={enrolledCount || 0}
            completed={completedCount || 0}
            totalHours={totalHours}
            streakDays={streak?.current_streak || 0}
          />
        </div>
      </div>

      {/* 3. Continue Learning */}
      <ContinueLearning 
        initialEnrollments={continueEnrollments as any} 
        userId={user.id} 
      />

      {/* 4. Daily Goal + Upcoming Live */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <DailyGoal 
            dailyGoalMinutes={preferences?.daily_goal_minutes || 30}
            todayWatchedMinutes={todayWatchedMinutes}
            userId={user.id}
          />
        </div>
        <div className="lg:col-span-2">
          {upcomingLive && upcomingLive.length > 0 && (
            <UpcomingLive initialLiveClasses={upcomingLive as any} />
          )}
        </div>
      </div>

      {/* 5. Recommended Courses */}
      <RecommendedCourses courses={recommendedCourses as any} />

      {/* 6. Recommended Products */}
      <RecommendedProducts 
        products={fullRecommendedProducts as any} 
        initialWishlistedIds={wishlistedProductIds as string[]}
        userId={user.id}
      />

      {/* 7. Achievements */}
      <BadgesRow earnedBadges={badgesEarned as any} allBadges={allBadges || []} />
    </div>
  );
}
