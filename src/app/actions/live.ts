'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function scheduleLiveClassAction(classData: any, notifyStudents: boolean = false) {
  try {
    const db = adminDb();

    // Insert live class
    const { data, error } = await db.from('live_classes').insert(classData).select().single();
    
    if (error) {
      console.error('Failed to create live class:', error);
      return { success: false, error: error.message };
    }

    // Handle notifications if checked
    if (notifyStudents && data) {
      const { data: enrollments } = await db
        .from('enrollments')
        .select('student_id')
        .eq('course_id', classData.course_id)
        .eq('is_active', true);

      if (enrollments && enrollments.length > 0) {
        const notifications = enrollments.map((e: any) => ({
          user_id: e.student_id,
          title: 'New Live Class Scheduled',
          message: `${classData.title} on ${new Date(classData.scheduled_at).toLocaleDateString()}`,
          type: 'live_class',
          metadata: { live_class_id: data.id }
        }));
        await db.from('notifications').insert(notifications);
      }
    }

    revalidatePath('/instructor/live');
    revalidatePath('/student/courses/[courseId]', 'page');
    
    return { success: true, data };
  } catch (err: any) {
    console.error('Schedule Live Class Action Error:', err);
    return { success: false, error: err.message || 'An unexpected error occurred' };
  }
}

export async function updateLiveClassAction(id: string, classData: any) {
  try {
    const db = adminDb();
    const { data, error } = await db.from('live_classes').update(classData).eq('id', id).select().single();
    
    if (error) {
      console.error('Failed to update live class:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/instructor/live');
    revalidatePath('/student/courses/[courseId]', 'page');
    
    return { success: true, data };
  } catch (err: any) {
    console.error('Update Live Class Action Error:', err);
    return { success: false, error: err.message || 'An unexpected error occurred' };
  }
}
