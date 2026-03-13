'use server'

import { createClient } from '@supabase/supabase-js'

export async function processPaymentAction(courseId: string, studentId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return { 
      success: false, 
      error: 'Missing SUPABASE_SERVICE_ROLE_KEY in .env.local to bypass RLS payouts trigger.' 
    };
  }

  // Create an admin client that bypasses RLS
  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const { error } = await supabaseAdmin
    .from('enrollments')
    .insert({
      course_id: courseId,
      student_id: studentId,
      is_active: true
    });

  if (error && error.code !== '23505') {
    return { success: false, error: error.message };
  }

  return { success: true };
}
