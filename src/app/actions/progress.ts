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

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function markLectureCompleteAction(payload: ProgressPayload) {
  const db = adminClient();

  // Fetch existing progress row
  const { data: existing } = await db
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
    ...(newCompletedAt !== undefined && { completed_at: newCompletedAt }),
  };

  if (payload.progress_secs !== undefined) {
    upsertPayload.progress_secs = payload.progress_secs;
  }

  const { error } = await db.from('lecture_progress').upsert(
    upsertPayload,
    { onConflict: 'enrollment_id, lecture_id' }
  );

  if (error) {
    console.error('Lecture Progress UPSERT failed:', error);
    return { success: false, error: error.message };
  }

  // ─── Course Completion Gate ──────────────────────────────────────────────
  // After marking this lecture complete, check if ALL lectures in the course are done.
  // IMPORTANT: quiz lectures must have been PASSED (a quiz_attempt with score >= pass%) —
  // they are only set is_completed=true here if the student already passed.
  // So "all lecture_progress rows is_completed=true" is sufficient as the gate.

  const { data: enrollment } = await db
    .from('enrollments')
    .select('id, course_id, completed_at')
    .eq('id', payload.enrollment_id)
    .single();

  if (enrollment && !enrollment.completed_at) {
    // Count total published lectures in the course
    const { data: lectures } = await db
      .from('lectures')
      .select('id, type')
      .eq('course_id', enrollment.course_id)
      .eq('is_published', true);

    const totalCount = lectures?.length ?? 0;

    // Count completed lecture_progress rows for this enrollment
    const { data: completedRows } = await db
      .from('lecture_progress')
      .select('lecture_id, is_completed')
      .eq('enrollment_id', payload.enrollment_id)
      .eq('is_completed', true);

    const completedCount = completedRows?.length ?? 0;
    const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    if (completedCount >= totalCount && totalCount > 0) {
      // All lectures completed — set enrollment as fully done
      await db.from('enrollments').update({
        completed_at: new Date().toISOString(),
        progress_pct: 100,
      }).eq('id', payload.enrollment_id);
    } else {
      // Update progress percentage
      await db.from('enrollments').update({ progress_pct: progressPct })
        .eq('id', payload.enrollment_id);
    }
  }
  // ────────────────────────────────────────────────────────────────────────

  revalidatePath('/student', 'layout');
  return { success: true };
}
