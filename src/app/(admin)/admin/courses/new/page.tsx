import { redirect } from 'next/navigation';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import AdminCreateCourseClient from '@/components/admin/content/AdminCreateCourseClient';
import type { InstructorOption } from '@/components/admin/content/types';

export default async function AdminCreateCoursePage() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') redirect('/student/dashboard');

  const { data: instructorRows } = await admin
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('role', 'instructor')
    .eq('status', 'active')
    .order('full_name', { ascending: true });

  const instructorIds = (instructorRows || []).map((row) => row.id);
  const { data: instructorMeta } = instructorIds.length
    ? await admin.from('instructor_profiles').select('user_id, headline').in('user_id', instructorIds)
    : { data: [] as Array<{ user_id: string; headline: string | null }> };

  const headlineMap = new Map((instructorMeta || []).map((row) => [row.user_id, row.headline]));

  const instructors: InstructorOption[] = (instructorRows || []).map((row) => ({
    id: row.id,
    full_name: row.full_name || 'Unnamed Instructor',
    avatar_url: row.avatar_url || null,
    headline: headlineMap.get(row.id) || null,
  }));

  const { data: categoriesRaw } = await admin
    .from('categories')
    .select('id, name')
    .order('name', { ascending: true });

  const categories = (categoriesRaw || []).map((row) => ({
    id: row.id,
    name: row.name || 'Unnamed Category',
  }));

  return <AdminCreateCourseClient instructors={instructors} categories={categories} />;
}
