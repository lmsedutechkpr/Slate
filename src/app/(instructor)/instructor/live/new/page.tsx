import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { ScheduleForm } from '@/components/instructor/live/ScheduleForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function ScheduleLiveClassPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>
}) {
  const resolvedParams = await searchParams;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch instructor's courses
  const { data: instructorCourses } = await supabase
    .from('course_instructors')
    .select(`courses ( id, title, slug )`)
    .eq('instructor_id', user.id);

  const coursesList = instructorCourses?.map((ic: any) => ic.courses).filter(Boolean) || [];

  let editClass = null;
  if (resolvedParams.edit) {
    const db = adminDb();
    const { data } = await db
      .from('live_classes')
      .select('*')
      .eq('id', resolvedParams.edit)
      .eq('instructor_id', user.id)
      .single();
    if (data) editClass = data;
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8 flex items-center gap-4">
        <Link 
          href="/instructor/live"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F5F7] text-[#6E6E73] transition-colors hover:bg-[rgba(0,0,0,0.08)] hover:text-[#1D1D1F]"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-[DM_Sans] text-[24px] font-bold text-[#1D1D1F]">
          {editClass ? 'Edit Live Class' : 'Schedule Live Class'}
        </h1>
      </div>

      <ScheduleForm 
        instructorCourses={coursesList} 
        userId={user.id} 
        editClass={editClass} 
      />
    </div>
  );
}
