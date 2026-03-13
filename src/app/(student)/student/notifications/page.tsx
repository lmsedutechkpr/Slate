import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NotificationsPageClient from '@/components/student/notifications/NotificationsPageClient';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, type, title, title_ta, message, message_ta, action_url, is_read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <NotificationsPageClient
      notifications={notifications || []}
      userId={user.id}
    />
  );
}
