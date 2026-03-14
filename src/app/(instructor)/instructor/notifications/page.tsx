import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import InstructorNotificationsClient from '@/components/instructor/notifications/InstructorNotificationsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Notifications – Slate Instructor',
};

export default async function InstructorNotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const db = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: notifications } = await db
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <InstructorNotificationsClient
      initialNotifications={(notifications || []) as any}
      userId={user.id}
    />
  );
}
