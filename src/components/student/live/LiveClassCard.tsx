'use client';

import { useState } from 'react';
import { Calendar, Clock, Users, Bell, BellOff, CalendarPlus } from 'lucide-react';
import { format } from 'date-fns';
import LiveBadge from './LiveBadge';

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
    title: string;
    course_instructors?: { profiles?: { full_name?: string; avatar_url?: string } }[];
  };
}

interface LiveClassCardProps {
  liveClass: LiveClass;
  isEnrolled: boolean;
  hasReminder: boolean;
  onToggleReminder: () => void;
  variant: 'live' | 'upcoming' | 'past';
  language?: string;
}

function generateICS(lc: LiveClass) {
  const start = new Date(lc.scheduled_at);
  const end = new Date(start.getTime() + lc.duration_mins * 60 * 1000);

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Slate LMS//Live Class//EN',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${lc.title}`,
    `DESCRIPTION:${lc.description || ''}`,
    `LOCATION:${lc.meeting_url || ''}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${lc.title.replace(/\s+/g, '-')}.ics`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function LiveClassCard({
  liveClass,
  isEnrolled,
  hasReminder,
  onToggleReminder,
  variant,
  language,
}: LiveClassCardProps) {
  const title = language === 'ta' && liveClass.title_ta ? liveClass.title_ta : liveClass.title;

  const instructor =
    liveClass.courses?.course_instructors?.[0]?.profiles?.full_name;
  const courseTitle = liveClass.courses?.title;

  const scheduledDate = new Date(liveClass.scheduled_at);
  const dateStr = format(scheduledDate, "EEE, d MMM • h:mm a");

  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm p-4 flex flex-col
        ${hovered ? 'border-gray-300 -translate-y-1 shadow-md' : 'border-gray-200'}
      `}
    >
      {/* Mac Traffic Lights */}
      <div className="flex gap-1.5 items-center">
        <div className="h-1.5 w-1.5 rounded-full bg-[#FF5F57]" />
        <div className="h-1.5 w-1.5 rounded-full bg-[#FEBC2E]" />
        <div className="h-1.5 w-1.5 rounded-full bg-[#28C840]" />
      </div>

      {/* Top Row */}
      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Status Badge */}
          {variant === 'live' && (
            <div className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-full px-2.5 py-1 mb-2">
              <LiveBadge />
              <span className="text-[#FF5F57] text-[11px] font-bold tracking-wide">LIVE</span>
            </div>
          )}
          {variant === 'upcoming' && (
            <div className="inline-flex items-center bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 mb-2">
              <span className="text-[#FEBC2E] text-[11px] font-semibold tracking-wide">UPCOMING</span>
            </div>
          )}
          {variant === 'past' && (
            <div className="inline-flex items-center bg-gray-100 border border-gray-200 rounded-full px-2.5 py-1 mb-2">
              <span className="text-gray-400 text-[11px] font-semibold tracking-wide">COMPLETED</span>
            </div>
          )}

          {/* Title */}
          <p className="text-[15px] font-semibold text-gray-900 line-clamp-2 leading-snug">{title}</p>

          {/* Course + Instructor */}
          {(courseTitle || instructor) && (
            <p className="text-[13px] text-gray-400 mt-1.5">
              {[courseTitle, instructor].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        {/* Enrolled indicator */}
        {isEnrolled && (
          <div className="flex items-center gap-1 shrink-0 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#28C840]" />
            <span className="text-[10px] text-[#28C840] font-medium">Enrolled</span>
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="mt-3 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-gray-400" />
          <span className="text-[12px] text-gray-500">{dateStr}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-gray-400" />
          <span className="text-[12px] text-gray-500">{liveClass.duration_mins}m</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3 text-gray-400" />
          <span className="text-[12px] text-gray-500">{liveClass.actual_attendees}/{liveClass.max_attendees}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="mt-3 h-px bg-gray-100" />

      {/* Bottom Row */}
      <div className="mt-3 flex items-center justify-between gap-2">
        {variant === 'live' && (
          <>
            {liveClass.meeting_url ? (
              <button
                onClick={() => window.open(liveClass.meeting_url, '_blank')}
                className="bg-[#FF5F57] text-white text-[13px] font-semibold rounded-full px-5 py-2 hover:opacity-90 transition-opacity"
              >
                Join Now →
              </button>
            ) : (
              <button disabled className="bg-gray-100 text-gray-400 text-[13px] font-semibold rounded-full px-5 py-2 cursor-not-allowed">
                Link coming soon
              </button>
            )}
          </>
        )}

        {variant === 'upcoming' && (
          <>
            <button
              onClick={onToggleReminder}
              className="flex items-center gap-1.5 text-[12px] text-gray-500 border border-gray-200 rounded-full px-3 py-1.5 hover:border-gray-300 transition-colors"
            >
              {hasReminder ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
              {hasReminder ? 'Remove' : 'Remind Me'}
            </button>
            <button
              onClick={() => generateICS(liveClass)}
              title="Add to Calendar"
              className="text-gray-400 hover:text-gray-700 transition-colors"
            >
              <CalendarPlus className="w-[15px] h-[15px]" />
            </button>
          </>
        )}

        {variant === 'past' && (
          <>
            {liveClass.recording_url ? (
              <button
                onClick={() => window.open(liveClass.recording_url, '_blank')}
                className="text-[13px] text-gray-700 border border-gray-200 rounded-full px-4 py-1.5 hover:bg-gray-50 transition-colors"
              >
                Watch Recording
              </button>
            ) : (
              <span className="text-[12px] text-gray-400">No recording available</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
