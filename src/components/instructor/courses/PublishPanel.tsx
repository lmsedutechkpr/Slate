'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import TrafficLights from '@/components/auth/TrafficLights';
import { cn } from '@/lib/utils';
import { fetchSectionsAction } from '@/actions/curriculum';
import { submitCourseForReviewAction } from '@/actions/curriculum';

interface Props {
  course: any;
  courseId: string;
  categories: { id: string; name: string; slug: string }[];
}

interface CheckItem {
  label: string;
  pass: boolean;
}

function useFreshData(courseId: string, initialCourse: any) {
  const [data, setData] = useState<{ course: any; sections: any[] } | null>(null);
  const supabase = createClient();
  useEffect(() => {
    (async () => {
      // Fetch fresh course data
      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId).single();
      // Fetch sections via admin server action (bypasses RLS)
      const sections = await fetchSectionsAction(courseId).catch(() => []);
      setData({ course: courseData ?? initialCourse, sections });
    })();
  }, [courseId]);
  return data;
}

export function PublishPanel({ course: initialCourse, courseId, categories }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const fresh = useFreshData(courseId, initialCourse);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  const c = fresh?.course ?? initialCourse;
  const sections = fresh?.sections ?? [];
  const totalLectures = sections.flatMap((s: any) => s.lectures ?? []).length;
  const publishedLectures = sections.flatMap((s: any) => s.lectures ?? []).filter((l: any) => l.is_published).length;

  const checks: CheckItem[] = [
    { label: 'Course title set', pass: !!c.title && c.title !== 'Untitled Course' },
    { label: 'Description added (min 200 chars)', pass: (c.description?.length ?? 0) >= 200 },
    { label: 'Category selected', pass: !!c.category_id },
    { label: 'At least 1 section', pass: sections.length >= 1 },
    { label: 'At least 3 lectures', pass: totalLectures >= 3 },
    { label: 'Thumbnail uploaded', pass: !!c.thumbnail_url },
    { label: 'Price set or marked free', pass: c.is_free || (c.price ?? 0) > 0 },
    { label: 'Learning outcomes added (min 4)', pass: (c.what_you_learn?.length ?? 0) >= 4 },
  ];

  const passedCount = checks.filter((ch) => ch.pass).length;
  const allPassed = passedCount === checks.length;
  const progressPct = Math.round((passedCount / checks.length) * 100);

  const submitForReview = async () => {
    if (!allPassed) return;
    setSubmitting(true);
    try {
      await submitCourseForReviewAction(courseId);
      setToast('Course submitted for review! We\'ll notify you within 24–48 hours. 🎉');
      setTimeout(() => { router.push('/instructor/courses'); }, 3000);
    } catch (err: any) {
      alert('Failed to submit: ' + (err.message ?? 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const summaryRows = [
    { label: 'Title', value: c.title },
    { label: 'Category', value: categories.find((cat) => cat.id === c.category_id)?.name ?? c.category_id ?? '—' },
    { label: 'Difficulty', value: c.difficulty ?? '—' },
    { label: 'Language', value: c.language === 'ta' ? 'தமிழ்' : 'English' },
    { label: 'Sections', value: String(sections.length) },
    { label: 'Lectures', value: `${totalLectures}` },
    { label: 'Price', value: c.is_free ? 'Free' : `₹${(c.price ?? 0).toLocaleString('en-IN')}` },
    { label: 'Certificate', value: c.certificate_enabled ? 'Yes' : 'No' },
  ];

  return (
    <div className="relative">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-[#28C840]/20 bg-[#EDFAF0] px-4 py-3 text-[13px] font-medium text-[#28C840] shadow-lg">
          {toast}
        </div>
      )}

      <h2 className="mb-6 font-sans text-[22px] font-bold text-[#1D1D1F]">Ready to Publish?</h2>

      {/* Checklist */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
        <div className="flex h-11 items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
          <TrafficLights size="sm" />
          <span className="ml-3 text-[13px] font-semibold text-[#1D1D1F]">Publish Checklist</span>
        </div>
        <div className="space-y-2 p-5">
          {checks.map((item) => (
            <div key={item.label} className={cn('flex items-center gap-3 rounded-xl p-3', item.pass ? 'bg-[#EDFAF0]' : 'bg-[#FFF0EF]')}>
              {item.pass
                ? <CheckCircle2 className="h-4 w-4 shrink-0 text-[#28C840]" />
                : <XCircle className="h-4 w-4 shrink-0 text-[#FF5F57]" />}
              <span className={cn('text-[13px]', item.pass ? 'text-[#1D1D1F]' : 'text-[#6E6E73]')}>
                {item.label}
              </span>
            </div>
          ))}

          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[13px] text-[#6E6E73]">{passedCount}/{checks.length} requirements met</span>
              <span className="text-[13px] font-semibold text-[#1D1D1F]">{progressPct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[rgba(0,0,0,0.06)]">
              <div
                className={cn('h-full rounded-full transition-all', allPassed ? 'bg-[#28C840]' : 'bg-[#1D1D1F]')}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Course Summary */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
        <div className="flex h-11 items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
          <TrafficLights size="sm" />
          <span className="ml-3 text-[13px] font-semibold text-[#1D1D1F]">Course Summary</span>
        </div>
        <div className="divide-y divide-[rgba(0,0,0,0.04)] p-2">
          {summaryRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between px-3 py-2.5">
              <span className="text-[13px] text-[#6E6E73]">{row.label}</span>
              <span className="max-w-[60%] truncate text-right text-[13px] font-medium text-[#1D1D1F]">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      {(c.status === 'pending') ? (
        <div className="flex items-center gap-3 rounded-2xl bg-[#FFF8EC] p-5">
          <Clock className="h-5 w-5 shrink-0 text-[#FEBC2E]" />
          <div>
            <p className="text-[14px] font-semibold text-[#FEBC2E]">Under Review</p>
            <p className="mt-0.5 text-[13px] text-[#6E6E73]">Our team is reviewing your course. You'll be notified by email.</p>
          </div>
        </div>
      ) : (c.status === 'approved' || c.status === 'published') ? (
        <div className="flex items-center gap-3 rounded-2xl bg-[#EDFAF0] p-5">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-[#28C840]" />
          <div>
            <p className="text-[14px] font-semibold text-[#28C840]">Published & Live</p>
            <button onClick={() => router.push(`/courses/${c.slug}`)} className="mt-0.5 text-[13px] text-[#28C840] underline">
              View course →
            </button>
          </div>
        </div>
      ) : (
        <div>
          <button
            onClick={submitForReview}
            disabled={!allPassed || submitting}
            className={cn(
              'w-full rounded-full py-3.5 text-[15px] font-bold transition-all',
              allPassed
                ? 'bg-[#1D1D1F] text-white hover:opacity-80'
                : 'cursor-not-allowed bg-[rgba(0,0,0,0.08)] text-[#AEAEB2]'
            )}
          >
            {submitting ? 'Submitting...' : 'Submit for Review'}
          </button>
          {!allPassed && (
            <p className="mt-3 text-center text-[12px] text-[#AEAEB2]">
              Complete all requirements above to submit your course
            </p>
          )}
        </div>
      )}
    </div>
  );
}
