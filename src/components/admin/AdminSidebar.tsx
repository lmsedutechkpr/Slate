'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Store,
  BookOpen,
  Package,
  Radio,
  ShoppingBag,
  RotateCcw,
  DollarSign,
  BarChart2,
  Settings,
  Shield,
  User,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import TrafficLights from '@/components/auth/TrafficLights';
import { Link } from '@/i18n/navigation';

// Section configuration with grouped nav items
const navSections = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'All Users', href: '/admin/users', icon: Users, badgeKey: 'users' },
      { label: 'Instructors', href: '/admin/users?role=instructor', icon: GraduationCap },
      { label: 'Sellers', href: '/admin/users?role=seller', icon: Store },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Courses', href: '/admin/courses', icon: BookOpen, badgeKey: 'courses' },
      { label: 'Products', href: '/admin/products', icon: Package, badgeKey: 'products' },
      { label: 'Live Classes', href: '/admin/live', icon: Radio },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
      { label: 'Returns', href: '/admin/returns', icon: RotateCcw },
      { label: 'Payouts', href: '/admin/payouts', icon: DollarSign },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Analytics', href: '/admin/analytics', icon: BarChart2 },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
      { label: 'Audit Logs', href: '/admin/audit', icon: Shield },
    ],
  },
];

interface AdminSidebarProps {
  className?: string;
  onNavigate?: () => void;
  serverProfile?: { full_name: string | null; avatar_url: string | null } | null;
  pendingCounts: {
    users: number;
    courses: number;
    products: number;
  };
}

export default function AdminSidebar({ className, onNavigate, serverProfile, pendingCounts }: AdminSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { profile: storeProfile, clear: clearAuth } = useAuthStore();
  const profile = serverProfile || storeProfile;

  const isItemActive = (href: string) => {
    const [basePath, rawQuery] = href.split('?');
    if (pathname !== basePath) {
      return false;
    }

    if (!rawQuery) {
      const hasRoleFilter = Boolean(searchParams.get('role'));
      if (basePath === '/admin/users' && hasRoleFilter) {
        return false;
      }
      return true;
    }

    const itemParams = new URLSearchParams(rawQuery);
    for (const [key, value] of itemParams.entries()) {
      if (searchParams.get(key) !== value) {
        return false;
      }
    }
    return true;
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearAuth();
    router.push('/login');
  };

  return (
    <div
      className={cn(
        'flex h-full w-[240px] shrink-0 flex-col border-r border-[rgba(0,0,0,0.08)] bg-white',
        className
      )}
    >
      {/* Top Section with RED Admin Badge */}
      <div className="p-5">
        <div className="flex items-center gap-2">
          <TrafficLights size="sm" />
          <p className="font-sans text-[20px] font-extrabold tracking-tight text-[#1D1D1F]">Slate</p>
        </div>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#FF5F57] bg-[rgba(255,95,87,0.12)] px-3 py-1">
          <div className="h-1.5 w-1.5 rounded-full bg-[#FF5F57]" />
          <span className="font-[DM_Sans] text-[10px] font-bold uppercase tracking-widest text-[#FF5F57]">
            Admin
          </span>
        </div>
      </div>

      {/* Nav Items with Sections */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navSections.map((section) => (
          <div key={section.label}>
            {/* Section Label */}
            <div className="mb-1 mt-5 px-3 text-[10px] font-semibold uppercase tracking-widest text-[#AEAEB2] first:mt-0">
              {section.label}
            </div>

            {/* Section Items */}
            {section.items.map((item) => {
              const isActive = isItemActive(item.href);
              const badgeCount = item.badgeKey ? pendingCounts[item.badgeKey as keyof typeof pendingCounts] : 0;

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
                  {badgeCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF5F57] px-1.5 text-[10px] font-bold text-white">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-[rgba(0,0,0,0.06)] p-4">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[#F5F5F7]">
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt="Avatar" fill className="object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[13px] font-semibold text-[#1D1D1F]">
                {profile?.full_name?.charAt(0).toUpperCase() || 'A'}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
              {profile?.full_name || 'Admin'}
            </p>
            <p className="text-[11px] text-[#AEAEB2]">Administrator</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-3 flex gap-2">
          <Link
            href="/admin/settings"
            className="flex h-8 flex-1 items-center justify-center gap-2 rounded-lg bg-[#F5F5F7] text-[12px] font-medium text-[#1D1D1F] transition-colors hover:bg-[rgba(0,0,0,0.08)]"
          >
            <Settings className="h-3.5 w-3.5" />
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="flex h-8 flex-1 items-center justify-center gap-2 rounded-lg bg-[#F5F5F7] text-[12px] font-medium text-[#FF5F57] transition-colors hover:bg-[rgba(255,95,87,0.12)]"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
