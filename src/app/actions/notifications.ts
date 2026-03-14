'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// ─── Helper: admin client ────────────────────────────────────────────────────
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ─── Send notification to every enrolled student in a course ─────────────────
export async function notifyEnrolledStudentsAction(params: {
  courseId: string;
  type: string;          // e.g. 'course_update' | 'new_lecture' | 'lecture_updated'
  title: string;
  message: string;
  actionUrl: string;     // e.g. '/student/courses/<courseId>'
  metadata?: Record<string, any>;
}) {
  try {
    const admin = getAdminClient();

    // Get all active enrollments for this course
    const { data: enrollments, error: enrErr } = await admin
      .from('enrollments')
      .select('student_id')
      .eq('course_id', params.courseId)
      .eq('is_active', true);

    if (enrErr || !enrollments || enrollments.length === 0) return { count: 0 };

    const now = new Date().toISOString();
    const rows = enrollments.map(e => ({
      user_id: e.student_id,
      type: params.type,
      title: params.title,
      message: params.message,
      action_url: params.actionUrl,
      metadata: params.metadata ?? {},
      is_read: false,
      created_at: now,
    }));

    const { error: insErr } = await admin.from('notifications').insert(rows);
    if (insErr) console.error('notifyEnrolledStudentsAction insert error:', insErr.message);

    revalidatePath('/student', 'layout');
    return { count: rows.length };
  } catch (err: any) {
    // Fire-and-forget: never throw so it doesn't break the main save flow
    console.error('notifyEnrolledStudentsAction error:', err.message);
    return { count: 0 };
  }
}

// ─── Mark notifications as read ─────────────────────────────────────────────
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
