'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell, CheckCheck, ArrowLeft, BookOpen, Users, DollarSign, Radio,
  MessageSquare, Info,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useNotificationStore, Notification } from '@/store/useNotificationStore';
import { markNotificationsAsReadAction } from '@/app/actions/notifications';
import { normalizeInstructorUrl } from '@/lib/normalizeInstructorUrl';

const NOTIF_ICONS: Record<string, { Icon: any; color: string; bg: string }> = {
  course:     { Icon: BookOpen,      bg: 'rgba(29,29,31,0.08)',   color: '#1D1D1F' },
  enrollment: { Icon: Users,         bg: 'rgba(40,200,64,0.12)',  color: '#28C840' },
  message:    { Icon: MessageSquare, bg: 'rgba(0,122,255,0.1)',   color: '#007AFF' },
  payout:     { Icon: DollarSign,    bg: 'rgba(40,200,64,0.12)',  color: '#28C840' },
  live_class: { Icon: Radio,         bg: 'rgba(255,95,87,0.1)',   color: '#FF5F57' },
  default:    { Icon: Info,          bg: 'rgba(0,0,0,0.06)',      color: '#6E6E73' },
};

function getIcon(type: string) {
  return NOTIF_ICONS[type] || NOTIF_ICONS.default;
}

function TL() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
      <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
      <div className="h-2 w-2 rounded-full bg-[#28C840]" />
    </div>
  );
}

interface Props {
  initialNotifications: Notification[];
  userId: string;
}

export default function InstructorNotificationsClient({ initialNotifications, userId }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const { notifications, unreadCount, setNotifications, addNotification, markRead, clearAll } = useNotificationStore();

  const displayNotifs = notifications.length > 0 ? notifications : initialNotifications;

  // Seed store
  useEffect(() => {
    if (initialNotifications.length > 0 && notifications.length === 0) {
      setNotifications(initialNotifications);
    }
  }, []);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`notif-page:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, payload => {
        addNotification(payload.new as any);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const handleMarkAll = async () => {
    clearAll();
    await markNotificationsAsReadAction(userId);
  };

  const handleClick = async (n: Notification) => {
    if (!n.is_read) {
      markRead(n.id);
      await markNotificationsAsReadAction(userId, n.id);
    }
    if (n.action_url) {
      router.push(normalizeInstructorUrl(n.action_url));
    }
  };

  // Group by date
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const groups: Record<string, Notification[]> = {};
  displayNotifs.forEach(n => {
    const d = new Date(n.created_at);
    let label = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    if (d.toDateString() === today) label = 'Today';
    else if (d.toDateString() === yesterday) label = 'Yesterday';
    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  });

  return (
    <div className="font-[DM_Sans]">
      {/* ─── Page header card ─── */}
      <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm overflow-hidden mb-6 sticky top-0 z-10">
        <div className="h-[44px] flex items-center justify-between border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
          <div className="flex items-center gap-3">
            <TL />
            <button
              onClick={() => router.back()}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-[rgba(0,0,0,0.08)] text-[#6E6E73] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-semibold text-[13px] text-[#1D1D1F]">Notifications</span>
            {unreadCount > 0 && (
              <span className="bg-[#FF5F57] text-white text-[10px] font-bold rounded-full px-2 py-0.5">
                {unreadCount} unread
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              className="flex items-center gap-1.5 text-[12px] font-medium text-[#6E6E73] hover:text-[#1D1D1F] border border-[rgba(0,0,0,0.1)] rounded-full px-3 py-1.5 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* ─── Notification Groups ─── */}
      {displayNotifs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 bg-[#F5F5F7] rounded-full flex items-center justify-center mb-4">
            <Bell className="w-6 h-6 text-[#AEAEB2]" />
          </div>
          <p className="font-semibold text-[16px] text-[#1D1D1F]">No notifications yet</p>
          <p className="text-[13px] text-[#6E6E73] mt-1">You'll see new enrollments, reviews, and payouts here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groups).map(([dateLabel, notifs]) => (
            <div key={dateLabel}>
              <p className="text-[11px] font-bold text-[#AEAEB2] uppercase tracking-wider mb-2 px-1">
                {dateLabel}
              </p>
              <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm overflow-hidden">
                {notifs.map((notif, idx) => {
                  const { Icon, bg, color } = getIcon(notif.type);
                  let timeAgo = '';
                  try { timeAgo = formatDistanceToNow(new Date(notif.created_at), { addSuffix: true }); } catch {}

                  return (
                    <button
                      key={notif.id}
                      onClick={() => handleClick(notif)}
                      className={`relative w-full flex items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-[#F5F5F7] ${
                        idx !== notifs.length - 1 ? 'border-b border-[rgba(0,0,0,0.05)]' : ''
                      } ${!notif.is_read ? 'bg-[#FAFAFA]' : ''}`}
                    >
                      {/* Unread bar */}
                      {!notif.is_read && (
                        <div className="absolute left-0 top-3 bottom-3 w-[3px] bg-[#1D1D1F] rounded-r-full" />
                      )}

                      {/* Icon */}
                      <div
                        className="w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center mt-0.5"
                        style={{ backgroundColor: bg }}
                      >
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-[13px] leading-snug ${!notif.is_read ? 'font-semibold text-[#1D1D1F]' : 'font-medium text-[#6E6E73]'}`}>
                            {notif.title}
                          </p>
                          {!notif.is_read && (
                            <div className="w-2 h-2 rounded-full bg-[#1D1D1F] flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        {notif.message && (
                          <p className="mt-0.5 text-[12px] text-[#AEAEB2] leading-snug line-clamp-2">
                            {notif.message}
                          </p>
                        )}
                        <p className="mt-1.5 text-[11px] text-[#AEAEB2]">{timeAgo}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
