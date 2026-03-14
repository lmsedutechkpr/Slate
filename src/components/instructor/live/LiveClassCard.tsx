import { useState, useEffect } from 'react';
import { 
  Radio, Clock, Timer, Users, Link as LinkIcon, Lock, 
  Pencil, Play, CheckCircle2 
} from 'lucide-react';
import TrafficLights from '@/components/auth/TrafficLights';
import { toast } from 'sonner';

interface LiveClassCardProps {
  liveClass: any;
  onEdit: (lc: any) => void;
  onCancel: (id: string) => void;
  onViewAttendees: (id: string) => void;
  onStart: (id: string) => void;
  onEnd: (id: string) => void;
}

export function LiveClassCard({
  liveClass, onEdit, onCancel, onViewAttendees, onStart, onEnd
}: LiveClassCardProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Update every minute for countdowns/durations
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const d = new Date(liveClass.scheduled_at);
  const isToday = d.toDateString() === now.toDateString();
  const timeDiffMins = (d.getTime() - now.getTime()) / 60000;
  // can start 15 mins before or any time after scheduled until it's actually started
  const canStart = timeDiffMins <= 15; 

  const copyLink = () => {
    if (liveClass.meeting_url) {
      navigator.clipboard.writeText(liveClass.meeting_url);
      toast.success('Meeting link copied to clipboard!');
    }
  };

  const getCardStyle = () => {
    const status = liveClass.computedStatus || liveClass.status;
    switch (status) {
      case 'live':
        return 'border-[#FF5F57]/40 bg-[#FFFAFA]';
      case 'completed':
        return 'border-[rgba(0,0,0,0.06)] opacity-90';
      case 'cancelled':
        return 'border-[rgba(0,0,0,0.06)] opacity-60';
      default: // scheduled
        return 'border-[rgba(0,0,0,0.08)] bg-white';
    }
  };

  const getStatusBadge = () => {
    const status = liveClass.computedStatus || liveClass.status;
    switch (status) {
      case 'live':
        return (
          <div className="flex items-center gap-1.5 rounded-full border border-[#FF5F57]/20 bg-[#FFF0EF] px-3 py-1">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF5F57]"></span>
            <span className="font-[DM_Sans] text-[11px] font-bold text-[#FF5F57]">LIVE</span>
          </div>
        );
      case 'completed':
        return (
          <div className="rounded-full border border-[#28C840]/20 bg-[#EDFAF0] px-3 py-1 font-[DM_Sans] text-[10px] font-semibold text-[#28C840]">
            COMPLETED
          </div>
        );
      case 'cancelled':
        return (
          <div className="rounded-full border border-[rgba(0,0,0,0.1)] bg-[#F5F5F7] px-3 py-1 font-[DM_Sans] text-[10px] font-semibold text-[#AEAEB2]">
            CANCELLED
          </div>
        );
      default:
        return (
          <div className="rounded-full border border-[#FEBC2E]/20 bg-[#FFF8EC] px-3 py-1 font-[DM_Sans] text-[10px] font-semibold text-[#FEBC2E]">
            UPCOMING
          </div>
        );
    }
  };

  return (
    <div className={`overflow-hidden rounded-2xl border shadow-sm transition-all hover:shadow-md ${getCardStyle()}`}>
      {/* TITLEBAR */}
      <div className="flex h-[44px] items-center justify-between border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
        <TrafficLights size="sm" />
        {getStatusBadge()}
      </div>

      {/* CONTENT */}
      <div className="p-5">
        
        {/* TOP ROW */}
        <div className="flex items-start gap-4">
          <div className="flex-1">
            {liveClass.courses && (
              <div className="mb-2 flex items-center gap-2">
                {liveClass.courses.thumbnail_url ? (
                  <img src={liveClass.courses.thumbnail_url} alt="" className="h-6 w-6 rounded object-cover" />
                ) : (
                  <div className="h-6 w-6 rounded bg-gray-200" />
                )}
                <span className="text-[11px] text-[#6E6E73]">{liveClass.courses.title}</span>
              </div>
            )}
            <h3 className="line-clamp-2 font-[DM_Sans] text-[16px] font-bold text-[#1D1D1F]">
              {liveClass.title}
            </h3>
          </div>

          <div className="shrink-0 text-right">
            {(liveClass.computedStatus || liveClass.status) === 'scheduled' && (
              <div className="min-w-[56px] rounded-xl bg-[#F5F5F7] p-3 text-center">
                <div className="font-[DM_Sans] text-[20px] font-bold leading-none text-[#1D1D1F]">
                  {d.getDate()}
                </div>
                <div className="mt-0.5 text-[10px] uppercase text-[#6E6E73]">
                  {d.toLocaleString('default', { month: 'short' })}
                </div>
                <div className="text-[10px] text-[#AEAEB2]">
                  {d.getFullYear()}
                </div>
              </div>
            )}

            {(liveClass.computedStatus || liveClass.status) === 'live' && liveClass.started_at && (
              <div className="font-[DM_Sans] text-[12px] font-semibold text-[#FF5F57]">
                Running {Math.floor((now.getTime() - new Date(liveClass.started_at).getTime()) / 60000)}m
              </div>
            )}

            {(liveClass.computedStatus || liveClass.status) === 'completed' && (
              <CheckCircle2 className="h-6 w-6 text-[#28C840]" />
            )}
          </div>
        </div>

        {/* META ROW */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-[#AEAEB2]" />
            <span className="text-[12px] text-[#6E6E73]">
              {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Timer className="h-3 w-3 text-[#AEAEB2]" />
            <span className="text-[12px] text-[#6E6E73]">{liveClass.duration_mins} mins</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3 w-3 text-[#AEAEB2]" />
            <span className="text-[12px] text-[#6E6E73]">
              {liveClass.status === 'completed' || liveClass.status === 'cancelled' 
                ? `${liveClass.actual_attendees || 0} attended`
                : `${liveClass.actual_attendees || 0} / ${liveClass.max_attendees}`}
            </span>
          </div>
        </div>

        {/* MEETING LINK ROW */}
        {((liveClass.computedStatus || liveClass.status) === 'scheduled' || (liveClass.computedStatus || liveClass.status) === 'live') && liveClass.meeting_url && (
          <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-[#F5F5F7] px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <LinkIcon className="h-3 w-3 shrink-0 text-[#AEAEB2]" />
              <span className="truncate text-[12px] text-[#6E6E73]">{liveClass.meeting_url}</span>
            </div>
            <button 
              onClick={copyLink}
              className="group flex items-center justify-center p-1"
              title="Copy link"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#AEAEB2] transition-colors group-hover:text-[#1D1D1F]">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
            </button>
          </div>
        )}

        {liveClass.meeting_password && ((liveClass.computedStatus || liveClass.status) === 'scheduled' || (liveClass.computedStatus || liveClass.status) === 'live') && (
           <div className="mt-2 flex items-center gap-1.5 px-1">
             <Lock className="h-[11px] w-[11px] text-[#AEAEB2]" />
             <span className="text-[11px] text-[#6E6E73]">Password: {liveClass.meeting_password}</span>
           </div>
        )}

        <div className="my-4 h-px w-full bg-[rgba(0,0,0,0.06)]" />

        {/* ACTION ROW */}
        <div className="flex items-center gap-2">
          {(liveClass.computedStatus || liveClass.status) === 'scheduled' && (
            <>
              <button
                onClick={() => onStart(liveClass.id)}
                disabled={!canStart}
                className={`flex items-center rounded-full px-4 py-2 font-[DM_Sans] text-[12px] font-semibold transition-colors
                  ${canStart ? 'bg-[#1D1D1F] text-white hover:bg-[#333]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                `}
              >
                <Radio className="mr-1.5 h-3 w-3" />
                {canStart ? 'Start Session' : `Available in ${Math.max(1, Math.ceil(timeDiffMins / 60))}h`}
              </button>
              
              <button
                onClick={() => onEdit(liveClass)}
                className="flex items-center rounded-full border border-[rgba(0,0,0,0.1)] px-3 py-2 text-[12px] text-[#1D1D1F] transition-colors hover:bg-gray-50"
              >
                <Pencil className="h-3 w-3" />
              </button>

              <button
                onClick={() => onViewAttendees(liveClass.id)}
                className="flex items-center rounded-full border border-[rgba(0,0,0,0.1)] px-3 py-2 text-[12px] text-[#1D1D1F] transition-colors hover:bg-gray-50"
              >
                <Users className="mr-1.5 h-3 w-3" />
                {liveClass.actual_attendees || 0}
              </button>

              <button
                onClick={() => onCancel(liveClass.id)}
                className="ml-auto font-[DM_Sans] text-[12px] font-medium text-[#FF5F57] hover:underline"
              >
                Cancel
              </button>
            </>
          )}

          {(liveClass.computedStatus || liveClass.status) === 'live' && (
            <>
              <button
                onClick={() => window.open(liveClass.meeting_url, '_blank')}
                className="flex items-center rounded-full bg-[#FF5F57] px-5 py-2 font-[DM_Sans] text-[13px] font-bold text-white hover:bg-[#FF4A42]"
              >
                Join Now &rarr;
              </button>

              <button
                onClick={() => onEnd(liveClass.id)}
                className="ml-2 rounded-full border border-[#FF5F57]/30 px-4 py-2 text-[12px] text-[#FF5F57] hover:bg-[#FFF0EF]"
              >
                End Session
              </button>

              <button
                onClick={() => onViewAttendees(liveClass.id)}
                className="ml-auto flex items-center rounded-full border border-[rgba(0,0,0,0.1)] px-3 py-2 text-[12px] text-[#1D1D1F] transition-colors hover:bg-gray-50"
              >
                <Users className="mr-1.5 h-3 w-3" />
                {liveClass.actual_attendees || 0}
              </button>
            </>
          )}

          {(liveClass.computedStatus || liveClass.status) === 'completed' && (
            <>
              {liveClass.recording_url ? (
                <button
                  onClick={() => window.open(liveClass.recording_url, '_blank')}
                  className="flex items-center rounded-full border border-[rgba(0,0,0,0.1)] px-4 py-2 text-[12px] text-[#1D1D1F] hover:bg-gray-50"
                >
                  <Play className="mr-1.5 h-3 w-3" />
                  View Recording
                </button>
              ) : (
                <button
                  onClick={() => onEdit(liveClass)}
                  className="font-[DM_Sans] text-[12px] font-medium text-[#6E6E73] hover:text-[#1D1D1F] hover:underline"
                >
                  Add Recording URL
                </button>
              )}
              
              <span className="ml-auto text-[12px] text-[#AEAEB2]">
                {liveClass.actual_attendees || 0} students attended
              </span>
            </>
          )}

          {(liveClass.computedStatus || liveClass.status) === 'cancelled' && liveClass.cancelled_reason && (
             <span className="text-[12px] italic text-[#AEAEB2]">
               Reason: {liveClass.cancelled_reason}
             </span>
          )}
        </div>

      </div>
    </div>
  );
}
