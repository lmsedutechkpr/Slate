import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const { courseId } = await request.json();
    if (!courseId) {
      return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Fetch original course
    const { data: original, error: fetchErr } = await adminClient
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (fetchErr || !original) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // 2. Fetch instructors
    const { data: instructors, error: instErr } = await adminClient
      .from('course_instructors')
      .select('*')
      .eq('course_id', courseId);

    if (instErr) {
      return NextResponse.json({ error: 'Could not fetch instructors' }, { status: 500 });
    }

    // 3. Create duplicate course
    const newSlug = `${original.slug}-copy-${uuidv4().slice(0, 8)}`;
    const { data: newCourse, error: insertErr } = await adminClient
      .from('courses')
      .insert({
        ...original,
        id: undefined, // Let DB generate new uuid
        created_at: undefined,
        updated_at: undefined,
        title: `${original.title} (Copy)`,
        slug: newSlug,
        status: 'draft', // Always duplicate as draft
      })
      .select('id')
      .single();

    if (insertErr || !newCourse) {
      console.error('Duplicate insert error:', insertErr);
      return NextResponse.json({ error: 'Failed to create copy' }, { status: 500 });
    }

    // 4. Copy instructors
    if (instructors && instructors.length > 0) {
      const newInstructors = instructors.map(inst => ({
        ...inst,
        id: undefined,
        created_at: undefined,
        course_id: newCourse.id,
      }));
      await adminClient.from('course_instructors').insert(newInstructors);
    }

    return NextResponse.json(newCourse);
  } catch (err: any) {
    console.error('Duplication error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
