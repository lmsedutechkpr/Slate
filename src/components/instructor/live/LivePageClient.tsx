'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Radio, Calendar, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { updateLiveClassAction } from '@/app/actions/live';
import { LiveStatsRow } from './LiveStatsRow';
import { LiveClassCard } from './LiveClassCard';
import { AttendeesDrawer } from './AttendeesDrawer';
import { toast } from 'sonner';

type Tab = 'live_now' | 'upcoming' | 'completed' | 'cancelled';

interface Props {
  liveClasses: any[];
  instructorCourses: any[];
  stats: any;
  userId: string;
}

export default function LivePageClient({ liveClasses: initialClasses, stats, userId }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [classes, setClasses] = useState(initialClasses);
  const [now, setNow] = useState(new Date());

  // Update current time every 30 seconds to trigger dynamic status changes
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  
  // Default to live_now if there's an active session, otherwise upcoming
  const [activeTab, setActiveTab] = useState<Tab>(
    initialClasses.some(c => c.status === 'live') ? 'live_now' : 'upcoming'
  );

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedClassTitle, setSelectedClassTitle] = useState('');

  // ── Stats state to trigger optimistic updates ──
  const [localStats, setLocalStats] = useState(stats);

  // ── Realtime Subscription ──
  useEffect(() => {
    const channel = supabase.channel('instructor-live')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'live_classes',
        filter: `instructor_id=eq.${userId}`
      }, (payload) => {
        setClasses(prev => prev.map(c => 
          c.id === payload.new.id ? { ...c, ...payload.new } : c
        ));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, userId]);

  // ── Actions ──
  const handleStart = async (id: string) => {
    const now = new Date().toISOString();
    setClasses(prev => prev.map(c => c.id === id ? { ...c, status: 'live', started_at: now } : c));
    setLocalStats((prev: any) => ({ ...prev, upcomingSessions: Math.max(0, prev.upcomingSessions - 1) }));
    setActiveTab('live_now');
    
    // Open meeting directly
    const targetClass = classes.find(c => c.id === id);
    if (targetClass?.meeting_url) {
      window.open(targetClass.meeting_url, '_blank');
    }

    const res = await updateLiveClassAction(id, { status: 'live', started_at: now });

    if (!res.success) {
      toast.error('Failed to start session');
      // Revert optimism if failed
    } else {
      toast.success('Session started! Students are being notified.', {
        style: { color: '#28C840' }
      });
    }
  };

  const handleEnd = async (id: string) => {
    if (!confirm('Are you sure you want to end this session?')) return;
    
    const now = new Date().toISOString();
    setClasses(prev => prev.map(c => c.id === id ? { ...c, status: 'completed', ended_at: now } : c));
    setActiveTab('completed');
    
    const res = await updateLiveClassAction(id, { status: 'completed', ended_at: now });

    if (!res.success) {
      toast.error('Failed to end session');
    } else {
      toast.success('Session ended.');
    }
  };

  const handleCancelAction = async (id: string) => {
    const reason = prompt('Please provide a reason for cancellation (optional):');
    if (reason === null) return; // User pressed cancel on the prompt

    setClasses(prev => prev.map(c => c.id === id ? { ...c, status: 'cancelled', cancelled_reason: reason } : c));
    setLocalStats((prev: any) => ({ ...prev, upcomingSessions: Math.max(0, prev.upcomingSessions - 1) }));
    setActiveTab('cancelled');

    const res = await updateLiveClassAction(id, { status: 'cancelled', cancelled_reason: reason });

    if (!res.success) {
      toast.error('Failed to cancel session');
    } else {
      toast.success('Class cancelled. Students have been notified.');
    }
  };

  const handleEdit = (lc: any) => {
    // Only URL edit currently supported in this compact implementation
    // A robust system would redirect to /new?edit=id with pre-filled form
    if (lc.status === 'completed' && !lc.recording_url) {
      const url = prompt('Enter the recording URL:');
      if (url) {
        setClasses(prev => prev.map(c => c.id === lc.id ? { ...c, recording_url: url } : c));
        updateLiveClassAction(lc.id, { recording_url: url }).then();
        toast.success('Recording URL saved');
      }
    } else {
      // Direct full edit form via query params
      router.push(`/instructor/live/new?edit=${lc.id}`);
    }
  };

  const handleViewAttendees = (id: string) => {
    const targetClass = classes.find(c => c.id === id);
    if (targetClass) {
      setSelectedClassId(id);
      setSelectedClassTitle(targetClass.title);
      setDrawerOpen(true);
    }
  };

  // ── Computed Status Logic ──
  const classStatus = classes.map(c => {
    const startObj = new Date(c.scheduled_at);
    const endObj = new Date(startObj.getTime() + c.duration_mins * 60000);
    const isPast = now > endObj;
    const isLive = now >= startObj && now <= endObj;
    const isUpcoming = now < startObj;
    
    if (c.status === 'cancelled') return { ...c, computedStatus: 'cancelled' };
    if (c.status === 'completed') return { ...c, computedStatus: 'completed' };
    if (c.status === 'live') return { ...c, computedStatus: 'live' };

    if (isPast) return { ...c, computedStatus: 'completed' };
    if (isLive) return { ...c, computedStatus: 'live' };
    return { ...c, computedStatus: 'scheduled' };
  });

  // ── Filtering ──
  const liveCount = classStatus.filter(c => c.computedStatus === 'live').length;
  const upcomingCount = classStatus.filter(c => c.computedStatus === 'scheduled').length;
  const completedCount = classStatus.filter(c => c.computedStatus === 'completed').length;
  const cancelledCount = classStatus.filter(c => c.computedStatus === 'cancelled').length;

  const currentList = classStatus.filter(c => {
    if (activeTab === 'live_now') return c.computedStatus === 'live';
    if (activeTab === 'upcoming') return c.computedStatus === 'scheduled';
    if (activeTab === 'completed') return c.computedStatus === 'completed';
    if (activeTab === 'cancelled') return c.computedStatus === 'cancelled';
    return true;
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-[DM_Sans] text-[26px] font-bold text-[#1D1D1F]">Live Classes</h1>
          <p className="mt-1 text-[13px] text-[#6E6E73]">Schedule and manage your live sessions</p>
        </div>
        <button
          onClick={() => router.push('/instructor/live/new')}
          className="flex items-center rounded-full bg-[#1D1D1F] px-5 py-2.5 font-[DM_Sans] text-[13px] font-semibold text-white transition-colors hover:bg-[#333]"
        >
          <Radio className="mr-2 h-[14px] w-[14px]" />
          Schedule Live Class
        </button>
      </div>

      {/* LIVE BANNER */}
      {liveCount > 0 && (
        <div className="mb-6 flex items-center gap-4 rounded-2xl border border-[#FF5F57]/30 bg-[#FFF0EF] px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 animate-pulse rounded-full bg-[#FF5F57]" />
            <span className="font-[DM_Sans] text-[15px] font-extrabold tracking-wide text-[#FF5F57]">YOU ARE LIVE</span>
          </div>
          <div className="flex-1 px-4">
            <div className="font-[DM_Sans] text-[14px] font-semibold text-[#1D1D1F]">
              {classStatus.find(c => c.computedStatus === 'live')?.title}
            </div>
            <div className="mt-0.5 text-[12px] text-[#6E6E73]">
              {classStatus.find(c => c.computedStatus === 'live')?.actual_attendees || 0} attendees watching
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => {
                const url = classStatus.find(c => c.computedStatus === 'live')?.meeting_url;
                if (url) window.open(url, '_blank');
              }}
              className="rounded-full bg-[#FF5F57] px-5 py-2.5 font-[DM_Sans] text-[13px] font-semibold text-white hover:bg-[#FF4A42]"
            >
              Join Session &rarr;
            </button>
            <button
              onClick={() => {
                const lc = classStatus.find(c => c.computedStatus === 'live');
                if (lc) handleEnd(lc.id);
              }}
              className="ml-2 rounded-full border border-[#FF5F57]/30 px-4 py-2.5 font-[DM_Sans] text-[13px] font-medium text-[#FF5F57] hover:bg-white"
            >
              End Session
            </button>
          </div>
        </div>
      )}

      {/* STATS */}
      <LiveStatsRow {...localStats} />

      {/* TABS */}
      <div className="mb-6 flex items-center space-x-2">
        <button
          onClick={() => setActiveTab('live_now')}
          className={`flex items-center rounded-full px-5 py-2 text-[13px] font-medium transition-all ${
            activeTab === 'live_now'
              ? 'bg-[#1D1D1F] text-white shadow-md'
              : 'bg-white text-[#6E6E73] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]'
          }`}
        >
          Live Now
          <span className={`ml-2 flex items-center justify-center rounded-full px-2 text-[11px] ${
            activeTab === 'live_now' ? 'bg-white/20 text-white' : 'bg-[#e5e5ea] text-[#8e8e93]'
          }`}>
            {liveCount}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex items-center rounded-full px-5 py-2 text-[13px] font-medium transition-all ${
            activeTab === 'upcoming'
              ? 'bg-[#1D1D1F] text-white shadow-md'
              : 'bg-white text-[#6E6E73] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]'
          }`}
        >
          Upcoming
          <span className={`ml-2 flex items-center justify-center rounded-full px-2 text-[11px] ${
            activeTab === 'upcoming' ? 'bg-white/20 text-white' : 'bg-[#e5e5ea] text-[#8e8e93]'
          }`}>
            {upcomingCount}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex items-center rounded-full px-5 py-2 text-[13px] font-medium transition-all ${
            activeTab === 'completed'
              ? 'bg-[#1D1D1F] text-white shadow-md'
              : 'bg-white text-[#6E6E73] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]'
          }`}
        >
          Completed
          <span className={`ml-2 flex items-center justify-center rounded-full px-2 text-[11px] ${
            activeTab === 'completed' ? 'bg-white/20 text-white' : 'bg-[#e5e5ea] text-[#8e8e93]'
          }`}>
            {completedCount}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('cancelled')}
          className={`flex items-center rounded-full px-5 py-2 text-[13px] font-medium transition-all ${
            activeTab === 'cancelled'
              ? 'bg-[#1D1D1F] text-white shadow-md'
              : 'bg-white text-[#6E6E73] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]'
          }`}
        >
          Cancelled
          <span className={`ml-2 flex items-center justify-center rounded-full px-2 text-[11px] ${
            activeTab === 'cancelled' ? 'bg-white/20 text-white' : 'bg-[#e5e5ea] text-[#8e8e93]'
          }`}>
            {cancelledCount}
          </span>
        </button>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {currentList.map(lc => (
          <LiveClassCard 
            key={lc.id} 
            liveClass={lc}
            onEdit={handleEdit}
            onCancel={handleCancelAction}
            onStart={handleStart}
            onEnd={handleEnd}
            onViewAttendees={handleViewAttendees}
          />
        ))}
      </div>

      {/* EMPTY STATES */}
      {classes.length === 0 && (
        <div className="mt-8 rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white py-24 text-center shadow-sm">
          <div className="mx-auto flex h-[44px] w-full items-center justify-between border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5 absolute top-0 left-0 right-0 rounded-t-2xl hidden">
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-[#FF5F57]"></div><div className="h-2 w-2 rounded-full bg-[#FEBC2E]"></div><div className="h-2 w-2 rounded-full bg-[#28C840]"></div></div>
          </div>
          <Radio className="mx-auto h-12 w-12 text-[#AEAEB2]" />
          <h2 className="mt-5 font-[DM_Sans] text-[22px] font-bold text-[#1D1D1F]">No live classes yet</h2>
          <p className="mx-auto mt-2 max-w-xs text-[14px] text-[#6E6E73]">
            Schedule your first live session and connect with your students in real time.
          </p>
          <button
            onClick={() => router.push('/instructor/live/new')}
            className="mt-8 rounded-full bg-[#1D1D1F] px-6 py-3 font-[DM_Sans] text-[14px] font-bold text-white hover:bg-[#333]"
          >
            + Schedule Live Class
          </button>
        </div>
      )}
      
      {classes.length > 0 && currentList.length === 0 && (
         <div className="col-span-1 lg:col-span-2 mt-8 text-center py-12">
           {activeTab === 'upcoming' && <Calendar className="mx-auto h-8 w-8 text-[#AEAEB2]" />}
           {activeTab === 'completed' && <CheckCircle2 className="mx-auto h-8 w-8 text-[#AEAEB2]" />}
           <p className="mt-3 text-[14px] text-[#6E6E73]">
             {activeTab === 'upcoming' ? 'No upcoming sessions.' : `No ${activeTab} sessions yet.`}
           </p>
         </div>
      )}

      {/* ATTENDEES DRAWER */}
      <AttendeesDrawer 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)}
        liveClassId={selectedClassId}
        liveClassTitle={selectedClassTitle}
      />
      
    </div>
  );
}
