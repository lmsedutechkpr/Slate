'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Search, Users, Info, X } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

import TrafficLights from '@/components/auth/TrafficLights';
import { StudentStatsCards } from './StudentStatsCards';
import { StudentRow } from './StudentRow';
import { StudentDetailDrawer } from './StudentDetailDrawer';

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  students: any[];
  stats: { totalStudents: number; avgCompletion: number; completionRate: number; newThisMonth: number };
  courses: any[];
  courseIds: string[];
  userId: string;
  instructorName: string;
}

export function StudentsPageClient({
  students: initialStudents,
  stats: initialStats,
  courses,
  courseIds,
  userId,
  instructorName,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [students, setStudents] = useState(initialStudents);
  const [stats, setStats] = useState(initialStats);

  // Filters
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [progressFilter, setProgressFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  // UI state
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  // Bulk message state
  const [bulkScope, setBulkScope] = useState<'all' | 'course'>('all');
  const [bulkCourseId, setBulkCourseId] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Realtime subscription
  useEffect(() => {
    if (courseIds.length === 0) return;
    const channel = supabase
      .channel('instructor-students')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'enrollments' },
        async (payload: any) => {
          if (!courseIds.includes(payload.new.course_id)) return;
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, display_name, avatar_url, preferred_language, created_at')
            .eq('id', payload.new.student_id)
            .single();
          if (!profile) return;
          const { data: course } = await supabase
            .from('courses')
            .select('id, title, thumbnail_url')
            .eq('id', payload.new.course_id)
            .single();

          setStudents((prev) => {
            const existing = prev.find((s) => s.id === profile.id);
            if (existing) {
              return prev.map((s) =>
                s.id === profile.id
                  ? { ...s, totalCourses: s.totalCourses + 1, enrollments: [...s.enrollments, { course, progress_pct: 0, enrolled_at: payload.new.created_at }] }
                  : s
              );
            }
            const newStudent = {
              id: profile.id,
              full_name: profile.full_name ?? profile.display_name ?? 'Unknown',
              avatar_url: profile.avatar_url,
              preferred_language: profile.preferred_language ?? 'en',
              member_since: profile.created_at,
              enrollments: [{ course, progress_pct: 0, enrolled_at: payload.new.created_at }],
              totalCourses: 1,
              completedCourses: 0,
              avgProgress: 0,
              lastActive: null,
              firstEnrolled: payload.new.created_at,
            };
            return [newStudent, ...prev];
          });
          setStats((prev) => ({ ...prev, totalStudents: prev.totalStudents + 1, newThisMonth: prev.newThisMonth + 1 }));
          toast.success('New student enrolled! 🎉', { style: { color: '#28C840' } });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'enrollments' },
        (payload: any) => {
          if (!courseIds.includes(payload.new.course_id)) return;
          setStudents((prev) =>
            prev.map((s) => {
              const updated = s.enrollments.map((e: any) =>
                e.id === payload.new.id ? { ...e, progress_pct: payload.new.progress_pct } : e
              );
              const avg = updated.length > 0
                ? Math.round(updated.reduce((a: number, e: any) => a + (e.progress_pct ?? 0), 0) / updated.length)
                : 0;
              return { ...s, enrollments: updated, avgProgress: avg };
            })
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [courseIds]);

  // Filtering + sorting (client-side only)
  const filtered = useMemo(() => {
    let list = [...students];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.full_name?.toLowerCase().includes(q));
    }

    if (courseFilter !== 'all') {
      list = list.filter((s) => s.enrollments.some((e: any) => e.course_id === courseFilter));
    }

    if (progressFilter === 'not_started') list = list.filter((s) => s.avgProgress === 0);
    else if (progressFilter === 'in_progress') list = list.filter((s) => s.avgProgress > 0 && s.avgProgress < 100);
    else if (progressFilter === 'completed') list = list.filter((s) => s.avgProgress >= 100);

    if (sortBy === 'name_az') list.sort((a, b) => (a.full_name ?? '').localeCompare(b.full_name ?? ''));
    else if (sortBy === 'progress_high') list.sort((a, b) => b.avgProgress - a.avgProgress);
    else if (sortBy === 'progress_low') list.sort((a, b) => a.avgProgress - b.avgProgress);
    else if (sortBy === 'last_active') {
      list.sort((a, b) => {
        if (!a.lastActive) return 1;
        if (!b.lastActive) return -1;
        return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
      });
    }

    return list;
  }, [students, search, courseFilter, progressFilter, sortBy]);

  const handleViewDetail = useCallback((student: any) => {
    setSelectedStudent(student);
    setDrawerOpen(true);
  }, []);

  const handleMessage = useCallback((student: any) => {
    router.push(`/instructor/messages?to=${student.id}`);
  }, [router]);

  // Bulk message recipients
  const bulkRecipients = useMemo(() => {
    if (bulkScope === 'all') return students;
    return students.filter((s) => s.enrollments.some((e: any) => e.course_id === bulkCourseId));
  }, [students, bulkScope, bulkCourseId]);

  const handleSendBulk = async () => {
    if (!bulkMessage.trim() || bulkRecipients.length === 0) return;
    setSending(true);
    try {
      const notifications = bulkRecipients.map((s) => ({
        user_id: s.id,
        title: `Message from ${instructorName}`,
        body: bulkMessage.trim(),
        type: 'message',
        is_read: false,
      }));
      const { error } = await supabase.from('notifications').insert(notifications);
      if (error) throw error;
      toast.success(`Message sent to ${bulkRecipients.length} students`);
      setBulkModalOpen(false);
      setBulkMessage('');
    } catch (err: any) {
      toast.error('Failed to send: ' + (err.message ?? 'Unknown error'));
    } finally {
      setSending(false);
    }
  };

  // Empty state
  if (students.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
        <div className="flex h-10 items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
          <TrafficLights size="sm" />
        </div>
        <div className="flex flex-col items-center py-24 px-6">
          <Users className="h-12 w-12 text-[#AEAEB2]" />
          <h2 className="mt-5 text-[22px] font-bold text-[#1D1D1F]">No students yet</h2>
          <p className="mt-2 max-w-xs text-center text-[14px] text-[#6E6E73]">
            Students will appear here once they enroll in your courses.
          </p>
          <button
            onClick={() => router.push('/instructor/courses')}
            className="mt-8 rounded-full bg-[#1D1D1F] px-6 py-3 text-[14px] font-semibold text-white hover:opacity-80 transition-opacity"
          >
            View My Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-sans text-[26px] font-bold text-[#1D1D1F]">Students</h1>
          <p className="mt-1 text-[13px] text-[#6E6E73]">
            {stats.totalStudents} students across {courses.length} courses
          </p>
        </div>
        <button
          onClick={() => setBulkModalOpen(true)}
          className="flex items-center gap-2 rounded-full border border-[rgba(0,0,0,0.1)] bg-white px-4 py-2 text-[13px] font-medium text-[#1D1D1F] transition-all hover:bg-[#F5F5F7]"
        >
          <Mail className="h-[13px] w-[13px]" />
          Message All
        </button>
      </div>

      {/* Stats */}
      <StudentStatsCards stats={stats} />

      {/* Filter Row */}
      <div className="mb-5 overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
        <div className="flex h-9 items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-4">
          <TrafficLights size="xs" />
        </div>
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          {/* Search */}
          <div className="relative min-w-[180px] flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-[#AEAEB2]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students..."
              className="w-full rounded-xl bg-[#F5F5F7] py-2 pl-9 pr-4 text-[13px] text-[#1D1D1F] placeholder-[#AEAEB2] outline-none focus:ring-2 focus:ring-[rgba(0,0,0,0.08)] transition-all"
            />
          </div>

          {/* Course filter */}
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="min-w-[160px] rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#F5F5F7] px-3 py-2 text-[13px] text-[#1D1D1F] outline-none cursor-pointer"
          >
            <option value="all">All Courses</option>
            {courses.map((c: any) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>

          {/* Progress filter */}
          <select
            value={progressFilter}
            onChange={(e) => setProgressFilter(e.target.value)}
            className="min-w-[160px] rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#F5F5F7] px-3 py-2 text-[13px] text-[#1D1D1F] outline-none cursor-pointer"
          >
            <option value="all">All Progress</option>
            <option value="not_started">Not Started (0%)</option>
            <option value="in_progress">In Progress (1–99%)</option>
            <option value="completed">Completed (100%)</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="min-w-[160px] rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#F5F5F7] px-3 py-2 text-[13px] text-[#1D1D1F] outline-none cursor-pointer"
          >
            <option value="recent">Recently Enrolled</option>
            <option value="name_az">Name A–Z</option>
            <option value="progress_high">Highest Progress</option>
            <option value="progress_low">Lowest Progress</option>
            <option value="last_active">Last Active</option>
          </select>

          <span className="ml-auto text-[12px] text-[#AEAEB2]">{filtered.length} students</span>
        </div>
      </div>


      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
        {/* Mac titlebar */}
        <div className="flex h-11 items-center justify-between border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
          <div className="flex items-center gap-3">
            <TrafficLights size="xs" />
            <span className="text-[13px] font-semibold text-[#1D1D1F]">All Students</span>
          </div>
        </div>

        {/* Table header — desktop only */}
        <div
          className="hidden sm:grid items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#AEAEB2]"
          style={{ gridTemplateColumns: '2fr 2fr 1.2fr 1.2fr 1.2fr 100px' }}
        >
          <span>Student</span>
          <span>Course</span>
          <span>Progress</span>
          <span>Last Active</span>
          <span>Enrolled</span>
          <span className="text-right">Actions</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[rgba(0,0,0,0.05)]">
          {filtered.length > 0 ? (
            filtered.map((student) => (
              <StudentRow
                key={student.id}
                student={student}
                onViewDetail={() => handleViewDetail(student)}
                onMessage={() => handleMessage(student)}
              />
            ))
          ) : (
            <div className="py-16 text-center text-[14px] text-[#6E6E73]">
              No students match your filters.
            </div>
          )}
        </div>
      </div>

      {/* Detail Drawer */}
      <StudentDetailDrawer
        student={selectedStudent}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      {/* Bulk Message Modal */}
      <Dialog open={bulkModalOpen} onOpenChange={setBulkModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-[rgba(0,0,0,0.08)] rounded-2xl p-0 overflow-hidden gap-0">
          {/* Titlebar */}
          <div className="flex h-11 items-center justify-between border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
            <div className="flex items-center gap-3">
              <TrafficLights size="xs" />
              <DialogTitle className="text-[13px] font-semibold text-[#1D1D1F]">
                Message All Students
              </DialogTitle>
            </div>
            <button onClick={() => setBulkModalOpen(false)} className="text-[#AEAEB2] hover:text-[#1D1D1F] transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-6">
            {/* Scope selector */}
            <div className="flex gap-2 mb-4">
              {(['all', 'course'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setBulkScope(s)}
                  className={`flex-1 rounded-full py-2 text-[13px] font-medium transition-all ${
                    bulkScope === s
                      ? 'bg-[#1D1D1F] text-white'
                      : 'border border-[rgba(0,0,0,0.1)] text-[#6E6E73] hover:bg-[#F5F5F7]'
                  }`}
                >
                  {s === 'all' ? `All my students (${students.length})` : 'Specific course'}
                </button>
              ))}
            </div>

            {bulkScope === 'course' && (
              <select
                value={bulkCourseId}
                onChange={(e) => setBulkCourseId(e.target.value)}
                className="w-full mb-4 rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#F5F5F7] px-3 py-2.5 text-[13px] text-[#1D1D1F] outline-none cursor-pointer appearance-none"
              >
                <option value="">Select a course...</option>
                {courses.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            )}

            {/* Message */}
            <textarea
              rows={5}
              value={bulkMessage}
              onChange={(e) => setBulkMessage(e.target.value)}
              placeholder="Write your announcement or message to students..."
              className="w-full resize-none rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#F5F5F7] p-4 text-[13px] text-[#1D1D1F] placeholder-[#AEAEB2] outline-none focus:ring-2 focus:ring-[rgba(0,0,0,0.1)] transition-all"
            />

            {/* Note */}
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#FFF8EC] p-3">
              <Info className="h-3.5 w-3.5 text-[#FEBC2E] mt-0.5 flex-shrink-0" />
              <p className="text-[12px] text-[#FEBC2E]">
                This will send a notification to each student. Use responsibly.
              </p>
            </div>

            {/* Footer */}
            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={() => setBulkModalOpen(false)}
                className="flex-1 rounded-full border border-[rgba(0,0,0,0.1)] py-2.5 text-[13px] font-medium text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendBulk}
                disabled={sending || !bulkMessage.trim()}
                className="flex-1 rounded-full bg-[#1D1D1F] py-2.5 text-[13px] font-semibold text-white hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending ? 'Sending...' : `Send to ${bulkRecipients.length} Students`}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
