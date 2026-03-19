import { redirect } from 'next/navigation';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import UsersPageClient from '@/components/admin/users/UsersPageClient';

interface AdminUsersPageProps {
  searchParams: Promise<{ role?: string; status?: string }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const params = await searchParams;
  const isPendingAccountStatus = (status: string | null | undefined) =>
    status === 'pending' || status === 'pending_approval';
  const roleOptions = new Set(['all', 'student', 'instructor', 'seller', 'admin']);
  const statusOptions = new Set(['all', 'active', 'pending', 'suspended', 'rejected']);
  const initialRoleFilter = roleOptions.has(params.role || '')
    ? (params.role as 'all' | 'student' | 'instructor' | 'seller' | 'admin')
    : 'all';
  const initialStatusFilter = statusOptions.has(params.status || '')
    ? (params.status as 'all' | 'active' | 'pending' | 'suspended' | 'rejected')
    : 'all';
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/student/dashboard');
  }

  // Date calculations
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // 1. All profiles with schema-fallback support.
  const profileSelectFull = `
    id, full_name, display_name,
    role, status, avatar_url,
    preferred_language, registration_source,
    created_at, updated_at, bio, phone, email
  `;
  const profileSelectFallback = `
    id, full_name, display_name,
    role, status, avatar_url,
    preferred_language, registration_source,
    created_at, updated_at, bio, phone
  `;

  const { data: fullProfiles, error: fullProfilesError } = await supabase
    .from('profiles')
    .select(profileSelectFull)
    .order('created_at', { ascending: false });

  const { data: fallbackProfiles, error: fallbackProfilesError } = fullProfilesError
    ? await supabase
        .from('profiles')
        .select(profileSelectFallback)
        .order('created_at', { ascending: false })
    : { data: null, error: null };

  if (fullProfilesError && fallbackProfilesError) {
    console.error('Admin users page: profile fetch failed', {
      fullProfilesError,
      fallbackProfilesError,
    });
  }

  let allProfiles: Array<Record<string, any>> = (fullProfiles || fallbackProfiles || []).map((p) => ({
    ...p,
    email: (p as any).email || null,
  }));

  // Auth sync: fill missing emails and recover users that exist in auth but not in profiles.
  const { data: authUsersData, error: authUsersError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (!authUsersError && authUsersData?.users?.length) {
    const authUsers = authUsersData.users;
    const emailMap = new Map(authUsers.map((u) => [u.id, u.email || null]));

    allProfiles = allProfiles.map((p) => ({
      ...p,
      email: p.email || emailMap.get(p.id) || null,
    }));

    const existingIds = new Set(allProfiles.map((p) => p.id));
    const missingAuthUsers = authUsers.filter((u) => !existingIds.has(u.id));

    if (missingAuthUsers.length > 0) {
      const recoveredRows = missingAuthUsers.map((u) => {
        const role = (u.user_metadata?.role as string) || 'student';
        const status = role === 'instructor' || role === 'seller' ? 'pending_approval' : 'active';
        return {
          id: u.id,
          full_name: (u.user_metadata?.full_name as string) || (u.email || 'Unnamed User').split('@')[0],
          role,
          status,
          preferred_language: 'en',
          registration_source: u.app_metadata?.provider === 'google' ? 'google' : 'self',
        };
      });

      const { error: recoverError } = await admin.from('profiles').upsert(recoveredRows, {
        onConflict: 'id',
      });

      if (recoverError) {
        console.error('Admin users page: failed to recover missing profile rows', recoverError);
      } else {
        allProfiles = [...recoveredRows, ...allProfiles];
      }
    }
  }

  // Remaining data queries
  const [instructorProfilesRes, sellerProfilesRes, enrollmentsRes] = await Promise.all([
    supabase.from('instructor_profiles').select(`
      user_id, headline,
      total_students, total_courses,
      avg_rating, total_earnings,
      commission_rate
    `),
    supabase.from('seller_profiles').select(`
      user_id, store_name, store_slug,
      total_sales, total_revenue,
      avg_rating, commission_rate
    `),
    supabase.from('enrollments').select('student_id').eq('is_active', true),
  ]);

  // Create instructor map
  const instructorMap: Record<
    string,
    {
      user_id: string;
      headline: string | null;
      total_students: number;
      total_courses: number;
      avg_rating: number;
      total_earnings: number;
      commission_rate: number;
    }
  > = {};
  (instructorProfilesRes.data || []).forEach((ip) => {
    instructorMap[ip.user_id] = {
      user_id: ip.user_id,
      headline: ip.headline || null,
      total_students: ip.total_students || 0,
      total_courses: ip.total_courses || 0,
      avg_rating: ip.avg_rating || 0,
      total_earnings: ip.total_earnings || 0,
      commission_rate: ip.commission_rate || 70,
    };
  });

  // Create seller map
  const sellerMap: Record<
    string,
    {
      user_id: string;
      store_name: string | null;
      store_slug: string | null;
      total_sales: number;
      total_revenue: number;
      avg_rating: number;
      commission_rate: number;
    }
  > = {};
  (sellerProfilesRes.data || []).forEach((sp) => {
    sellerMap[sp.user_id] = {
      user_id: sp.user_id,
      store_name: sp.store_name || null,
      store_slug: sp.store_slug || null,
      total_sales: sp.total_sales || 0,
      total_revenue: sp.total_revenue || 0,
      avg_rating: sp.avg_rating || 0,
      commission_rate: sp.commission_rate || 85,
    };
  });

  // Create enrollment count map
  const enrollmentMap: Record<string, number> = {};
  (enrollmentsRes.data || []).forEach((e) => {
    if (e.student_id) {
      enrollmentMap[e.student_id] = (enrollmentMap[e.student_id] || 0) + 1;
    }
  });

  // Compute stats
  const totalUsers = allProfiles.length;
  const activeUsers = allProfiles.filter((p) => p.status === 'active').length;
  const pendingUsers = allProfiles.filter((p) => isPendingAccountStatus(p.status)).length;
  const suspendedUsers = allProfiles.filter((p) => p.status === 'suspended').length;
  const totalStudents = allProfiles.filter((p) => p.role === 'student').length;
  const totalInstructors = allProfiles.filter((p) => p.role === 'instructor').length;
  const totalSellers = allProfiles.filter((p) => p.role === 'seller').length;
  const newThisMonth = allProfiles.filter(
    (p) => new Date(p.created_at) >= new Date(thirtyDaysAgo)
  ).length;

  const stats = {
    totalUsers,
    activeUsers,
    pendingUsers,
    suspendedUsers,
    totalStudents,
    totalInstructors,
    totalSellers,
    newThisMonth,
  };

  // Transform profiles to match expected type
  const users = allProfiles.map((p) => ({
    id: p.id,
    full_name: p.full_name || 'Unnamed User',
    display_name: p.display_name,
    email: p.email,
    role: p.role,
    status: p.status,
    avatar_url: p.avatar_url,
    preferred_language: p.preferred_language,
    registration_source: p.registration_source,
    created_at: p.created_at,
    updated_at: p.updated_at,
    bio: p.bio,
    phone: p.phone,
  }));

  return (
    <UsersPageClient
      users={users}
      stats={stats}
      instructorMap={instructorMap}
      sellerMap={sellerMap}
      enrollmentMap={enrollmentMap}
      adminId={user.id}
      initialRoleFilter={initialRoleFilter}
      initialStatusFilter={initialStatusFilter}
    />
  );
}
