'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { MessageSquare, Clock, CheckCircle2, X } from 'lucide-react';
import { formatDistanceToNow, format, differenceInDays } from 'date-fns';
import {
  Sheet, SheetContent,
} from '@/components/ui/sheet';
import TrafficLights from '@/components/auth/TrafficLights';

interface Props {
  student: any | null;
  open: boolean;
  onClose: () => void;
}

function progressColor(pct: number) {
  if (pct >= 100) return 'bg-[#28C840]';
  if (pct > 0) return 'bg-[#1D1D1F]';
  return 'bg-[#AEAEB2]';
}

export function StudentDetailDrawer({ student, open, onClose }: Props) {
  const router = useRouter();

  if (!student) return null;

  const initials = (student.full_name ?? 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const memberSince = student.member_since ? format(new Date(student.member_since), 'd MMM yyyy') : '—';
  const daysSinceJoined = student.member_since
    ? differenceInDays(new Date(), new Date(student.member_since))
    : 0;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:w-[420px] sm:max-w-[420px] p-0 bg-white border-l border-[rgba(0,0,0,0.08)] flex flex-col overflow-hidden"
      >

        {/* Header */}
        <div className="flex-shrink-0 border-b border-[rgba(0,0,0,0.06)] px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <TrafficLights size="sm" />
            <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[#F5F5F7] transition-colors">
              <X className="h-4 w-4 text-[#AEAEB2]" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border-2 border-[rgba(0,0,0,0.08)] bg-[#F5F5F7]">
              {student.avatar_url ? (
                <Image src={student.avatar_url} alt={student.full_name} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[15px] font-bold text-[#6E6E73]">
                  {initials}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-[#1D1D1F]">{student.full_name}</h2>
              <p className="text-[12px] text-[#6E6E73] mt-0.5">
                {student.preferred_language === 'ta' ? 'Tamil' : 'English'} · {student.totalCourses} course{student.totalCourses !== 1 ? 's' : ''}
              </p>
              <p className="text-[11px] text-[#AEAEB2] mt-1">Member since {memberSince}</p>
            </div>
          </div>

          <button
            onClick={() => router.push(`/instructor/messages?to=${student.id}`)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#1D1D1F] py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-80"
          >
            <MessageSquare className="h-[13px] w-[13px]" />
            Send Message
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">

          {/* Enrolled Courses */}
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#AEAEB2]">
            Enrolled Courses
          </p>

          <div className="flex flex-col gap-3">
            {student.enrollments.map((enr: any) => (
              <div key={enr.id} className="rounded-xl bg-[#F5F5F7] p-4">
                <div className="mb-2 flex items-center">
                  <TrafficLights size="xs" />
                </div>
                <div className="flex items-center gap-3">
                  {enr.course?.thumbnail_url && (
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg">
                      <Image src={enr.course.thumbnail_url} alt="" fill className="object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="line-clamp-1 text-[13px] font-semibold text-[#1D1D1F]">
                      {enr.course?.title ?? 'Unknown Course'}
                    </p>
                    <p className="text-[11px] text-[#AEAEB2] mt-0.5">
                      Enrolled {format(new Date(enr.enrolled_at), 'd MMM yyyy')}
                    </p>
                  </div>
                </div>

                {/* Progress */}
                <div className="mt-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[11px] text-[#AEAEB2]">Progress</span>
                    <span className="text-[12px] font-bold text-[#1D1D1F]">{enr.progress_pct ?? 0}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[rgba(0,0,0,0.06)]">
                    <div
                      className={`h-full rounded-full transition-all ${progressColor(enr.progress_pct ?? 0)}`}
                      style={{ width: `${Math.min(enr.progress_pct ?? 0, 100)}%` }}
                    />
                  </div>

                  {enr.completed_at && (
                    <div className="mt-2 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-[#28C840]" />
                      <span className="text-[11px] text-[#28C840]">
                        Completed {format(new Date(enr.completed_at), 'd MMM yyyy')}
                      </span>
                    </div>
                  )}

                  {enr.last_accessed_at && (
                    <div className="mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-[#AEAEB2]" />
                      <span className="text-[11px] text-[#AEAEB2]">
                        Last active {formatDistanceToNow(new Date(enr.last_accessed_at), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {student.enrollments.length === 0 && (
              <p className="text-[13px] text-[#AEAEB2] text-center py-4">No courses enrolled</p>
            )}
          </div>

          <div className="my-5 border-t border-[rgba(0,0,0,0.06)]" />

          {/* Activity stats */}
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#AEAEB2]">
            Activity
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Courses Enrolled', value: student.totalCourses },
              { label: 'Courses Completed', value: student.completedCourses },
              { label: 'Avg Progress', value: `${student.avgProgress}%` },
              { label: 'Days Since Joined', value: daysSinceJoined },
            ].map((stat, i) => (
              <div key={i} className="rounded-xl bg-[#F5F5F7] p-3">
                <div className="text-[20px] font-bold text-[#1D1D1F]">{stat.value}</div>
                <div className="mt-0.5 text-[11px] text-[#AEAEB2]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
