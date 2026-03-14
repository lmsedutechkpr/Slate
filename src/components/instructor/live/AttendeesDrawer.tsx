import { useState, useEffect } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Users } from 'lucide-react';
import TrafficLights from '@/components/auth/TrafficLights';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface AttendeesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  liveClassId: string | null;
  liveClassTitle: string;
}

export function AttendeesDrawer({ isOpen, onClose, liveClassId, liveClassTitle }: AttendeesDrawerProps) {
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (isOpen && liveClassId) {
      loadAttendees();
    }
  }, [isOpen, liveClassId]);

  const loadAttendees = async () => {
    setLoading(true);
    // Fetch from user_events table based on metadata->>live_class_id
    const { data: events } = await supabase
      .from('user_events')
      .select(`
        user_id, created_at, metadata, event_type,
        profiles ( full_name, avatar_url )
      `)
      .in('event_type', ['live_join', 'live_reminder'])
      .order('created_at', { ascending: true });

    if (events) {
      // Filter manually for metadata->>live_class_id
      const filteredEvents = events.filter(ev => ev.metadata?.live_class_id === liveClassId);

      // Deduplicate by user_id
      const uniqueUsers = new Map();
      for (const ev of filteredEvents) {
        if (!uniqueUsers.has(ev.user_id)) {
          uniqueUsers.set(ev.user_id, {
            user_id: ev.user_id,
            joined_at: ev.created_at,
            profile: Array.isArray(ev.profiles) ? ev.profiles[0] : ev.profiles,
            event_type: ev.event_type
          });
        }
      }
      setAttendees(Array.from(uniqueUsers.values()));
    }
    setLoading(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-[380px] flex-col p-0 sm:max-w-[380px]">
        
        {/* HEADER */}
        <div className="border-b border-[rgba(0,0,0,0.06)] p-6">
          <div className="flex items-center gap-2">
            <TrafficLights size="sm" />
          </div>
          <h2 className="mt-3 line-clamp-1 font-[DM_Sans] text-[16px] font-bold text-[#1D1D1F]">
            {liveClassTitle}
          </h2>
          <div className="mt-1 text-[12px] text-[#6E6E73]">{attendees.length} attendees</div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="mt-8 flex justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#1D1D1F] border-t-transparent" />
            </div>
          ) : attendees.length === 0 ? (
            <div className="mt-8 text-center">
              <Users className="mx-auto h-8 w-8 text-[#AEAEB2]" />
              <p className="mt-3 text-[13px] text-[#6E6E73]">No attendee data available yet.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {attendees.map((att, i) => (
                <div key={att.user_id + i} className="flex items-center gap-3 border-b border-[rgba(0,0,0,0.05)] py-3 last:border-0">
                  {att.profile?.avatar_url ? (
                    <img src={att.profile.avatar_url} alt="" className="h-9 w-9 rounded-full bg-[#F5F5F7] object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F5F7] text-[12px] font-bold text-[#6E6E73]">
                      {(att.profile?.full_name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-[DM_Sans] text-[13px] font-medium text-[#1D1D1F]">
                      {att.profile?.full_name || 'Anonymous Student'}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[#AEAEB2]">
                      {att.event_type === 'live_join' ? 'Joined ' : 'Reminded '}
                      {formatDistanceToNow(new Date(att.joined_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </SheetContent>
    </Sheet>
  );
}
