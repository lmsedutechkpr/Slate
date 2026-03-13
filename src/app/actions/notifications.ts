'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function markNotificationsAsReadAction(userId: string, notificationId?: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return { success: false, error: 'Missing SUPABASE_SERVICE_ROLE_KEY' };
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const updatePayload = { is_read: true, read_at: new Date().toISOString() };

  let query = supabaseAdmin.from('notifications').update(updatePayload);

  if (notificationId) {
    query = query.eq('id', notificationId);
  } else {
    query = query.eq('user_id', userId).eq('is_read', false);
  }

  const { error } = await query;
  
  if (error) {
    console.error("Notification update error:", error);
    return { success: false, error: error.message };
  }

  revalidatePath('/student', 'layout');
  return { success: true };
}
