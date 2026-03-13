"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Menu, Search, Bell, ShoppingCart, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/store/useCartStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useUIStore } from "@/store/useUIStore";
// useAuthStore is intentionally not used for user here — setUser() is never called on client.
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { markNotificationsAsReadAction } from "@/app/actions/notifications";
import LiveSearch from "@/components/student/LiveSearch";

interface StudentTopbarProps {
  onMenuClick?: () => void;
}

export default function StudentTopbar({ onMenuClick }: StudentTopbarProps) {
  const router = useRouter();

  // user comes from session directly (useAuthStore.user is never populated on the client)
  const { count: cartCount, setCount: setCartCount } = useCartStore();
  const { unreadCount, notifications, addNotification, setNotifications } =
    useNotificationStore();
  const { language, setLanguage, setCartDrawerOpen } = useUIStore();

  // Load initial remote counts and set up real-time
  // NOTE: We use supabase.auth.getSession() directly instead of useAuthStore.user
  // because setUser() is never called on the client, so user is always null in the store.
  useEffect(() => {
    const supabase = createClient();
    let cartChannel: ReturnType<typeof supabase.channel> | null = null;
    let notifChannel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;

      // Setup Cart count
      const { count: cCount } = await supabase
        .from("cart_items")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      if (cCount !== null) setCartCount(cCount);

      // Setup Notification init
      const { data: notifs } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (notifs) setNotifications(notifs);

      // Setup Cart Realtime
      cartChannel = supabase
        .channel(`cart-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "cart_items",
            filter: `user_id=eq.${userId}`,
          },
          async () => {
            const { count } = await supabase
              .from("cart_items")
              .select("*", { count: "exact", head: true })
              .eq("user_id", userId);
            if (count !== null) setCartCount(count);
          },
        )
        .subscribe();

      // Setup Notification Realtime
      notifChannel = supabase
        .channel(`notifs-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            addNotification(
              payload.new as unknown as import("@/store/useNotificationStore").Notification,
            );
          },
        )
        .subscribe();
    };

    init();

    return () => {
      const supabaseCleanup = createClient();
      if (cartChannel) supabaseCleanup.removeChannel(cartChannel);
      if (notifChannel) supabaseCleanup.removeChannel(notifChannel);
    };
  }, [setCartCount, addNotification, setNotifications]);

  const handleLanguageToggle = async (lang: "en" | "ta") => {
    if (language === lang) return;
    setLanguage(lang);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase
      .from("user_preferences")
      .upsert({ user_id: session.user.id, language: lang });
  };

  const handleMarkAsRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    useNotificationStore.getState().markRead(id);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await markNotificationsAsReadAction(session.user.id, id);
  };

  const clearAllNotifications = async (e: React.MouseEvent) => {
    e.stopPropagation();
    useNotificationStore.getState().clearAll();
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await markNotificationsAsReadAction(session.user.id);
  };

  return (
    <div className="fixed left-0 right-0 top-0 z-40 flex h-[52px] items-center gap-4 border-b border-gray-200 bg-white/80 px-6 backdrop-blur-xl lg:left-[240px]">
      {/* Mobile Menu Toggle */}
      <button
        onClick={onMenuClick}
        className="block p-1 text-gray-500 hover:text-gray-900 transition-colors lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Center / Left Search */}
      <LiveSearch />

      {/* Right Controls */}
      <div className="ml-auto flex items-center gap-3">
        {/* Language Toggle */}
        <div className="flex items-center rounded-full bg-gray-100 p-0.5 shadow-inner">
          <button
            onClick={() => handleLanguageToggle("en")}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-200 ${
              language === "en"
                ? "bg-gray-900 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => handleLanguageToggle("ta")}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-200 ${
              language === "ta"
                ? "bg-gray-900 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            TA
          </button>
        </div>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="relative p-2 rounded-xl transition-colors hover:bg-gray-100 text-gray-500 hover:text-gray-900">
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#FF5F57] px-1 text-[9px] font-bold text-gray-900">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-[320px] p-0 border-gray-200 bg-white"
          >
            <div className="max-h-[350px] overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="flex flex-col">
                  <div className="flex justify-between items-center p-3 border-b border-gray-100 bg-gray-50/50">
                    <span className="text-[12px] font-medium text-gray-500">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={clearAllNotifications} className="text-[12px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Mark all read
                      </button>
                    )}
                  </div>
                  {notifications.map((notif) => (
                    <div key={notif.id} className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-0 group ${!notif.is_read ? 'bg-blue-50/30' : ''}`}>
                      <div className="flex justify-between gap-3 items-start">
                        <div className="flex-1">
                          <p className={`text-[13px] text-gray-900 ${!notif.is_read ? 'font-semibold' : 'font-medium'}`}>{notif.title}</p>
                          <p className="text-[12px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
                        </div>
                        {!notif.is_read && (
                          <button 
                            onClick={(e) => handleMarkAsRead(e, notif.id)}
                            className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full shrink-0 lg:opacity-0 group-hover:opacity-100 transition-opacity" 
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-[13px] text-gray-400">
                  No notifications yet
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Cart */}
        <button
          onClick={() => setCartDrawerOpen(true)}
          className="relative p-2 rounded-xl transition-colors hover:bg-gray-100 text-gray-500 hover:text-gray-900"
        >
          <ShoppingCart className="h-[18px] w-[18px]" />
          {cartCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#FF5F57] px-1 text-[9px] font-bold text-gray-900">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
