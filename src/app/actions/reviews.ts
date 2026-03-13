'use server'

import { createClient } from '@supabase/supabase-js'

interface ReviewSubmitPayload {
  reviewer_id: string;
  course_id: string;
  enrollment_id: string;
  rating: number;
  title: string;
  body: string;
  is_verified: boolean;
}

export async function submitReviewAction(payload: ReviewSubmitPayload, editReviewId?: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return { success: false, error: 'Missing SUPABASE_SERVICE_ROLE_KEY' };
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  if (editReviewId) {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .update({
        rating: payload.rating,
        title: payload.title,
        body: payload.body,
        updated_at: new Date().toISOString()
      })
      .eq('id', editReviewId)
      .select()
      .single();
      
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } else {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .insert({ ...payload, target_type: 'course' })
      .select()
      .single();
      
    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'You have already reviewed this course.', isDuplicate: true };
      }
      return { success: false, error: error.message };
    }
    return { success: true, data };
  }
}
