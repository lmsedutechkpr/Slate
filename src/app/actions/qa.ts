'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

interface PostQAPayload {
  course_id: string;
  lecture_id: string;
  author_id: string;
  body: string;
}

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function postQuestionAction(payload: PostQAPayload) {
  const db = adminDb();

  const { data, error } = await db.from('course_qa').insert({
    course_id: payload.course_id,
    lecture_id: payload.lecture_id,
    author_id: payload.author_id,
    body: payload.body,
    parent_id: null,        // top-level question
    is_deleted: false,
    is_answered: false,
    is_pinned: false,
    upvotes: 0,
    reply_count: 0,
  }).select(`
    id, body, created_at, upvotes, reply_count,
    is_answered, is_pinned, is_deleted,
    course_id, lecture_id,
    profiles!author_id ( id, full_name, avatar_url, role )
  `).single();

  if (error) {
    console.error('Q&A Insert failed:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/student/courses/[courseId]', 'page');
  revalidatePath('/instructor/qa', 'page');

  return { success: true, data };
}

export async function getCourseQAAction(courseId: string, lectureId: string) {
  const db = adminDb();

  // Fetch top-level questions only (parent_id IS NULL, not deleted)
  const { data, error } = await db.from('course_qa')
    .select(`
      id, body, created_at, upvotes, reply_count,
      is_answered, is_pinned,
      profiles!author_id ( full_name, avatar_url )
    `)
    .eq('course_id', courseId)
    .eq('lecture_id', lectureId)
    .is('parent_id', null)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getCourseQAAction error:', error);
    return { success: false, error: error.message };
  }

  const formatted = (data ?? []).map((q: any) => {
    const prof = Array.isArray(q.profiles) ? q.profiles[0] : q.profiles;
    return {
      ...q,
      author_name: prof?.full_name ?? 'Student',
      author_avatar: prof?.avatar_url ?? null,
    };
  });

  return { success: true, data: formatted };
}

// ── Mutations (Bypass RLS) ──────────────────────────────────────────────

export async function upvoteQuestionAction(questionId: string) {
  const db = adminDb();
  const { data: q } = await db.from('course_qa').select('upvotes').eq('id', questionId).single();
  if (!q) return { success: false, error: 'Question not found' };

  const { error } = await db.from('course_qa')
    .update({ upvotes: (q.upvotes ?? 0) + 1 })
    .eq('id', questionId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function postReplyAction(payload: { questionId: string; courseId: string; lectureId: string; authorId: string; body: string }) {
  const db = adminDb();
  
  // Insert reply
  const { error: insertError } = await db.from('course_qa').insert({
    body: payload.body,
    parent_id: payload.questionId,
    course_id: payload.courseId,
    lecture_id: payload.lectureId,
    author_id: payload.authorId,
    is_answered: true,
    is_deleted: false,
  });

  if (insertError) return { success: false, error: insertError.message };

  // Update parent
  const { data: parent } = await db.from('course_qa').select('reply_count').eq('id', payload.questionId).single();
  await db.from('course_qa')
    .update({ is_answered: true, reply_count: (parent?.reply_count ?? 0) + 1 })
    .eq('id', payload.questionId);

  return { success: true };
}

export async function updateQuestionStatusAction(questionId: string, updates: { is_pinned?: boolean; is_answered?: boolean; is_deleted?: boolean }) {
  const db = adminDb();
  const { error } = await db.from('course_qa').update(updates).eq('id', questionId);
  return { success: !error, error: error?.message };
}

export async function getQuestionRepliesAction(questionId: string) {
  const db = adminDb();
  const { data, error } = await db.from('course_qa')
    .select(`id, body, created_at, profiles!author_id(full_name, avatar_url, role)`)
    .eq('parent_id', questionId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch replies:', error);
    return { success: false, data: [] };
  }
  return { success: true, data: data || [] };
}
