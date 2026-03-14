'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, MessageSquare, Pin, Search, X } from 'lucide-react';
import { QAStatsRow } from './QAStatsRow';
import { postReplyAction, updateQuestionStatusAction } from '@/app/actions/qa';
import { QuestionCard } from './QuestionCard';
import TrafficLights from '@/components/auth/TrafficLights';

type Tab = 'all' | 'unanswered' | 'answered' | 'pinned';
type SortKey = 'upvotes' | 'newest' | 'oldest' | 'replies';

interface Props {
  questions: any[];
  stats: { totalQuestions: number; unanswered: number; answered: number; thisWeek: number };
  instructorCourses: any[];
  courseIds: string[];
  userId: string;
}

// ── Simple toast ──────────────────────────────────────────────────────────
function Toast({ message, color = '#1D1D1F', onDismiss }: { message: string; color?: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white px-4 py-3 shadow-lg"
      style={{ minWidth: 280 }}
    >
      <MessageSquare className="h-4 w-4 shrink-0" style={{ color }} />
      <span className="text-[13px] font-medium text-[#1D1D1F]">{message}</span>
      <button onClick={onDismiss} className="ml-auto text-[#AEAEB2] hover:text-[#6E6E73]">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── Mac window card ───────────────────────────────────────────────────────
function MacCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
      <div className="flex h-9 items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-4">
        <TrafficLights size="sm" />
        {title && <span className="ml-3 text-[12px] font-semibold text-[#1D1D1F]">{title}</span>}
      </div>
      {children}
    </div>
  );
}

export function QAPageClient({ questions: initialQuestions, stats: initialStats, instructorCourses, courseIds, userId }: Props) {
  const [questions, setQuestions] = useState<any[]>(initialQuestions);
  const [stats, setStats] = useState(initialStats);
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('upvotes');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ message: string; color?: string } | null>(null);
  const supabase = createClient();
  const realtimeRef = useRef<any>(null);

  const showToast = (message: string, color?: string) => {
    setToast({ message, color });
  };

  // ── Realtime subscription ─────────────────────────────────────────────
  useEffect(() => {
    if (courseIds.length === 0) return;

    const channel = supabase.channel('instructor-qa')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'course_qa',
      }, async (payload: any) => {
        const newRow = payload.new;
        if (!courseIds.includes(newRow.course_id)) return;

        if (!newRow.parent_id && !newRow.is_deleted) {
          // New top-level question — fetch with simple joins (NO self-join)
          const { data } = await supabase
            .from('course_qa')
            .select(`
              id, body, upvotes, reply_count,
              is_answered, is_pinned, is_deleted, created_at,
              course_id, lecture_id,
              courses ( id, title, thumbnail_url ),
              lectures ( id, title ),
              profiles!author_id ( id, full_name, avatar_url, role )
            `)
            .eq('id', newRow.id)
            .single();

          if (data) {
            setQuestions(prev => {
              if (prev.some(q => q.id === (data as any).id)) return prev;
              return [{ ...(data as any), course_qa: [] }, ...prev];
            });
            setStats(prev => ({
              ...prev,
              totalQuestions: prev.totalQuestions + 1,
              unanswered: prev.unanswered + 1,
              thisWeek: prev.thisWeek + 1,
            }));
            const courseTitle = (data as any).courses?.title ?? 'your course';
            showToast(`New question in ${courseTitle}`, '#1D1D1F');
          }
        } else if (newRow.parent_id) {
          // New reply — increment reply_count on parent
          setQuestions(prev =>
            prev.map(q =>
              q.id === newRow.parent_id
                ? { ...q, reply_count: (q.reply_count ?? 0) + 1 }
                : q
            )
          );
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'course_qa',
      }, (payload: any) => {
        const updated = payload.new;
        if (!courseIds.includes(updated.course_id)) return;
        setQuestions(prev => prev.map(q => q.id === updated.id ? { ...q, ...updated } : q));
      })
      .subscribe();

    realtimeRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [courseIds]);


  // ── Handlers ──────────────────────────────────────────────────────────
  const handleAnswer = async (questionId: string, body: string) => {
    const q = questions.find(x => x.id === questionId);
    if (!q) return;

    // Optimistic UI updates
    setQuestions(prev =>
      prev.map(q =>
        q.id === questionId
          ? {
              ...q,
              is_answered: true,
              reply_count: (q.reply_count ?? 0) + 1,
              course_qa: [
                ...(Array.isArray(q.course_qa) ? q.course_qa : []),
                {
                  id: `temp-${Date.now()}`,
                  body,
                  created_at: new Date().toISOString(),
                  is_answered: true,
                  profiles: { id: userId, full_name: 'You', role: 'instructor', avatar_url: null },
                },
              ],
            }
          : q
      )
    );
    setStats(prev => ({ ...prev, answered: prev.answered + 1, unanswered: Math.max(0, prev.unanswered - 1) }));
    showToast('Answer posted!', '#28C840');

    // Save via Server Action to bypass RLS
    const res = await postReplyAction({
      questionId,
      courseId: q.course_id,
      lectureId: q.lecture_id,
      authorId: userId,
      body,
    });

    if (!res.success) {
      showToast('Failed to post answer', '#FF5F57');
    }
  };

  const handlePin = async (questionId: string) => {
    const q = questions.find(q => q.id === questionId);
    if (!q) return;
    const newPinned = !q.is_pinned;
    setQuestions(prev => prev.map(x => x.id === questionId ? { ...x, is_pinned: newPinned } : x));
    await updateQuestionStatusAction(questionId, { is_pinned: newPinned });
    showToast(newPinned ? 'Question pinned' : 'Question unpinned');
  };

  const handleMarkAnswered = async (questionId: string) => {
    setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, is_answered: true } : q));
    setStats(prev => ({ ...prev, answered: prev.answered + 1, unanswered: Math.max(0, prev.unanswered - 1) }));
    await updateQuestionStatusAction(questionId, { is_answered: true });
    showToast('Marked as answered', '#28C840');
  };

  const handleDelete = async (questionId: string) => {
    await updateQuestionStatusAction(questionId, { is_deleted: true });
    setQuestions(prev => prev.filter(q => q.id !== questionId));
    setStats(prev => {
      const deleted = questions.find(q => q.id === questionId);
      return {
        ...prev,
        totalQuestions: prev.totalQuestions - 1,
        unanswered: deleted && !deleted.is_answered ? prev.unanswered - 1 : prev.unanswered,
        answered: deleted && deleted.is_answered ? prev.answered - 1 : prev.answered,
      };
    });
    showToast('Question removed');
  };

  // ── Filtering + sorting ───────────────────────────────────────────────
  const filtered = questions
    .filter(q => {
      if (activeTab === 'unanswered') return !q.is_answered;
      if (activeTab === 'answered') return q.is_answered;
      if (activeTab === 'pinned') return q.is_pinned;
      return true;
    })
    .filter(q => courseFilter === 'all' || q.course_id === courseFilter)
    .filter(q => {
      if (!search.trim()) return true;
      const s = search.toLowerCase();
      return (q.body ?? '').toLowerCase().includes(s) ||
        (q.profiles?.full_name ?? '').toLowerCase().includes(s) ||
        (q.courses?.title ?? '').toLowerCase().includes(s);
    })
    .sort((a, b) => {
      if (sortKey === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortKey === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortKey === 'replies') return (b.reply_count ?? 0) - (a.reply_count ?? 0);
      return (b.upvotes ?? 0) - (a.upvotes ?? 0); // most upvoted default
    });

  const tabCounts = {
    all: questions.length,
    unanswered: questions.filter(q => !q.is_answered).length,
    answered: questions.filter(q => q.is_answered).length,
    pinned: questions.filter(q => q.is_pinned).length,
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unanswered', label: 'Unanswered' },
    { key: 'answered', label: 'Answered' },
    { key: 'pinned', label: 'Pinned' },
  ];

  // ── Empty states ──────────────────────────────────────────────────────
  const renderEmpty = () => {
    if (activeTab === 'unanswered') {
      return (
        <MacCard>
          <div className="py-16 text-center">
            <MessageSquare className="mx-auto mb-4 h-9 w-9 text-[#28C840]" />
            <p className="text-[20px] font-bold text-[#28C840]">All caught up! 🎉</p>
            <p className="mt-2 text-[13px] text-[#6E6E73]">No unanswered questions.</p>
          </div>
        </MacCard>
      );
    }
    if (activeTab === 'pinned') {
      return (
        <MacCard>
          <div className="py-16 text-center">
            <Pin className="mx-auto mb-4 h-9 w-9 text-[#AEAEB2]" />
            <p className="text-[18px] font-semibold text-[#1D1D1F]">No pinned questions</p>
            <p className="mt-2 text-[13px] text-[#6E6E73]">Pin important questions so students can find them easily.</p>
          </div>
        </MacCard>
      );
    }
    return (
      <MacCard>
        <div className="py-24 text-center">
          <MessageSquare className="mx-auto mt-8 h-12 w-12 text-[#AEAEB2]" />
          <p className="mt-5 text-[22px] font-bold text-[#1D1D1F]">No questions yet</p>
          <p className="mx-auto mt-2 max-w-xs text-[14px] text-[#6E6E73]">
            Student questions will appear here once they start asking in your courses.
          </p>
        </div>
      </MacCard>
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] px-6 py-8 font-[DM_Sans,sans-serif]">
      <div className="mx-auto max-w-5xl">

        {/* Page Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-[26px] font-bold text-[#1D1D1F]">Q&amp;A</h1>
            <p className="mt-1 text-[13px] text-[#6E6E73]">Student questions across your courses</p>
          </div>
          {stats.unanswered > 0 && (
            <div className="flex items-center gap-2 rounded-full border border-[#FF5F57]/20 bg-[#FFF0EF] px-4 py-2">
              <AlertCircle className="h-3.5 w-3.5 text-[#FF5F57]" />
              <span className="text-[13px] font-semibold text-[#FF5F57]">{stats.unanswered} unanswered</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <QAStatsRow {...stats} />

        {/* Filters */}
        <div className="mb-5 flex flex-wrap items-center gap-3 sticky top-0 z-10 bg-[#F5F5F7] py-3 -my-3">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-[#1D1D1F] text-white'
                    : 'border border-[rgba(0,0,0,0.08)] bg-[#F5F5F7] text-[#6E6E73] hover:border-[rgba(0,0,0,0.16)]'
                }`}
              >
                {tab.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-[rgba(0,0,0,0.06)] text-[#6E6E73]'
                }`}>
                  {tabCounts[tab.key]}
                </span>
              </button>
            ))}
          </div>

          {/* Right filters */}
          <div className="ml-auto flex items-center gap-3">
            {/* Course filter */}
            <select
              value={courseFilter}
              onChange={e => setCourseFilter(e.target.value)}
              className="w-[180px] rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#F5F5F7] px-3 py-2 text-[13px] text-[#1D1D1F] focus:border-[rgba(0,0,0,0.2)] focus:outline-none"
            >
              <option value="all">All Courses</option>
              {instructorCourses.map((c: any) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortKey}
              onChange={e => setSortKey(e.target.value as SortKey)}
              className="w-[160px] rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#F5F5F7] px-3 py-2 text-[13px] text-[#1D1D1F] focus:border-[rgba(0,0,0,0.2)] focus:outline-none"
            >
              <option value="upvotes">Most Upvoted</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="replies">Most Replies</option>
            </select>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#AEAEB2]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search questions…"
                className="w-[200px] rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#F5F5F7] py-2 pl-9 pr-4 text-[13px] text-[#1D1D1F] placeholder:text-[#AEAEB2] focus:border-[rgba(0,0,0,0.2)] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Questions list */}
        {filtered.length === 0 ? (
          renderEmpty()
        ) : (
          <div className="space-y-4">
            {filtered.map(q => (
              <QuestionCard
                key={q.id}
                question={q}
                onAnswer={handleAnswer}
                onPin={handlePin}
                onMarkAnswered={handleMarkAnswered}
                onDelete={handleDelete}
                instructorId={userId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          color={toast.color}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
