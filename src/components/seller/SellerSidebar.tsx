'use client';

import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { useState } from 'react';
import {
  LayoutDashboard, Package, ShoppingBag, RotateCcw,
  BarChart2, Store, DollarSign, User, LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import TrafficLights from '@/components/auth/TrafficLights';
import { Link } from '@/i18n/navigation';

const navItems = [
  { label: 'Dashboard',  href: '/seller/dashboard',  icon: LayoutDashboard },
  { label: 'Products',   href: '/seller/products',   icon: Package },
  { label: 'Orders',     href: '/seller/orders',     icon: ShoppingBag },
  { label: 'Returns',    href: '/seller/returns',    icon: RotateCcw },
  { label: 'Analytics',  href: '/seller/analytics',  icon: BarChart2 },
  { label: 'My Store',   href: '/seller/store',      icon: Store },
  { label: 'Payouts',    href: '/seller/payouts',    icon: DollarSign },
  { label: 'Profile',    href: '/seller/profile',    icon: User },
];

interface SellerSidebarProps {
  className?: string;
  serverProfile?: { full_name: string | null; avatar_url: string | null } | null;
  storeName?: string | null;
  storeLogo?: string | null;
}

export default function SellerSidebar({ className, serverProfile, storeName, storeLogo }: SellerSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile: storeProfile, clear: clearAuth } = useAuthStore();
  const profile = serverProfile || storeProfile;
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    clearAuth?.();
    router.push('/login');
  };

  const displayName = storeName || profile?.full_name || 'My Store';
  const avatarUrl = storeLogo || profile?.avatar_url;
  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <aside
      className={cn(
        'flex h-screen w-[220px] flex-shrink-0 flex-col border-r border-[rgba(0,0,0,0.08)] bg-white',
        className
      )}
    >
      {/* Logo area */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          </div>
          <p className="font-[DM_Sans] text-[20px] font-extrabold leading-none text-[#1D1D1F]">Slate</p>
        </div>
        <div className="mt-3">
          <span className="inline-block rounded-full bg-[#F5F5F7] px-2.5 py-0.5 font-[DM_Sans] text-[10px] font-bold uppercase tracking-widest text-[#6E6E73]">
            Seller
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-0.5">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <li key={href}>
                <Link
                  href={href as any}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 font-[DM_Sans] text-[13px] font-medium transition-all',
                    active
                      ? 'bg-[#1D1D1F] text-white'
                      : 'text-[#6E6E73] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]'
                  )}
                >
                  <Icon className="h-[15px] w-[15px] flex-shrink-0" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom profile */}
      <div className="border-t border-[rgba(0,0,0,0.08)] p-4">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-[#F5F5F7]">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={displayName} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[11px] font-bold text-[#6E6E73]">
                {initials}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-[DM_Sans] text-[12px] font-semibold text-[#1D1D1F]">{displayName}</p>
            <p className="text-[11px] text-[#AEAEB2]">seller</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#AEAEB2] transition-colors hover:bg-[#F5F5F7] hover:text-[#1D1D1F]"
            title="Sign out"
          >
            <LogOut className="h-[14px] w-[14px]" />
          </button>
        </div>
      </div>
    </aside>
  );
}
