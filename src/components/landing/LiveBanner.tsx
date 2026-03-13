'use client';

import {useEffect, useState} from 'react';
import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import {createClient} from '@/lib/supabase/client';

type LiveClass = {
  id: string;
  title: string;
  meeting_url: string;
  actual_attendees: number;
  instructor_name: string;
  course_title: string;
};

type LiveClassQueryRow = {
  id: string;
  title: string;
  meeting_url: string;
  actual_attendees: number | null;
  profiles: Array<{full_name: string | null}> | null;
  courses: Array<{title: string | null}> | null;
};

type LiveClassRealtimeRow = {
  id: string;
  title: string | null;
  meeting_url: string | null;
  actual_attendees: number | null;
};

export default function LiveBanner() {
  const t = useTranslations('landing.liveBanner');
  const [liveClass, setLiveClass] = useState<LiveClass | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const load = async () => {
      try {
        const {data} = await supabase
          .from('live_classes')
          .select('id, title, scheduled_at, meeting_url, actual_attendees, status, profiles!live_classes_instructor_id_fkey(full_name), courses(title)')
          .eq('status', 'live')
          .order('started_at', {ascending: false})
          .limit(1)
          .maybeSingle();

        if (data) {
          const row = data as unknown as LiveClassQueryRow;
          setLiveClass({
            id: row.id,
            title: row.title,
            meeting_url: row.meeting_url,
            actual_attendees: row.actual_attendees ?? 0,
            instructor_name: row.profiles?.[0]?.full_name ?? t('instructor'),
            course_title: row.courses?.[0]?.title ?? t('course')
          });
        }
      } catch (error) {
        console.error('LiveBanner load error', error);
      }
    };

    load();

    const channel = supabase
      .channel('live-classes-public')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'live_classes',
          filter: 'status=eq.live'
        },
        (payload) => {
          const next = payload.new as LiveClassRealtimeRow;
          setLiveClass((prev) => ({
            id: next.id,
            title: next.title ?? prev?.title ?? t('liveClass'),
            meeting_url: next.meeting_url ?? prev?.meeting_url ?? '#',
            actual_attendees: next.actual_attendees ?? prev?.actual_attendees ?? 0,
            instructor_name: prev?.instructor_name ?? t('instructor'),
            course_title: prev?.course_title ?? t('course')
          }));
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [t]);

  if (!liveClass) return null;

  return (
    <motion.section
      initial={{opacity: 0, height: 0}}
      animate={{opacity: 1, height: 'auto'}}
      exit={{opacity: 0, height: 0}}
      transition={{duration: 0.35}}
      className="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-3"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        {/* Left: red dot + LIVE */}
        <div className="inline-flex items-center gap-2">
          <span className="h-[9px] w-[9px] animate-pulse rounded-full bg-[var(--traffic-red)]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--traffic-red)]">{t('live')}</span>
        </div>

        {/* Middle */}
        <div className="flex flex-1 flex-wrap items-center gap-2 text-[14px]">
          <span className="font-semibold text-[var(--text)]">{liveClass.title}</span>
          <span className="text-[13px] text-[var(--text-secondary)]">
            {t('with')} {liveClass.instructor_name} · {liveClass.course_title}
          </span>
          <span className="rounded-full bg-[rgba(255,95,87,0.1)] px-2 py-0.5 text-xs text-[var(--traffic-red)]">
            {t('watching', {count: liveClass.actual_attendees ?? 0})}
          </span>
        </div>

        {/* Right: Join Now */}
        <button
          type="button"
          onClick={() => window.open(liveClass.meeting_url, '_blank')}
          className="rounded-full bg-[var(--white-surface)] px-4 py-1.5 text-sm font-semibold text-[var(--white-text)] transition hover:bg-[rgba(0,0,0,0.8)]"
        >
          {t('joinNow')}
        </button>
      </div>
    </motion.section>
  );
}

