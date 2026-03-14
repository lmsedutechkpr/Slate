'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Radio, CalendarX, History, Bell, BellOff, CalendarPlus, Calendar, Clock, Users, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import LiveBadge from './LiveBadge';
import LiveClassCard from './LiveClassCard';
import CountdownTimer from './CountdownTimer';

interface LiveClass {
  id: string;
  title: string;
  title_ta?: string;
  description?: string;
  scheduled_at: string;
  duration_mins: number;
  status: string;
  max_attendees: number;
  actual_attendees: number;
  meeting_url?: string;
  recording_url?: string;
  courses?: {
    id: string;
    title: string;
    title_ta?: string;
    slug?: string;
    course_instructors?: { profiles?: { full_name?: string; avatar_url?: string } }[];
  };
}

interface LivePageClientProps {
  liveClasses: LiveClass[];
  enrolledCourseIds: string[];
  reminderIds: string[];
  userId: string;
  language?: string;
}

function generateICS(lc: LiveClass) {
  const start = new Date(lc.scheduled_at);
  const end = new Date(start.getTime() + lc.duration_mins * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Slate LMS//Live Class//EN',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
    `SUMMARY:${lc.title || ''}`,
    `DESCRIPTION:${lc.description || ''}`,
    `LOCATION:${lc.meeting_url || ''}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${lc.title.replace(/\s+/g, '-')}.ics`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function MacCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm ${className}`}>
      <div className="flex gap-1.5 items-center p-4 pb-0">
        <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
        <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
        <div className="h-2 w-2 rounded-full bg-[#28C840]" />
      </div>
      {children}
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <MacCard>
      <div className="flex flex-col items-center justify-center text-center px-8 py-14">
        <Icon className="w-9 h-9 text-gray-300 mx-auto mb-4" />
        <p className="text-[18px] font-semibold text-gray-700">{title}</p>
        <p className="text-[14px] text-gray-400 mt-2">{subtitle}</p>
      </div>
    </MacCard>
  );
}

type TabValue = 'live' | 'upcoming' | 'past';

export default function LivePageClient({
  liveClasses: initial,
  enrolledCourseIds,
  reminderIds: initialReminders,
  userId,
  language,
}: LivePageClientProps) {
  const [classes, setClasses] = useState<LiveClass[]>(initial);
  const [reminders, setReminders] = useState<Set<string>>(new Set(initialReminders));
  const [pastLimit, setPastLimit] = useState(20);
  const [now, setNow] = useState(new Date());
  const supabase = createClient();

  // Update current time every 30 seconds to trigger dynamic status changes
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const enrolledSet = new Set(enrolledCourseIds);

  // Compute exact transition times for each class
  const classStatus = classes.map(c => {
    const startObj = new Date(c.scheduled_at);
    const endObj = new Date(startObj.getTime() + c.duration_mins * 60000);
    const isPast = now > endObj;
    const isLive = now >= startObj && now <= endObj;
    const isUpcoming = now < startObj;
    
    // Explicit manual overrides have priority (e.g., cancelled or manually ended early)
    if (c.status === 'cancelled') return { ...c, computedStatus: 'past' };
    if (c.status === 'completed') return { ...c, computedStatus: 'past' };
    if (c.status === 'live') return { ...c, computedStatus: 'live' };

    // Otherwise use time-based assumption
    if (isPast) return { ...c, computedStatus: 'past' };
    if (isLive) return { ...c, computedStatus: 'live' };
    return { ...c, computedStatus: 'upcoming' };
  });

  const liveNow = classStatus.filter(c => c.computedStatus === 'live');
  const upcoming = classStatus
    .filter(c => c.computedStatus === 'upcoming')
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  const past = classStatus
    .filter(c => c.computedStatus === 'past')
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

  const [activeTab, setActiveTab] = useState<TabValue>(liveNow.length > 0 ? 'live' : 'upcoming');

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('live-classes-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_classes' }, (payload) => {
        const updated = payload.new as LiveClass;
        setClasses(prev => {
          const idx = prev.findIndex(c => c.id === updated.id);
          if (idx === -1) return prev;
          const next = [...prev];
          next[idx] = { ...next[idx], ...updated };
          return next;
        });
        if (updated.status === 'live') {
          toast(`${updated.title} is now LIVE!`, {
            style: { background: 'rgb(255,245,245)', border: '1px solid rgba(255,95,87,0.2)', color: '#FF5F57' },
          });
          setActiveTab('live');
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  const toggleReminder = useCallback(async (lc: LiveClass) => {
    const hasReminder = reminders.has(lc.id);
    if (hasReminder) {
      setReminders(prev => { const n = new Set(prev); n.delete(lc.id); return n; });
      toast.success('Reminder removed');
      await supabase.from('user_events')
        .delete()
        .eq('user_id', userId)
        .eq('event_type', 'live_reminder')
        .filter('metadata->>live_class_id', 'eq', lc.id);
    } else {
      setReminders(prev => new Set([...prev, lc.id]));
      toast.success("We'll remind you before this class");
      await supabase.from('user_events').insert({
        user_id: userId,
        event_type: 'live_reminder',
        metadata: { live_class_id: lc.id, scheduled_at: lc.scheduled_at }
      });
    }
  }, [reminders, supabase, userId]);

  const nextClass = upcoming[0];
  const nextInstructor = nextClass?.courses?.course_instructors?.[0]?.profiles;

  const tabs: { value: TabValue; label: string; count: number }[] = [
    { value: 'live', label: 'Live Now', count: liveNow.length },
    { value: 'upcoming', label: 'Upcoming', count: upcoming.length },
    { value: 'past', label: 'Past', count: past.length },
  ];

  return (
    <div>
      {/* BREADCRUMB */}
      <div className="flex items-center gap-1.5 text-[13px] text-gray-400 mb-6">
        <Link href="/student/dashboard" className="hover:text-gray-700 transition-colors">Dashboard</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-700 font-medium">Live Classes</span>
      </div>

      {/* PAGE HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900">
            Live Classes
          </h1>
          <p className="text-[14px] text-gray-500 mt-1">Join live sessions from your enrolled courses</p>
        </div>
        {liveNow.length > 0 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-4 py-2">
            <LiveBadge />
            <span className="text-[#FF5F57] text-[13px] font-semibold">{liveNow.length} Live Now</span>
          </div>
        )}
      </div>

      {/* TABS */}
      <div className="bg-white border border-gray-200 rounded-xl p-1 flex gap-1 mb-6 shadow-sm w-fit">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`rounded-lg text-[13px] font-medium px-5 py-2 transition-all flex items-center gap-1.5
              ${activeTab === tab.value
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {tab.label}
            <span className={`rounded-full px-2 py-0.5 text-[11px]
              ${activeTab === tab.value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ─── LIVE NOW ─── */}
        {activeTab === 'live' && (
          <motion.div key="live" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {liveNow.length === 0 ? (
              <EmptyState icon={Radio} title="No live classes right now" subtitle="Check the Upcoming tab to see what's coming next." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveNow.map(lc => (
                  <LiveClassCard key={lc.id} liveClass={lc} isEnrolled={lc.courses?.id ? enrolledSet.has(lc.courses.id) : false}
                    hasReminder={reminders.has(lc.id)} onToggleReminder={() => toggleReminder(lc)} variant="live" language={language} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ─── UPCOMING ─── */}
        {activeTab === 'upcoming' && (
          <motion.div key="upcoming" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {upcoming.length === 0 ? (
              <EmptyState icon={CalendarX} title="No upcoming classes" subtitle="Check back soon for new sessions." />
            ) : (
              <>
                {/* Hero Next Class */}
                {nextClass && (
                  <MacCard className="mb-6 p-0 overflow-hidden">
                    <div className="p-6 pt-2">
                      <div className="mt-4 flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="inline-flex items-center bg-amber-50 border border-amber-200 rounded-full px-3 py-1 mb-3">
                            <span className="text-[#FEBC2E] text-[11px] font-bold uppercase tracking-wide">Up Next</span>
                          </div>
                          <h2 className="text-[22px] font-bold text-gray-900 leading-snug">
                            {language === 'ta' && nextClass.title_ta ? nextClass.title_ta : nextClass.title}
                          </h2>
                          {nextClass.courses && (
                            <p className="text-[13px] text-gray-500 mt-1">{nextClass.courses.title}</p>
                          )}
                          {nextInstructor && (
                            <div className="flex items-center gap-2 mt-3">
                              {nextInstructor.avatar_url ? (
                                <img src={nextInstructor.avatar_url} className="w-6 h-6 rounded-full object-cover" alt="" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                                  {nextInstructor.full_name?.charAt(0)}
                                </div>
                              )}
                              <span className="text-[13px] text-gray-500">{nextInstructor.full_name}</span>
                            </div>
                          )}
                        </div>
                        <div className="shrink-0">
                          <CountdownTimer scheduledAt={nextClass.scheduled_at} />
                        </div>
                      </div>

                      <div className="mt-5 mb-5 h-px bg-gray-100" />

                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-[13px] text-gray-500">{format(new Date(nextClass.scheduled_at), "EEE, d MMM • h:mm a")}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-[13px] text-gray-500">{nextClass.duration_mins} mins</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-[13px] text-gray-500">{nextClass.actual_attendees}/{nextClass.max_attendees}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleReminder(nextClass)}
                            className="flex items-center gap-2 text-[13px] font-medium text-gray-600 border border-gray-200 rounded-full px-4 py-2 hover:border-gray-300 transition-colors"
                          >
                            {reminders.has(nextClass.id) ? (
                              <><BellOff className="w-4 h-4" /> Remove Reminder</>
                            ) : (
                              <><Bell className="w-4 h-4" /> Remind Me</>
                            )}
                          </button>
                          <button
                            onClick={() => generateICS(nextClass)}
                            className="flex items-center gap-2 text-[13px] text-gray-500 hover:text-gray-800 transition-colors"
                          >
                            <CalendarPlus className="w-4 h-4" />
                            Add to Calendar
                          </button>
                        </div>
                      </div>
                    </div>
                  </MacCard>
                )}

                {/* Grid: remaining upcoming */}
                {upcoming.slice(1).length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcoming.slice(1).map(lc => (
                      <LiveClassCard key={lc.id} liveClass={lc} isEnrolled={lc.courses?.id ? enrolledSet.has(lc.courses.id) : false}
                        hasReminder={reminders.has(lc.id)} onToggleReminder={() => toggleReminder(lc)} variant="upcoming" language={language} />
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* ─── PAST ─── */}
        {activeTab === 'past' && (
          <motion.div key="past" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {past.length === 0 ? (
              <EmptyState icon={History} title="No past classes yet" subtitle="Completed classes will appear here." />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {past.slice(0, pastLimit).map(lc => (
                    <LiveClassCard key={lc.id} liveClass={lc} isEnrolled={lc.courses?.id ? enrolledSet.has(lc.courses.id) : false}
                      hasReminder={reminders.has(lc.id)} onToggleReminder={() => toggleReminder(lc)} variant="past" language={language} />
                  ))}
                </div>
                {past.length > pastLimit && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={() => setPastLimit(n => n + 20)}
                      className="text-[13px] text-gray-600 border border-gray-200 rounded-full px-6 py-2.5 hover:bg-gray-50 transition-colors"
                    >
                      Load more
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
