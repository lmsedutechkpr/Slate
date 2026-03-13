"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import {
  LayoutDashboard,
  BookOpen,
  Radio,
  ShoppingBag,
  Package,
  Award,
  MessageSquare,
  Settings,
  LogOut,
  Compass,
  Bell,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import TrafficLights from "@/components/auth/TrafficLights";

const navItems = [
  { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "Browse Courses", href: "/student/courses/browse", icon: Compass },
  { label: "My Courses", href: "/student/courses", icon: BookOpen },
  { label: "Live Classes", href: "/student/live", icon: Radio },
  { label: "Shop", href: "/student/shop", icon: ShoppingBag },
  { label: "My Orders", href: "/student/orders", icon: Package },
  { label: "Certificates", href: "/student/certificates", icon: Award },
  { label: "Wishlist", href: "/student/wishlist", icon: Heart },
  { label: "Notifications", href: "/student/notifications", icon: Bell },
  { label: "Messages", href: "/student/messages", icon: MessageSquare },
];

interface StudentSidebarProps {
  className?: string;
  onNavigate?: () => void;
  serverProfile?: { full_name: string | null; avatar_url: string | null } | null;
}

export default function StudentSidebar({
  className,
  onNavigate,
  serverProfile,
}: StudentSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile: storeProfile, clear: clearAuth } = useAuthStore();
  const profile = serverProfile || storeProfile;
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { unreadCount: unreadNotifications } = useNotificationStore();

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      const supabase = createClient();
      const { count } = await supabase
        .from("conversations")
        .select("*", { count: "exact", head: true })
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .or(
          `and(participant_1.eq.${user.id},unread_count_p1.gt.0),and(participant_2.eq.${user.id},unread_count_p2.gt.0)`,
        );
      if (count !== null) setUnreadMessages(count);
    };

    fetchUnread();
  }, [user]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearAuth();
    router.push("/login");
  };

  return (
    <div
      className={cn(
        "flex h-full w-[240px] flex-col border-r border-gray-200 bg-white z-50",
        className,
      )}
    >
      {/* Top Section */}
      <div className="px-5 pb-3 pt-5">
        <div className="flex items-center gap-2.5">
          <TrafficLights size="sm" />
          <span className="font-sans text-[17px] font-bold tracking-tight text-gray-900">
            Slate
          </span>
        </div>
        <div className="mt-2 pl-[1px]">
          <span className="rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-[10px] font-medium tracking-wide text-gray-500 uppercase">
            Student
          </span>
        </div>
      </div>

      <div className="my-3 h-[1px] w-full bg-[rgba(255,255,255,0.07)]" />

      {/* Nav Section */}
      <div className="flex-1 overflow-y-auto px-3">
        <div className="mb-2 px-2 text-[10px] font-semibold tracking-[0.15em] text-gray-400 uppercase">
          Menu
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            // Because /student/courses is a prefix of /student/courses/browse,
            // we need exact match for parent, or startsWith for children, 
            // but be careful not to make both active.
            const isActive = item.href === '/student/courses' 
              ? pathname.startsWith('/student/courses') && !pathname.startsWith('/student/courses/browse')
              : pathname.startsWith(item.href);
              
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150",
                  isActive
                    ? "bg-gray-900 text-white font-medium shadow-sm rounded-xl"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                <item.icon className="h-[17px] w-[17px] currentColor" />
                <span className="text-[14px] font-medium">{item.label}</span>
                {item.label === "Messages" && unreadMessages > 0 && (
                  <span className="absolute right-2 top-3 h-[6px] w-[6px] rounded-full bg-[#FF5F57]" />
                )}
                {item.label === "Notifications" && unreadNotifications > 0 && (
                  <span className="absolute right-2 top-3 h-[6px] w-[6px] rounded-full bg-[#FF5F57]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="mt-auto border-t border-gray-200 px-3 pb-4 pt-3">
        <div className="flex items-center gap-3 px-2">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt="Avatar"
                fill
                className="object-cover"
              />
            ) : (
              <span className="text-[13px] font-semibold text-gray-900">
                {profile?.full_name?.charAt(0).toUpperCase() || "S"}
              </span>
            )}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate max-w-[120px] text-[13px] font-semibold text-gray-900">
              {profile?.full_name || "Student User"}
            </span>
            <span className="text-[11px] text-gray-400">Student</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between px-2">
          <Link
            href="/student/profile"
            onClick={onNavigate}
            className="flex items-center text-gray-400 transition-colors hover:text-gray-900"
          >
            <Settings className="h-[15px] w-[15px]" />
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center text-gray-400 transition-colors hover:text-gray-900"
          >
            <LogOut className="h-[15px] w-[15px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
