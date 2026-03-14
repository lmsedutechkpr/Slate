'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, Plus, Search, BookOpen, Users, GraduationCap, X,
  BookOpen as CourseIcon, MessageSquare, DollarSign, Radio, Bell as BellIcon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useNotificationStore } from '@/store/useNotificationStore';
import { formatDistanceToNow } from 'date-fns';
import { markNotificationsAsReadAction } from '@/app/actions/notifications';
import { normalizeInstructorUrl } from '@/lib/normalizeInstructorUrl';

const NOTIF_ICONS: Record<string, { Icon: any; color: string; bg: string }> = {
  course:     { Icon: CourseIcon,     bg: 'rgba(29,29,31,0.08)',   color: '#1D1D1F' },
  enrollment: { Icon: GraduationCap, bg: 'rgba(40,200,64,0.12)',  color: '#28C840' },
  message:    { Icon: MessageSquare,  bg: 'rgba(0,122,255,0.1)',   color: '#007AFF' },
  payout:     { Icon: DollarSign,     bg: 'rgba(40,200,64,0.12)',  color: '#28C840' },
  live_class: { Icon: Radio,          bg: 'rgba(255,95,87,0.1)',   color: '#FF5F57' },
  default:    { Icon: BellIcon,       bg: 'rgba(0,0,0,0.06)',      color: '#6E6E73' },
};

function getNotifIcon(type: string) {
  return NOTIF_ICONS[type] || NOTIF_ICONS.default;
}

/* ─── Search Result Types ─── */
interface SearchResult {
  id: string;
  type: 'course' | 'student';
  title: string;
  subtitle?: string;
  url: string;
}

export default function InstructorTopbar({ userId }: { userId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const { notifications, unreadCount, setNotifications, addNotification, markRead, clearAll } = useNotificationStore();

  // ── Search State ──
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // ── Notification State ──
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // ── Load initial notifications ──
  useEffect(() => {
    if (!userId) return;
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data && data.length > 0) setNotifications(data as any);
      });
  }, [userId]);

  // ── Real-time subscription for new notifications ──
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          addNotification(payload.new as any);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // ── Close dropdowns on outside click ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifPanel(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Real-time search (only THIS instructor's own courses + their enrolled students) ──
  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      // Get this instructor's course IDs first
      const { data: ciRows } = await supabase
        .from('course_instructors')
        .select('course_id')
        .eq('instructor_id', userId);

      const myCourseIds = (ciRows || []).map((r: any) => r.course_id);

      const [coursesRes, studentsRes] = await Promise.all([
        // Only search instructor's own courses
        myCourseIds.length > 0
          ? supabase
              .from('courses')
              .select('id, title, status')
              .in('id', myCourseIds)
              .ilike('title', `%${q}%`)
              .limit(5)
          : Promise.resolve({ data: [] }),
        // Only search students enrolled in this instructor's courses
        myCourseIds.length > 0
          ? supabase
              .from('enrollments')
              .select('profiles!student_id(id, full_name, display_name)')
              .in('course_id', myCourseIds)
              .limit(20)
          : Promise.resolve({ data: [] }),
      ]);

      const courseResults: SearchResult[] = (coursesRes.data || []).map((c: any) => ({
        id: c.id,
        type: 'course',
        title: c.title,
        subtitle: c.status === 'approved' ? 'Published' : c.status,
        url: `/instructor/courses/${c.id}`,
      }));

      // Deduplicate students and filter by query
      const seenStudents = new Set<string>();
      const studentResults: SearchResult[] = [];
      for (const row of (studentsRes.data || [])) {
        const p = (row as any).profiles;
        if (!p || seenStudents.has(p.id)) continue;
        const name: string = p.full_name || p.display_name || '';
        if (!name.toLowerCase().includes(q.toLowerCase())) continue;
        seenStudents.add(p.id);
        studentResults.push({
          id: p.id,
          type: 'student',
          title: name,
          subtitle: 'Student',
          url: `/instructor/students`,
        });
        if (studentResults.length >= 5) break;
      }

      setResults([...courseResults, ...studentResults]);
    } finally {
      setSearching(false);
    }
  }, [userId]);

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), 250);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  const handleMarkAll = async () => {
    clearAll();
    await markNotificationsAsReadAction(userId);
    setShowNotifPanel(false);
  };

  const handleNotifClick = async (notif: any) => {
    if (!notif.is_read) {
      markRead(notif.id);
      await markNotificationsAsReadAction(userId, notif.id);
    }
    setShowNotifPanel(false);
    if (notif.action_url) {
      router.push(normalizeInstructorUrl(notif.action_url));
    }
  };

  const displayNotifs = notifications.slice(0, 6);

  return (
    <div className="flex h-14 shrink-0 items-center gap-4 border-b border-[rgba(0,0,0,0.08)] bg-white px-6 relative z-40">

      {/* ─── Search ─── */}
      <div className="flex flex-1 items-center" ref={searchRef}>
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#AEAEB2]" />
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setShowSearch(true); }}
            onFocus={() => setShowSearch(true)}
            placeholder="Search students, courses..."
            className="w-full rounded-xl bg-[#F5F5F7] py-2 pl-9 pr-4 text-[13px] text-[#1D1D1F] placeholder:text-[#AEAEB2] focus:outline-none focus:ring-1 focus:ring-[rgba(0,0,0,0.15)]"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AEAEB2] hover:text-[#6E6E73]">
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Search Dropdown */}
          {showSearch && query.trim() && (
            <div className="absolute top-full mt-2 left-0 w-72 bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-lg overflow-hidden z-50">
              {searching ? (
                <div className="px-4 py-3 text-[12px] text-[#AEAEB2]">Searching...</div>
              ) : results.length === 0 ? (
                <div className="px-4 py-3 text-[12px] text-[#AEAEB2]">No results for &quot;{query}&quot;</div>
              ) : (
                <div className="divide-y divide-[rgba(0,0,0,0.05)]">
                  {results.map(r => (
                    <button
                      key={r.id}
                      onClick={() => { router.push(r.url); setShowSearch(false); setQuery(''); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F5F5F7] transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#F5F5F7] flex-shrink-0">
                        {r.type === 'course' ? <BookOpen className="w-4 h-4 text-[#6E6E73]" /> : <Users className="w-4 h-4 text-[#6E6E73]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[#1D1D1F] truncate">{r.title}</p>
                        {r.subtitle && <p className="text-[11px] text-[#AEAEB2]">{r.subtitle}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Right actions ─── */}
      <div className="ml-auto flex items-center gap-3">

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifPanel(v => !v)}
            className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F5F7] text-[#6E6E73] transition-colors hover:bg-gray-200"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#FF5F57] text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Panel */}
          {showNotifPanel && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-xl overflow-hidden z-50">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7]">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-[#FF5F57]" /><div className="h-2 w-2 rounded-full bg-[#FEBC2E]" /><div className="h-2 w-2 rounded-full bg-[#28C840]" />
                </div>
                <span className="font-semibold text-[13px] text-[#1D1D1F]">Notifications</span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAll} className="text-[11px] text-[#6E6E73] hover:text-[#1D1D1F] font-medium transition-colors">
                      Mark all read
                    </button>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="max-h-80 overflow-y-auto divide-y divide-[rgba(0,0,0,0.04)]">
                {displayNotifs.length === 0 ? (
                  <div className="py-8 text-center">
                    <Bell className="w-8 h-8 text-[#AEAEB2] mx-auto mb-2" />
                    <p className="text-[13px] text-[#AEAEB2]">No notifications yet</p>
                  </div>
                ) : (
                  displayNotifs.map(notif => {
                    const { Icon, bg, color } = getNotifIcon(notif.type);
                    let timeAgo = '';
                    try { timeAgo = formatDistanceToNow(new Date(notif.created_at), { addSuffix: true }); } catch {}
                    return (
                      <button
                        key={notif.id}
                        onClick={() => handleNotifClick(notif)}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#F5F5F7] ${!notif.is_read ? 'bg-[#FAFAFA]' : ''}`}
                      >
                        {!notif.is_read && <div className="absolute left-0 w-[3px] h-8 bg-[#1D1D1F] rounded-r-full mt-1" />}
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
                          <Icon className="w-4 h-4" style={{ color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[12px] leading-snug ${notif.is_read ? 'text-[#6E6E73]' : 'font-semibold text-[#1D1D1F]'} line-clamp-2`}>
                            {notif.title}
                          </p>
                          <p className="text-[11px] text-[#AEAEB2] mt-0.5">{timeAgo}</p>
                        </div>
                        {!notif.is_read && <div className="w-2 h-2 rounded-full bg-[#1D1D1F] flex-shrink-0 mt-1.5" />}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-[rgba(0,0,0,0.06)] bg-[#F5F5F7]">
                <button
                  onClick={() => { setShowNotifPanel(false); router.push('/instructor/notifications'); }}
                  className="w-full text-center text-[12px] font-medium text-[#6E6E73] hover:text-[#1D1D1F] transition-colors"
                >
                  View all notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* New Course */}
        <button
          onClick={() => router.push('/instructor/courses/new')}
          className="flex items-center gap-1.5 rounded-full bg-[#1D1D1F] px-4 py-2 text-[12px] font-semibold text-white transition-all hover:opacity-80"
        >
          <Plus className="h-[13px] w-[13px]" />
          New Course
        </button>
      </div>
    </div>
  );
}
