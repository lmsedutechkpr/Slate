'use client';
import Image from 'next/image';
import { MessageSquare, ChevronRight } from 'lucide-react';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

interface Props {
  student: any;
  onViewDetail: () => void;
  onMessage: () => void;
}

function progressColor(pct: number) {
  if (pct >= 100) return 'bg-[#28C840]';
  if (pct > 0) return 'bg-[#1D1D1F]';
  return 'bg-[#AEAEB2]';
}

function progressText(pct: number) {
  if (pct >= 100) return 'text-[#28C840]';
  if (pct > 0) return 'text-[#1D1D1F]';
  return 'text-[#AEAEB2]';
}

function formatLastActive(date: string | null) {
  if (!date) return 'Never';
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return formatDistanceToNow(d, { addSuffix: true });
}

export function StudentRow({ student, onViewDetail, onMessage }: Props) {
  const initials = (student.full_name ?? 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const lang = student.preferred_language === 'ta' ? 'தமிழ்' : 'EN';
  const firstEnrolled = student.firstEnrolled ? format(new Date(student.firstEnrolled), 'd MMM yyyy') : '—';

  return (
    <>
      {/* Desktop row */}
      <div
        className="hidden sm:grid items-center px-5 py-4 transition-colors hover:bg-[#F5F5F7] cursor-pointer"
        style={{ gridTemplateColumns: '2fr 2fr 1.2fr 1.2fr 1.2fr 100px' }}
        onClick={onViewDetail}
      >
        {/* Col 1: Avatar + Name */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-[#F5F5F7] border border-[rgba(0,0,0,0.08)]">
            {student.avatar_url ? (
              <Image src={student.avatar_url} alt={student.full_name} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[11px] font-bold text-[#6E6E73]">
                {initials}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-[#1D1D1F]">{student.full_name}</p>
            <span className="mt-0.5 inline-block rounded-full bg-[#F5F5F7] px-2 py-0.5 text-[10px] text-[#AEAEB2]">
              {lang}
            </span>
          </div>
        </div>

        {/* Col 2: Courses */}
        <div className="flex items-center gap-2 min-w-0 pr-4">
          {student.enrollments.length === 1 ? (
            <>
              {student.enrollments[0].course?.thumbnail_url && (
                <div className="relative h-6 w-6 flex-shrink-0 overflow-hidden rounded-md">
                  <Image src={student.enrollments[0].course.thumbnail_url} alt="" fill className="object-cover" />
                </div>
              )}
              <span className="truncate text-[13px] text-[#6E6E73]">
                {student.enrollments[0].course?.title ?? '—'}
              </span>
            </>
          ) : (
            <>
              <div className="flex -space-x-1.5">
                {student.enrollments.slice(0, 2).map((e: any, i: number) => (
                  <div key={i} className="relative h-6 w-6 overflow-hidden rounded-md border border-white">
                    {e.course?.thumbnail_url && (
                      <Image src={e.course.thumbnail_url} alt="" fill className="object-cover" />
                    )}
                  </div>
                ))}
              </div>
              <span className="text-[13px] text-[#6E6E73]">{student.totalCourses} courses</span>
            </>
          )}
        </div>

        {/* Col 3: Progress */}
        <div className="flex items-center gap-2.5">
          <div className="relative h-1.5 w-[72px] overflow-hidden rounded-full bg-[rgba(0,0,0,0.06)]">
            <div
              className={`absolute inset-y-0 left-0 rounded-full ${progressColor(student.avgProgress)}`}
              style={{ width: `${Math.min(student.avgProgress, 100)}%` }}
            />
          </div>
          <span className={`text-[12px] font-semibold tabular-nums ${progressText(student.avgProgress)}`}>
            {student.avgProgress}%
          </span>
        </div>

        {/* Col 4: Last Active */}
        <span className="text-[13px] text-[#6E6E73]">{formatLastActive(student.lastActive)}</span>

        {/* Col 5: Enrolled */}
        <span className="text-[13px] text-[#6E6E73]">{firstEnrolled}</span>

        {/* Col 6: Actions */}
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); onMessage(); }}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F5F5F7] text-[#6E6E73] transition-colors hover:bg-[rgba(0,0,0,0.08)] hover:text-[#1D1D1F]"
            title="Message student"
          >
            <MessageSquare className="h-[14px] w-[14px]" />
          </button>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg text-[#AEAEB2]">
            <ChevronRight className="h-[14px] w-[14px]" />
          </div>
        </div>
      </div>

      {/* Mobile card */}
      <div
        className="sm:hidden px-4 py-3.5 transition-colors hover:bg-[#F5F5F7] cursor-pointer border-t border-[rgba(0,0,0,0.05)] first:border-t-0"
        onClick={onViewDetail}
      >
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-[#F5F5F7]">
            {student.avatar_url ? (
              <Image src={student.avatar_url} alt={student.full_name} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[12px] font-bold text-[#6E6E73]">
                {initials}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-semibold text-[#1D1D1F] truncate">{student.full_name}</p>
              <span className="rounded-full bg-[#F5F5F7] px-1.5 py-0.5 text-[10px] text-[#AEAEB2] flex-shrink-0">{lang}</span>
            </div>
            <p className="text-[12px] text-[#6E6E73] mt-0.5">{student.totalCourses} course{student.totalCourses !== 1 ? 's' : ''}</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[rgba(0,0,0,0.06)]">
                <div className={`absolute inset-y-0 left-0 rounded-full ${progressColor(student.avgProgress)}`} style={{ width: `${Math.min(student.avgProgress, 100)}%` }} />
              </div>
              <span className={`text-[11px] font-semibold ${progressText(student.avgProgress)}`}>{student.avgProgress}%</span>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onMessage(); }}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F5F5F7] text-[#6E6E73]"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}
