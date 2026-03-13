'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  BookOpen, Package, FileText, Radio, DollarSign,
  MessageSquare, Bell, CheckCheck, ArrowLeft,
} from 'lucide-react';
import { useNotificationStore, Notification } from '@/store/useNotificationStore';
import { useUIStore } from '@/store/useUIStore';
import { markNotificationsAsReadAction } from '@/app/actions/notifications';

interface Props {
  notifications: Notification[];
  userId: string;
}

const getIcon = (type: string) => {
  switch (type) {
    case 'course':    return { Icon: BookOpen,      bg: '#F3F4F6',            color: '#111827' };
    case 'order':     return { Icon: Package,       bg: 'rgba(40,200,64,0.1)', color: '#28C840' };
    case 'quiz':      return { Icon: FileText,      bg: 'rgba(254,188,46,0.1)',color: '#FEBC2E' };
    case 'live_class':return { Icon: Radio,         bg: 'rgba(255,95,87,0.1)', color: '#FF5F57' };
    case 'payout':    return { Icon: DollarSign,    bg: 'rgba(40,200,64,0.1)', color: '#28C840' };
    case 'message':   return { Icon: MessageSquare, bg: '#F3F4F6',            color: '#111827' };
    default:          return { Icon: Bell,          bg: '#F3F4F6',            color: '#111827' };
  }
};

export default function NotificationsPageClient({ notifications: initialNotifications, userId }: Props) {
  const router = useRouter();
  const { language } = useUIStore();
  const { notifications: storeNotifs, setNotifications, markRead, unreadCount, clearAll } = useNotificationStore();
  const displayNotifs = storeNotifs.length > 0 ? storeNotifs : initialNotifications;

  useEffect(() => {
    if (initialNotifications && storeNotifs.length === 0) {
      setNotifications(initialNotifications);
    }
  }, [initialNotifications, setNotifications, storeNotifs.length]);

  const handleMarkAllRead = async () => {
    clearAll();
    await markNotificationsAsReadAction(userId);
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.is_read) {
      markRead(notif.id);
      await markNotificationsAsReadAction(userId, notif.id);
    }
    if (notif.action_url) {
      router.push(notif.action_url);
    }
  };

  // Group notifications by date
  const groups: Record<string, Notification[]> = {};
  displayNotifs.forEach((n) => {
    const date = new Date(n.created_at);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    let label = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    if (date.toDateString() === today.toDateString()) label = 'Today';
    else if (date.toDateString() === yesterday.toDateString()) label = 'Yesterday';

    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  });

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-bold text-[18px] text-gray-900 leading-tight">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-[12px] text-gray-500">{unreadCount} unread</p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 hover:text-gray-900 transition-colors bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {displayNotifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-6 h-6 text-gray-400" />
            </div>
            <p className="font-semibold text-[16px] text-gray-900">No notifications yet</p>
            <p className="text-[13px] text-gray-500 mt-1">We'll notify you when something happens.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groups).map(([dateLabel, notifs]) => (
              <div key={dateLabel}>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                  {dateLabel}
                </p>
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <AnimatePresence>
                    {notifs.map((notif, idx) => {
                      const { Icon, bg, color } = getIcon(notif.type);
                      const title = language === 'ta' && notif.title_ta ? notif.title_ta : notif.title;
                      const message = language === 'ta' && notif.message_ta ? notif.message_ta : notif.message;
                      let timeAgo = '';
                      try { timeAgo = formatDistanceToNow(new Date(notif.created_at), { addSuffix: true }); } catch {}

                      return (
                        <motion.div
                          key={notif.id}
                          layout
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.97 }}
                          onClick={() => handleNotificationClick(notif)}
                          className={`relative flex items-start gap-4 px-4 py-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                            idx !== notifs.length - 1 ? 'border-b border-gray-100' : ''
                          }`}
                        >
                          {/* Unread left bar */}
                          {!notif.is_read && (
                            <div className="absolute left-0 top-3 bottom-3 w-[3px] bg-gray-900 rounded-r-full" />
                          )}

                          {/* Icon */}
                          <div
                            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center mt-0.5"
                            style={{ backgroundColor: bg }}
                          >
                            <Icon className="w-4 h-4" style={{ color }} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-[13px] leading-snug font-medium ${!notif.is_read ? 'text-gray-900' : 'text-gray-500'}`}>
                                {title}
                              </p>
                              {!notif.is_read && (
                                <div className="w-2 h-2 rounded-full bg-gray-900 flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="mt-0.5 text-[12px] text-gray-400 leading-snug">{message}</p>
                            <p className="mt-1.5 text-[11px] text-gray-400">{timeAgo}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
