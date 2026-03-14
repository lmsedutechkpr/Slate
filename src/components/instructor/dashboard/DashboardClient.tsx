'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  DollarSign, Users, BookOpen, Star, TrendingUp,
  MessageSquare, Plus, Radio, BarChart2, Clock
} from 'lucide-react';
import { format, formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { createClient } from '@/lib/supabase/client';

import TrafficLights from '@/components/auth/TrafficLights';
import { EarningsChart } from './EarningsChart';
import { CoursePerformanceCard } from './CoursePerformanceCard';
import { RecentStudentRow } from './RecentStudentRow';

interface Props {
  instructorProfile: any;
  courses: any[];
  recentEnrollments: any[];
  upcomingLive: any[];
  monthlyEarnings: { month: string; amount: number }[];
  unansweredQA: number;
  profile: { full_name: string | null; };
  userId: string;
  myCourseIds: string[];
  enrollTrend: number;
  revenueTrend: number;
  computedTotalRevenue: number;
}

function StatCard({ icon: Icon, value, label, trend, trendPositive }: {
  icon: any; value: string; label: string; trend?: string; trendPositive?: boolean;
}) {
  const color = trendPositive === false ? 'text-[#FF5F57]' : 'text-[#28C840]';
  const TrendIcon = trendPositive === false ? TrendingUp : TrendingUp;
  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
      <div className="flex h-8 items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-4">
        <TrafficLights size="xs" />
      </div>
      <div className="p-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5F5F7]">
          <Icon className="h-4 w-4 text-[#1D1D1F]" />
        </div>
        <p className="mt-3 font-sans text-[28px] font-extrabold leading-none text-[#1D1D1F]">{value}</p>
        <p className="mt-0.5 text-[12px] text-[#6E6E73]">{label}</p>
        {trend && (
          <div className="mt-2 flex items-center gap-1">
            <TrendingUp className={`h-3 w-3 ${color}`} />
            <span className={`text-[11px] ${color}`}>{trend}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function MacCard({ title, rightSlot, children }: { title: string; rightSlot?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
      <div className="flex h-11 shrink-0 items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
        <TrafficLights size="sm" />
        <span className="ml-3 flex-1 text-[13px] font-semibold text-[#1D1D1F]">{title}</span>
        {rightSlot}
      </div>
      <div className="flex-1 overflow-y-auto p-4">{children}</div>
    </div>
  );
}

export function DashboardClient({
  instructorProfile,
  courses,
  recentEnrollments,
  upcomingLive,
  monthlyEarnings,
  unansweredQA,
  profile,
  userId,
  myCourseIds,
  enrollTrend,
  revenueTrend,
  computedTotalRevenue,
}: Props) {
  const router = useRouter();
  const [studentCount, setStudentCount] = useState(instructorProfile?.total_students ?? 0);
  const [enrollments, setEnrollments] = useState(recentEnrollments);
  const [toast, setToast] = useState<string | null>(null);

  const firstName = profile?.full_name?.split(' ')[0] || 'Instructor';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  const maxEnrolled = courses.reduce((m, c) => Math.max(m, c.total_enrolled ?? 0), 1);

  // Realtime: watch new enrollments
  useEffect(() => {
    if (!myCourseIds.length) return;
    const supabase = createClient();
    const channel = supabase
      .channel('instructor-dashboard')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'enrollments',
      }, (payload: any) => {
        if (!myCourseIds.includes(payload.new.course_id)) return;
        setStudentCount((c: number) => c + 1);
        setEnrollments((prev: any[]) => [payload.new, ...prev.slice(0, 9)]);
        setToast('New student enrolled! 🎉');
        setTimeout(() => setToast(null), 5000);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [myCourseIds]);

  const quickActions = [
    { icon: Plus, label: 'New Course', sub: 'Start creating', href: '/instructor/courses/new' },
    { icon: Radio, label: 'Schedule Live', sub: 'Host a session', href: '/instructor/live/new' },
    { icon: MessageSquare, label: 'Answer Q&A', sub: unansweredQA > 0 ? `${unansweredQA} pending` : 'No pending', href: '/instructor/qa', alert: unansweredQA > 0 },
    { icon: BarChart2, label: 'View Analytics', sub: 'Detailed stats', href: '/instructor/courses' },
  ];

  return (
    <div className="relative min-h-full">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-[#28C840]/20 bg-[#EDFAF0] px-4 py-3 text-[13px] font-medium text-[#28C840] shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-sans text-[26px] font-bold text-[#1D1D1F]">
            Good {greeting}, {firstName} 👋
          </h1>
          <p className="mt-1 text-[13px] text-[#6E6E73]">
            {instructorProfile?.total_courses ?? courses.length} courses &middot; {studentCount} students
          </p>
        </div>
        {unansweredQA > 0 && (
          <div className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#FEBC2E]/30 bg-[#FFF8EC] px-4 py-2"
            onClick={() => router.push('/instructor/qa')}>
            <MessageSquare className="h-[14px] w-[14px] text-[#FEBC2E]" />
            <span className="text-[13px] font-medium text-[#1D1D1F]">{unansweredQA} unanswered questions</span>
            <span className="ml-2 text-[13px] font-semibold text-[#FEBC2E]">Answer now →</span>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={DollarSign}
          value={`₹${computedTotalRevenue.toLocaleString('en-IN')}`}
          label="Total Earnings"
          trend={revenueTrend !== 0 ? `${revenueTrend > 0 ? '+' : ''}${revenueTrend}% this month` : undefined}
          trendPositive={revenueTrend >= 0}
        />
        <StatCard
          icon={Users}
          value={String(studentCount)}
          label="Total Students"
          trend={enrollTrend !== 0 ? `${enrollTrend > 0 ? '+' : ''}${enrollTrend}% this month` : undefined}
          trendPositive={enrollTrend >= 0}
        />
        <StatCard
          icon={BookOpen}
          value={String(instructorProfile?.total_courses ?? courses.length)}
          label="Active Courses"
        />
        <StatCard
          icon={Star}
          value={`${(instructorProfile?.avg_rating ?? 0).toFixed(1)} ★`}
          label="Avg Rating"
          trend={instructorProfile?.avg_rating > 0 ? 'From student reviews' : undefined}
          trendPositive={true}
        />
      </div>

      {/* Earnings Chart */}
      <EarningsChart monthlyEarnings={monthlyEarnings} />

      {/* Two-column section */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Course Performance */}
        <MacCard
          title="Course Performance"
          rightSlot={
            <button onClick={() => router.push('/instructor/courses')} className="text-[13px] text-[#6E6E73] transition-colors hover:text-[#1D1D1F]">
              View all →
            </button>
          }
        >
          {courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <span className="text-[28px]">📚</span>
              <p className="mt-2 text-[13px] font-semibold text-[#1D1D1F]">No courses yet</p>
              <button
                onClick={() => router.push('/instructor/courses/new')}
                className="mt-3 rounded-full bg-[#1D1D1F] px-4 py-2 text-[12px] font-semibold text-white hover:opacity-80"
              >
                Create your first course
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {courses.slice(0, 5).map((course) => (
                <CoursePerformanceCard key={course.id} course={course} maxEnrolled={maxEnrolled} />
              ))}
            </div>
          )}
        </MacCard>

        {/* Recent Students */}
        <MacCard
          title="Recent Students"
          rightSlot={
            <button onClick={() => router.push('/instructor/students')} className="text-[13px] text-[#6E6E73] transition-colors hover:text-[#1D1D1F]">
              View all →
            </button>
          }
        >
          {enrollments.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[#6E6E73]">No students enrolled yet.</p>
          ) : (
            enrollments.slice(0, 8).map((e: any) => <RecentStudentRow key={e.id} enrollment={e} />)
          )}
        </MacCard>
      </div>

      {/* Upcoming Live Classes */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
        <div className="flex h-11 items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
          <TrafficLights size="sm" />
          <span className="ml-3 flex-1 text-[13px] font-semibold text-[#1D1D1F]">Upcoming Live Classes</span>
          <button onClick={() => router.push('/instructor/live/new')} className="text-[12px] font-semibold text-[#1D1D1F] hover:underline">
            + Schedule New
          </button>
        </div>
        <div className="p-4">
          {upcomingLive.length === 0 ? (
            <div className="flex flex-col items-center py-6">
              <Radio className="h-7 w-7 text-[#AEAEB2]" />
              <p className="mt-2 text-center text-[13px] text-[#6E6E73]">No upcoming live classes</p>
              <button
                onClick={() => router.push('/instructor/live/new')}
                className="mt-1 cursor-pointer text-center text-[13px] font-semibold text-[#1D1D1F] hover:underline"
              >
                + Schedule your first session
              </button>
            </div>
          ) : (
            upcomingLive.map((lc: any, idx: number) => {
              const date = new Date(lc.scheduled_at);
              const minsUntil = differenceInMinutes(date, new Date());
              const isStartable = minsUntil <= 15 && minsUntil >= 0;
              const daysUntil = Math.floor(minsUntil / (60 * 24));
              const hoursUntil = Math.floor((minsUntil % (60 * 24)) / 60);
              return (
                <div
                  key={lc.id}
                  className={`flex items-center gap-4 border-b border-[rgba(0,0,0,0.05)] py-3 last:border-0`}
                >
                  {/* Date box */}
                  <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-[#F5F5F7] p-2">
                    <span className="font-sans text-[16px] font-bold leading-none text-[#1D1D1F]">
                      {format(date, 'd')}
                    </span>
                    <span className="text-[10px] uppercase text-[#6E6E73]">{format(date, 'MMM')}</span>
                  </div>
                  {/* Info */}
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-[#1D1D1F]">{lc.title}</p>
                    <p className="mt-0.5 text-[11px] text-[#6E6E73]">
                      {format(date, 'h:mm a')} · {lc.duration_mins ?? 60} mins
                    </p>
                    <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[#6E6E73]">
                      <Users className="h-[11px] w-[11px] text-[#AEAEB2]" />
                      <span>
                        {lc.actual_attendees ?? 0}/{lc.max_attendees ?? '∞'} registered
                      </span>
                    </div>
                  </div>
                  {/* Action */}
                  {isStartable ? (
                    <button className="rounded-full bg-[#FF5F57] px-4 py-1.5 text-[12px] font-semibold text-white hover:opacity-80">
                      Start
                    </button>
                  ) : (
                    <span className="text-[11px] text-[#AEAEB2]">
                      {daysUntil > 0 ? `${daysUntil}d ` : ''}{hoursUntil}h away
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {quickActions.map((action, i) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => router.push(action.href)}
            className="cursor-pointer rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-4 text-center transition-all hover:-translate-y-1 hover:shadow-md"
          >
            <TrafficLights size="xs" />
            <div className="mx-auto mt-3 flex h-8 w-8 items-center justify-center rounded-xl bg-[#F5F5F7]">
              <action.icon className="h-[18px] w-[18px] text-[#1D1D1F]" />
            </div>
            <p className="mt-3 text-[13px] font-semibold text-[#1D1D1F]">{action.label}</p>
            <p className={`mt-0.5 text-[11px] ${action.alert ? 'text-[#FF5F57]' : 'text-[#6E6E73]'}`}>
              {action.sub}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
