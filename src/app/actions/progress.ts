'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

interface ProgressPayload {
  enrollment_id: string;
  lecture_id: string;
  student_id: string;
  is_completed: boolean;
  progress_secs?: number;
}

export async function markLectureCompleteAction(payload: ProgressPayload) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return { success: false, error: 'Missing SUPABASE_SERVICE_ROLE_KEY' };
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Check if it's already marked as completed to prevent overwriting
  const { data: existing } = await supabaseAdmin
    .from('lecture_progress')
    .select('is_completed, completed_at, progress_secs')
    .eq('enrollment_id', payload.enrollment_id)
    .eq('lecture_id', payload.lecture_id)
    .single();

  const isCompletedNow = payload.is_completed || existing?.is_completed;
  
  let newCompletedAt = existing?.completed_at;
  if (!existing?.is_completed && payload.is_completed) {
    newCompletedAt = new Date().toISOString();
  }

  const upsertPayload: any = {
    enrollment_id: payload.enrollment_id,
    lecture_id: payload.lecture_id,
    student_id: payload.student_id,
    is_completed: isCompletedNow,
    ...(newCompletedAt !== undefined && { completed_at: newCompletedAt })
  };

  if (payload.progress_secs !== undefined) {
    upsertPayload.progress_secs = payload.progress_secs;
  }

  const { error } = await supabaseAdmin.from('lecture_progress').upsert(
    upsertPayload, 
    { onConflict: 'enrollment_id, lecture_id' }
  );

  if (error) {
    console.error("Lecture Progress UPSERT failed:", error);
    return { success: false, error: error.message };
  }

  // Flush the student dashboard and related coursework views to fetch accurate progress checks
  revalidatePath('/student', 'layout');

  return { success: true };
}
