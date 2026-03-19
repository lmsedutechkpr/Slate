import { redirect, notFound } from 'next/navigation';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import UserDetailClient from '@/components/admin/users/UserDetailClient';

interface UserDetailPageProps {
  params: Promise<{ userId: string }>;
}

export default async function AdminUserDetailPage({ params }: UserDetailPageProps) {
  const { userId } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  if (!currentUser) redirect('/login');

  // Verify admin role
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', currentUser.id)
    .single();

  if (!adminProfile || adminProfile.role !== 'admin') {
    redirect('/student/dashboard');
  }

  // Fetch all user data in parallel
  const [
    profileRes,
    instructorProfileRes,
    sellerProfileRes,
    enrollmentsRes,
    coursesRes,
    productsRes,
    certificatesRes,
    ordersRes,
    notificationsRes,
  ] = await Promise.all([
    // 1. User profile
    supabase
      .from('profiles')
      .select(
        `
        id, full_name, display_name, email,
        role, status, avatar_url,
        preferred_language, registration_source,
        created_at, updated_at, bio, phone
      `
      )
      .eq('id', userId)
      .single(),

    // 2. Instructor profile (if applicable)
    supabase
      .from('instructor_profiles')
      .select(
        `
        user_id, headline,
        total_students, total_courses,
        avg_rating, total_earnings,
        commission_rate
      `
      )
      .eq('user_id', userId)
      .single(),

    // 3. Seller profile (if applicable)
    supabase
      .from('seller_profiles')
      .select(
        `
        user_id, store_name, store_slug,
        total_sales, total_revenue,
        avg_rating, commission_rate
      `
      )
      .eq('user_id', userId)
      .single(),

    // 4. Enrollments count (for students)
    supabase.from('enrollments').select('id').eq('student_id', userId).eq('is_active', true),

    // 5. Courses (for instructors)
    supabase
      .from('courses')
      .select(
        `
        id, title, thumbnail_url, status, total_enrolled,
        course_instructors!inner(instructor_id)
      `
      )
      .eq('course_instructors.instructor_id', userId)
      .limit(10),

    // 6. Products (for sellers)
    supabase
      .from('products')
      .select('id, name, images, status, total_sold')
      .eq('seller_id', userId)
      .limit(10),

    // 7. Certificates (for students)
    supabase
      .from('certificates')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', userId),

    // 8. Orders (for students)
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', userId),

    // 9. Recent notifications
    supabase
      .from('notifications')
      .select('id, type, title, message, is_read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const profileDataWithFallback = profileRes.data
    ? profileRes.data
    : (
        await supabase
          .from('profiles')
          .select(
            `
            id, full_name, display_name,
            role, status, avatar_url,
            preferred_language, registration_source,
            created_at, updated_at, bio, phone
          `
          )
          .eq('id', userId)
          .single()
      ).data;

  // Check if user exists
  if (!profileDataWithFallback) {
    notFound();
  }

  // Fetch auth metadata using admin client.
  const { data: authMeta } = await admin.auth.admin.getUserById(userId);
  const providers = (authMeta?.user?.app_metadata?.providers || []) as string[];
  const authProvider =
    providers[0] ||
    (typeof authMeta?.user?.app_metadata?.provider === 'string'
      ? authMeta.user.app_metadata.provider
      : 'email');

  const profile = {
    ...profileDataWithFallback,
    email: (profileDataWithFallback as any).email || authMeta?.user?.email || null,
  };

  // Process instructor data
  const instructorData = instructorProfileRes.data
    ? {
        user_id: instructorProfileRes.data.user_id,
        headline: instructorProfileRes.data.headline || null,
        total_students: instructorProfileRes.data.total_students || 0,
        total_courses: instructorProfileRes.data.total_courses || 0,
        avg_rating: instructorProfileRes.data.avg_rating || 0,
        total_earnings: instructorProfileRes.data.total_earnings || 0,
        commission_rate: instructorProfileRes.data.commission_rate || 70,
      }
    : null;

  // Process seller data
  const sellerData = sellerProfileRes.data
    ? {
        user_id: sellerProfileRes.data.user_id,
        store_name: sellerProfileRes.data.store_name || null,
        store_slug: sellerProfileRes.data.store_slug || null,
        total_sales: sellerProfileRes.data.total_sales || 0,
        total_revenue: sellerProfileRes.data.total_revenue || 0,
        avg_rating: sellerProfileRes.data.avg_rating || 0,
        commission_rate: sellerProfileRes.data.commission_rate || 85,
      }
    : null;

  // Process courses for instructor
  const courses = (coursesRes.data || []).map((c: any) => ({
    id: c.id,
    title: c.title,
    thumbnail_url: c.thumbnail_url,
    status: c.status,
    total_enrolled: c.total_enrolled || 0,
  }));

  // Process products for seller
  const products = (productsRes.data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    image_url: p.images?.[0] || null,
    status: p.status,
    total_sold: p.total_sold || 0,
  }));

  // Fetch enrollments with course details for students
  let enrollments: any[] = [];
  if (profile.role === 'student') {
    const { data: enrollmentData } = await supabase
      .from('enrollments')
      .select(
        `
        id, progress_percentage,
        courses:course_id (
          id, title, thumbnail_url
        )
      `
      )
      .eq('student_id', userId)
      .eq('is_active', true)
      .limit(10);

    enrollments = (enrollmentData || []).map((e: any) => ({
      id: e.id,
      course: {
        id: e.courses?.id || '',
        title: e.courses?.title || 'Unknown Course',
        thumbnail_url: e.courses?.thumbnail_url || null,
      },
      progress_percentage: e.progress_percentage || 0,
    }));
  }

  // Transform user profile
  const user = {
    id: profile.id,
    full_name: profile.full_name || 'Unnamed User',
    display_name: profile.display_name,
    email: profile.email,
    role: profile.role,
    status: profile.status,
    avatar_url: profile.avatar_url,
    preferred_language: profile.preferred_language,
    registration_source: profile.registration_source,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
    bio: profile.bio,
    phone: profile.phone,
  };

  const recentNotifications = (notificationsRes.data || []).map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    is_read: n.is_read,
    created_at: n.created_at,
  }));

  return (
    <UserDetailClient
      user={user}
      instructorData={instructorData}
      sellerData={sellerData}
      enrollmentCount={enrollmentsRes.data?.length || 0}
      courses={courses}
      products={products}
      enrollments={enrollments}
      certificatesCount={certificatesRes.count || 0}
      ordersCount={ordersRes.count || 0}
      emailVerified={Boolean(authMeta?.user?.email_confirmed_at)}
      authProvider={authProvider}
      lastSignInAt={authMeta?.user?.last_sign_in_at || null}
      recentNotifications={recentNotifications}
    />
  );
}
