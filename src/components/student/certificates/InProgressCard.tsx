'use client';

import { useRouter } from 'next/navigation';
import { Lock, BookOpen } from 'lucide-react';

interface InProgressCardProps {
  enrollment: any;
}

export default function InProgressCard({ enrollment }: InProgressCardProps) {
  const router = useRouter();
  const course = enrollment.courses;
  if (!course) return null;

  const pct = Math.round(enrollment.progress_pct ?? 0);
  const total = course.total_lectures ?? 0;
  const done = Math.round(total * pct / 100);
  const remaining = Math.max(0, total - done);

  const instructors = course.course_instructors ?? [];
  const instructorName = instructors[0]?.profiles?.full_name ?? 'Instructor';

  return (
    <div
      onClick={() => router.push('/student/courses/' + course.id)}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:-translate-y-1 hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer"
    >
      {/* Titlebar */}
      <div className="bg-gray-50 border-b border-gray-100 px-4 h-9 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#FF5F57]" />
          <div className="w-2 h-2 rounded-full bg-[#FEBC2E]" />
          <div className="w-2 h-2 rounded-full bg-[#28C840]" />
        </div>
        <span className="font-mono text-[10px] text-[#FEBC2E] uppercase tracking-widest ml-1">
          In Progress
        </span>
      </div>

      {/* Thumbnail */}
      <div className="h-[110px] relative overflow-hidden">
        {course.thumbnail_url
          ? <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gray-100" />}
        <div className="absolute inset-0 bg-black/40" />

        {/* Progress overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#FEBC2E] rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[10px] text-white font-semibold mt-1">{pct}% complete</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-[14px] font-semibold text-gray-900 line-clamp-2 leading-snug">{course.title}</p>
        <p className="text-[12px] text-gray-400 mt-0.5">by {instructorName}</p>

        {remaining > 0 && (
          <div className="flex items-center gap-1.5 mt-3">
            <BookOpen className="w-3 h-3 text-gray-400" />
            <span className="text-[11px] text-gray-500">{remaining} lecture{remaining !== 1 ? 's' : ''} remaining</span>
          </div>
        )}

        {/* Lock indicator */}
        <div className="flex items-center gap-2 mt-3 bg-gray-50 rounded-lg px-3 py-2">
          <Lock className="w-3 h-3 text-gray-400" />
          <span className="text-[11px] text-gray-400">Complete course to unlock certificate</span>
        </div>

        <button
          onClick={e => { e.stopPropagation(); router.push('/student/courses/' + course.id); }}
          className="mt-3 w-full bg-gray-900 text-white font-semibold text-[12px] rounded-xl py-2 hover:bg-gray-800 transition-colors"
        >
          Continue Learning →
        </button>
      </div>
    </div>
  );
}
