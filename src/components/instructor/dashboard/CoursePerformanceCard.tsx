'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Course {
  id: string;
  title: string;
  thumbnail_url?: string | null;
  status: string;
  total_enrolled?: number;
  avg_rating?: number;
}

interface CoursePerformanceCardProps {
  course: Course;
  maxEnrolled: number;
}

export function CoursePerformanceCard({ course, maxEnrolled }: CoursePerformanceCardProps) {
  const router = useRouter();
  const fillPct = maxEnrolled > 0 ? Math.min(((course.total_enrolled || 0) / maxEnrolled) * 100, 100) : 0;

  const statusColors: Record<string, string> = {
    approved: 'text-[#28C840]',
    published: 'text-[#28C840]',
    pending: 'text-[#FEBC2E]',
    draft: 'text-[#AEAEB2]',
    rejected: 'text-[#FF5F57]',
  };

  return (
    <div
      onClick={() => router.push(`/instructor/courses/${course.id}`)}
      className="flex cursor-pointer items-center gap-3 rounded-xl bg-[#F5F5F7] p-3 transition-all hover:bg-[rgba(0,0,0,0.03)]"
    >
      {/* Thumbnail */}
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white">
        {course.thumbnail_url ? (
          <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[20px]">📚</div>
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="line-clamp-1 text-[13px] font-semibold text-[#1D1D1F]">{course.title}</span>
        <div className="mt-0.5 flex items-center gap-3 text-[11px] text-[#6E6E73]">
          <span>{course.total_enrolled ?? 0} students</span>
          <span>⭐ {course.avg_rating?.toFixed(1) ?? '—'}</span>
          <span className={`font-semibold uppercase ${statusColors[course.status] ?? 'text-[#AEAEB2]'}`}>
            {course.status}
          </span>
        </div>
      </div>

      {/* Enrollment bar */}
      <div className="flex shrink-0 flex-col items-end gap-1">
        <div className="h-1.5 w-[60px] overflow-hidden rounded-full bg-[rgba(0,0,0,0.06)]">
          <div className="h-full rounded-full bg-[#1D1D1F] transition-all" style={{ width: `${fillPct}%` }} />
        </div>
        <span className="text-[10px] text-[#AEAEB2]">{course.total_enrolled ?? 0} students</span>
      </div>
    </div>
  );
}
