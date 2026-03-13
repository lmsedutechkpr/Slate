"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Package,
  FileText,
  Radio,
  DollarSign,
  MessageSquare,
  Bell,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  useNotificationStore,
  Notification,
} from "@/store/useNotificationStore";
import { useUIStore } from "@/store/useUIStore";
import { markNotificationsAsReadAction } from "@/app/actions/notifications";

interface RecentNotificationsProps {
  notifications: Notification[];
  userId: string;
  isPopover?: boolean;
}

export default function RecentNotifications({
  notifications: initialNotifications,
  userId,
  isPopover = false,
}: RecentNotificationsProps) {
  const router = useRouter();
  const { language } = useUIStore();

  // Local state vs global sync: The global store is primary, but we'll map from initial props until store hydraters
  const {
    notifications: storeNotifs,
    setNotifications,
    markRead,
    unreadCount,
    clearAll,
  } = useNotificationStore();
  const displayNotifs =
    storeNotifs.length > 0 ? storeNotifs : initialNotifications;

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

  const getIcon = (type: string) => {
    switch (type) {
      case "course":
        return {
          Icon: BookOpen,
          bg: "#F3F4F6", // gray-100
          color: "#111827", // gray-900
        };
      case "order":
        return { Icon: Package, bg: "rgba(40,200,64,0.1)", color: "#28C840" };
      case "quiz":
        return {
          Icon: FileText,
          bg: "rgba(254,188,46,0.1)",
          color: "#FEBC2E",
        };
      case "live_class":
        return { Icon: Radio, bg: "rgba(255,95,87,0.1)", color: "#FF5F57" };
      case "payout":
        return {
          Icon: DollarSign,
          bg: "rgba(40,200,64,0.1)",
          color: "#28C840",
        };
      case "message":
        return {
          Icon: MessageSquare,
          bg: "#F3F4F6",
          color: "#111827",
        };
      default:
        return { Icon: Bell, bg: "#F3F4F6", color: "#111827" };
    }
  };

  return (
    <div
      className={`flex flex-col ${isPopover ? "" : "h-full rounded-2xl border border-gray-200 bg-white p-5"}`}
    >
      <div
        className={`flex items-center justify-between ${isPopover ? "p-3 border-b border-gray-100" : "mb-4"}`}
      >
        <h2
          className={`font-sans font-semibold text-gray-900 ${isPopover ? "text-[15px]" : "text-[18px]"}`}
        >
          Notifications
        </h2>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-[12px] text-gray-500 transition-colors hover:text-gray-900"
          >
            Mark all read
          </button>
        )}
      </div>

      <div
        className={`flex-1 overflow-y-auto ${isPopover ? "max-h-[380px]" : ""}`}
      >
        <div className="flex flex-col">
          <AnimatePresence>
            {displayNotifs.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-gray-400">
                No notifications yet
              </div>
            ) : (
              displayNotifs.slice(0, isPopover ? 20 : 8).map((notif) => {
                const { Icon, bg, color } = getIcon(notif.type);
                const title =
                  language === "ta" && notif.title_ta
                    ? notif.title_ta
                    : notif.title;
                const message =
                  language === "ta" && notif.message_ta
                    ? notif.message_ta
                    : notif.message;

                let timeAgo = "";
                try {
                  timeAgo = formatDistanceToNow(new Date(notif.created_at), {
                    addSuffix: true,
                  });
                } catch {
                  // ignore invalid dates
                }

                return (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => handleNotificationClick(notif)}
                    className="relative flex cursor-pointer items-start gap-3 border-b border-gray-100 px-3 py-3 transition-colors hover:bg-gray-50"
                  >
                    {!notif.is_read && (
                      <div className="absolute bottom-1 left-0 top-1 w-1 rounded-r-full bg-gray-900/20" />
                    )}

                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: bg }}
                    >
                      <Icon className="h-[15px] w-[15px]" style={{ color }} />
                    </div>

                    <div className="flex flex-1 flex-col pr-4">
                      <span
                        className={`text-[13px] font-medium leading-snug line-clamp-1 ${!notif.is_read ? "text-gray-900" : "text-gray-500"}`}
                      >
                        {title}
                      </span>
                      <span className="mt-0.5 line-clamp-2 text-[12px] text-gray-400">
                        {message}
                      </span>
                      <span className="mt-1 text-[11px] text-gray-400">
                        {timeAgo}
                      </span>
                    </div>

                    {!notif.is_read && (
                      <div className="absolute right-3 top-4 h-[6px] w-[6px] shrink-0 rounded-full bg-gray-900" />
                    )}
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {isPopover && (
        <div className="border-t border-gray-100 p-2">
          <button
            onClick={() => router.push("/student/notifications")}
            className="w-full py-1 text-center text-[13px] text-gray-500 transition-colors hover:text-gray-900"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}
