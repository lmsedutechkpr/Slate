'use client';

import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

interface Enrollment {
  id: string;
  created_at: string;
  progress_pct: number;
  courses: { id: string; title: string } | null;
  profiles: { id: string; full_name: string | null; avatar_url: string | null } | null;
}

interface RecentStudentRowProps {
  enrollment: Enrollment;
}

export function RecentStudentRow({ enrollment }: RecentStudentRowProps) {
  const student = enrollment.profiles;
  const course = enrollment.courses;
  const pct = enrollment.progress_pct ?? 0;

  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex items-center gap-3 border-b border-[rgba(0,0,0,0.05)] py-2.5 last:border-0">
      {/* Avatar */}
      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[#F5F5F7]">
        {student?.avatar_url ? (
          <Image src={student.avatar_url} alt={student.full_name || 'S'} fill className="object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[13px] font-semibold text-[#1D1D1F]">
            {student?.full_name?.charAt(0).toUpperCase() || 'S'}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-[13px] font-medium text-[#1D1D1F]">{student?.full_name || 'Student'}</span>
        <span className="line-clamp-1 text-[11px] text-[#6E6E73]">{course?.title || 'Course'}</span>
      </div>

      {/* Progress ring */}
      <div className="flex shrink-0 flex-col items-center">
        <svg width="24" height="24" viewBox="0 0 24 24" className="-rotate-90">
          <circle cx="12" cy="12" r={radius} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="2.5" />
          <circle
            cx="12"
            cy="12"
            r={radius}
            fill="none"
            stroke="#28C840"
            strokeWidth="2.5"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <span className="mt-0.5 text-center text-[10px] text-[#6E6E73]">{pct}%</span>
      </div>

      {/* Time ago */}
      <span className="shrink-0 text-[10px] text-[#AEAEB2]">
        {formatDistanceToNow(new Date(enrollment.created_at), { addSuffix: true })}
      </span>
    </div>
  );
}
