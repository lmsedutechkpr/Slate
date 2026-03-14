import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { notifyEnrolledStudentsAction } from '@/app/actions/notifications';

// POST /api/notify-students
// Validates the instructor is authenticated, then fans out a notification
// to all enrolled students. Used by client-side course forms.
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // Verify the caller is an instructor
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['instructor', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { courseId, type, title, message, actionUrl, metadata } = body;

    if (!courseId || !type || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await notifyEnrolledStudentsAction({
      courseId, type, title, message, actionUrl: actionUrl ?? '/student/dashboard', metadata,
    });

    return NextResponse.json({ success: true, notified: result.count });
  } catch (err: any) {
    console.error('/api/notify-students error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
