'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

interface PostQAPayload {
  course_id: string;
  lecture_id: string;
  author_id: string;
  body: string;
}

export async function postQuestionAction(payload: PostQAPayload) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return { success: false, error: 'Missing SUPABASE_SERVICE_ROLE_KEY' };
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data, error } = await supabaseAdmin.from('course_qa').insert({
    course_id: payload.course_id,
    lecture_id: payload.lecture_id,
    author_id: payload.author_id,
    body: payload.body
  }).select().single();

  if (error) {
    console.error("Q&A Insert failed:", error);
    return { success: false, error: error.message };
  }

  revalidatePath('/student/courses/[courseId]', 'page');

  return { success: true, data };
}

export async function getCourseQAAction(courseId: string, lectureId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return { success: false, error: 'Missing SUPABASE_SERVICE_ROLE_KEY' };
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data, error } = await supabaseAdmin.from('course_qa')
    .select(`
      id, body, created_at, upvote_count,
      profiles!course_qa_author_id_fkey ( full_name, avatar_url )
    `)
    .eq('course_id', courseId)
    .eq('lecture_id', lectureId)
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  // Format profiles safely
  const formatted = (data || []).map(q => ({
    ...q,
    author_name: (Array.isArray(q.profiles) ? q.profiles[0] : q.profiles)?.full_name || 'Student',
    author_avatar: (Array.isArray(q.profiles) ? q.profiles[0] : q.profiles)?.avatar_url
  }));

  return { success: true, data: formatted };
}
