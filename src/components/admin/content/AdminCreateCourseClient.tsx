'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { createAdminCourseAction } from '@/app/actions/admin';
import type { InstructorOption } from './types';

interface CategoryOption {
  id: string;
  name: string;
}

interface AdminCreateCourseClientProps {
  instructors: InstructorOption[];
  categories: CategoryOption[];
}

export default function AdminCreateCourseClient({
  instructors,
  categories: _categories,
}: AdminCreateCourseClientProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [instructorId, setInstructorId] = useState('');
  const [language, setLanguage] = useState('en');
  const [difficulty, setDifficulty] = useState('beginner');
  const [revenueShare, setRevenueShare] = useState(70);
  const [saving, setSaving] = useState(false);

  const instructorCount = useMemo(() => instructors.length, [instructors.length]);

  const submit = async () => {
    if (!instructorId) {
      toast.error('Please select an instructor.');
      return;
    }

    setSaving(true);
    const result = await createAdminCourseAction({
      title: title.trim() || 'Untitled Course',
      instructorId,
      language,
      difficulty,
      categoryId: null,
      isFree: true,
      price: 0,
      revenueShare,
    });
    setSaving(false);

    if (!result.success || !result.courseId) {
      toast.error(result.error || 'Failed to create course.');
      return;
    }

    toast.success('Draft course created, instructor assigned, and notification sent.');
    router.push(`/admin/courses/${result.courseId}/edit`);
    router.refresh();
  };

  return (
    <div className="font-[DM_Sans]">
      <button
        type="button"
        onClick={() => router.push('/admin/courses')}
        className="mb-4 inline-flex items-center gap-2 text-[13px] font-semibold text-[#1D1D1F]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Courses
      </button>

      <h1 className="text-[26px] font-bold text-[#1D1D1F]">Create Course</h1>
      <p className="mt-1 text-[13px] text-[#6E6E73]">
        Same quick flow as instructor create: make a draft instantly, assign instructor, then open editor.
      </p>

      <div className="mt-5 max-w-3xl overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
        <div className="border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-4 py-3 text-[12px] font-semibold text-[#6E6E73]">
          Quick Create
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-[12px] text-[#6E6E73]">Course Title (optional)</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled Course"
              className="h-10 w-full rounded-xl border border-[rgba(0,0,0,0.08)] px-3 text-[13px] text-[#1D1D1F] outline-none"
            />
            <p className="mt-1 text-[11px] text-[#AEAEB2]">If empty, a draft named "Untitled Course" will be created.</p>
          </div>

          <div>
            <label className="mb-1 block text-[12px] text-[#6E6E73]">Assign Instructor ({instructorCount})</label>
            <select
              value={instructorId}
              onChange={(e) => setInstructorId(e.target.value)}
              className="h-10 w-full rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-3 text-[13px] text-[#1D1D1F] outline-none"
            >
              <option value="">Select instructor</option>
              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.full_name}{instructor.headline ? ` - ${instructor.headline}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-3 py-2">
            <p className="text-[11px] font-semibold uppercase text-[#AEAEB2]">Admin Benefit</p>
            <p className="mt-1 text-[12px] text-[#1D1D1F]">Instructor is auto-notified by email with direct course editor link after creation.</p>
          </div>

          <div>
            <label className="mb-1 block text-[12px] text-[#6E6E73]">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="h-10 w-full rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-3 text-[13px] text-[#1D1D1F] outline-none"
            >
              <option value="en">English</option>
              <option value="ta">Tamil</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[12px] text-[#6E6E73]">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="h-10 w-full rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-3 text-[13px] text-[#1D1D1F] outline-none"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[12px] text-[#6E6E73]">Instructor Share (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={revenueShare}
              onChange={(e) => setRevenueShare(Math.max(0, Math.min(100, Number(e.target.value || 0))))}
              className="h-10 w-full rounded-xl border border-[rgba(0,0,0,0.08)] px-3 text-[13px] text-[#1D1D1F] outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end border-t border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5 py-4">
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="rounded-full bg-[#1D1D1F] px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create & Open Editor'}
          </button>
        </div>
      </div>
    </div>
  );
}
