import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopbar from '@/components/admin/AdminTopbar';
import SuspensionGuard from '@/components/auth/SuspensionGuard';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, avatar_url')
    .eq('id', user.id)
    .single();

  // Admin role check - redirect other roles to their dashboard
  if (!profile || profile.role !== 'admin') {
    const role = profile?.role || 'student';
    redirect(`/${role}/dashboard`);
  }

  // Fetch pending counts in parallel for admin sidebar/topbar
  const [pendingUsersRes, pendingCoursesRes, pendingProductsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending_approval')
      .in('role', ['instructor', 'seller']),
    supabase
      .from('courses')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ]);

  const pendingCounts = {
    users: pendingUsersRes.count || 0,
    courses: pendingCoursesRes.count || 0,
    products: pendingProductsRes.count || 0,
  };

  let maintenanceMode = false;
  let maintenanceMessage: string | null = null;
  try {
    const { data: settingsRow } = await supabase
      .from('site_settings')
      .select('maintenance_mode, maintenance_message')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    maintenanceMode = Boolean(settingsRow?.maintenance_mode);
    maintenanceMessage = settingsRow?.maintenance_message || null;
  } catch {
    maintenanceMode = false;
    maintenanceMessage = null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <SuspensionGuard userId={user.id} />
      <AdminSidebar serverProfile={profile} pendingCounts={pendingCounts} />
      <main className="flex flex-1 flex-col overflow-hidden">
        <AdminTopbar
          userId={user.id}
          pendingCounts={pendingCounts}
          maintenanceMode={maintenanceMode}
          maintenanceMessage={maintenanceMessage}
        />
        <div className="flex-1 overflow-y-auto bg-[#F5F5F7] p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
