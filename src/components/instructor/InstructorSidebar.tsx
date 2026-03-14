'use client';

import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Radio,
  MessageSquare,
  Mail,
  DollarSign,
  User,
  LogOut,
  Settings,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import TrafficLights from '@/components/auth/TrafficLights';
import { Link } from '@/i18n/navigation';

const navItems = [
  { label: 'Dashboard', href: '/instructor/dashboard', icon: LayoutDashboard },
  { label: 'My Courses', href: '/instructor/courses', icon: BookOpen },
  { label: 'Students', href: '/instructor/students', icon: Users },
  { label: 'Live Classes', href: '/instructor/live', icon: Radio },
  { label: 'Q&A', href: '/instructor/qa', icon: MessageSquare },
  { label: 'Messages', href: '/instructor/messages', icon: Mail },
  { label: 'Payouts', href: '/instructor/payouts', icon: DollarSign },
  { label: 'Notifications', href: '/instructor/notifications', icon: Bell },
  { label: 'Profile', href: '/instructor/profile', icon: User },
];

interface InstructorSidebarProps {
  className?: string;
  onNavigate?: () => void;
  serverProfile?: { full_name: string | null; avatar_url: string | null } | null;
}

export default function InstructorSidebar({ className, onNavigate, serverProfile }: InstructorSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile: storeProfile, clear: clearAuth } = useAuthStore();
  const profile = serverProfile || storeProfile;
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Subscribe to unread message count
  useEffect(() => {
    const supabase = createClient();
    let userId: string | null = null;

    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      userId = data.user.id;

      // Initial count of unread messages from all conversations
      supabase
        .from('conversations')
        .select('participant_1, participant_2, unread_count_p1, unread_count_p2')
        .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
        .then(({ data: convos }) => {
          if (!convos) return;
          const total = convos.reduce((sum, c) => {
            return sum + (c.participant_1 === userId ? (c.unread_count_p1 ?? 0) : (c.unread_count_p2 ?? 0));
          }, 0);
          setUnreadMessages(total);
        });

      // Realtime updates
      const ch = supabase.channel('sidebar-unread-instructor')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, (payload) => {
          if (!userId) return;
          const c = payload.new as any;
          const myUnread = c.participant_1 === userId ? (c.unread_count_p1 ?? 0) : (c.unread_count_p2 ?? 0);
          setUnreadMessages(prev => Math.max(0, prev + myUnread));
        })
        .subscribe();

      return () => { supabase.removeChannel(ch); };
    });
  }, []);


  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearAuth();
    router.push('/login');
  };

  return (
    <div
      className={cn(
        'flex h-full w-[220px] shrink-0 flex-col border-r border-[rgba(0,0,0,0.08)] bg-white',
        className
      )}
    >
      {/* Top Section */}
      <div className="p-5">
        <div className="flex items-center gap-2">
          <TrafficLights size="sm" />
          <p className="font-sans text-[20px] font-extrabold tracking-tight text-[#1D1D1F]">Slate</p>
        </div>
        <span className="mt-2 block w-fit rounded-full bg-[#F5F5F7] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#6E6E73]">
          Instructor
        </span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150',
                isActive
                  ? 'bg-[#1D1D1F] font-semibold text-white'
                  : 'text-[#6E6E73] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
              {item.href === '/instructor/messages' && unreadMessages > 0 && (
                <span className={`ml-auto flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                  isActive ? 'bg-white text-[#1D1D1F]' : 'bg-[#FF5F57] text-white'
                }`}>
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-[rgba(0,0,0,0.06)] p-4">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[#F5F5F7]">
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt="Avatar" fill className="object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[13px] font-semibold text-[#1D1D1F]">
                {profile?.full_name?.charAt(0).toUpperCase() || 'I'}
              </span>
            )}
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="max-w-[120px] truncate text-[13px] font-semibold text-[#1D1D1F]">
              {profile?.full_name || 'Instructor'}
            </span>
            <span className="text-[11px] text-[#AEAEB2]">Instructor</span>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between px-1">
          <button
            onClick={() => router.push('/instructor/profile')}
            className="text-[#AEAEB2] transition-colors hover:text-[#1D1D1F]"
          >
            <Settings className="h-[15px] w-[15px]" />
          </button>
          <button onClick={handleLogout} className="text-[#AEAEB2] transition-colors hover:text-[#1D1D1F]">
            <LogOut className="h-[15px] w-[15px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
