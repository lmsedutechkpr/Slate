'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import {
  UserCheck,
  BookOpen,
  Package,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import PlatformStatsRow from './PlatformStatsRow';
import RevenueOverviewChart from './RevenueOverviewChart';
import SystemHealthCard from './SystemHealthCard';
import PendingApprovalsCard from './PendingApprovalsCard';
import RecentActivityFeed from './RecentActivityFeed';
import TrafficLights from '@/components/auth/TrafficLights';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface PlatformStats {
  totalUsers: number;
  totalStudents: number;
  totalInstructors: number;
  totalSellers: number;
  newThisMonth: number;
  totalRevenue: number;
  thisMonthRevenue: number;
  totalCourses: number;
  publishedCourses: number;
  pendingCourses: number;
  totalEnrollments: number;
  totalProducts: number;
  activeProducts: number;
  pendingProducts: number;
  totalUnitsSold: number;
  totalOrders: number;
  todayOrders: number;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
  orders: number;
}

interface PendingApproval {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
  avatar_url: string | null;
  created_at: string;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  amount?: number;
  role?: string;
  user?: any;
}

interface DashboardClientProps {
  platformStats: PlatformStats;
  monthlyRevenue: MonthlyRevenue[];
  pendingApprovals: PendingApproval[];
  recentActivity: Activity[];
}

// Helper component: Mac-style card
function MacCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] ${className}`}
    >
      {children}
    </div>
  );
}

// Helper component: Mac-style titlebar
function MacTitleBar({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex h-[44px] items-center gap-3 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
      <TrafficLights size="xs" />
      <span className="flex-1 font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">{title}</span>
      {right}
    </div>
  );
}

export default function DashboardClient({
  platformStats,
  monthlyRevenue,
  pendingApprovals: initialApprovals,
  recentActivity: initialActivity,
}: DashboardClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [pendingApprovals, setPendingApprovals] = useState(initialApprovals);
  const [recentActivity, setRecentActivity] = useState(initialActivity);
  const [stats, setStats] = useState(platformStats);

  // ─── Real-time Subscriptions ───
  useEffect(() => {
    const channel = supabase
      .channel('admin-dashboard')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profiles',
          filter: 'status=eq.pending_approval',
        },
        (payload: any) => {
          const newProfile = payload.new;
          if (newProfile.role === 'instructor' || newProfile.role === 'seller') {
            setPendingApprovals((prev) => [...prev, newProfile]);
            setStats((prev) => ({ ...prev, totalUsers: prev.totalUsers + 1 }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload: any) => {
          const newOrder = payload.new;
          setRecentActivity((prev) => [
            {
              id: `order-${newOrder.id}`,
              type: 'order',
              description: 'New order placed',
              timestamp: newOrder.created_at,
              amount: newOrder.total_amount,
            },
            ...prev.slice(0, 19),
          ]);
          setStats((prev) => ({
            ...prev,
            totalOrders: prev.totalOrders + 1,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Format date
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // User breakdown for donut chart
  const userBreakdown = [
    { name: 'Students', value: stats.totalStudents, color: '#1D1D1F' },
    { name: 'Instructors', value: stats.totalInstructors, color: '#3B82F6' },
    { name: 'Sellers', value: stats.totalSellers, color: '#28C840' },
  ];

  const totalPending = pendingApprovals.length;

  return (
    <div className="space-y-6">
      {/* ─── Page Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[DM_Sans] text-[26px] font-bold text-[#1D1D1F]">Platform Overview</h1>
          <p className="mt-1 font-[DM_Sans] text-[13px] text-[#6E6E73]">
            Welcome back · {formattedDate}
          </p>
        </div>

        {/* Alert Summary */}
        {totalPending > 0 && (
          <MacCard className="w-fit">
            <div className="bg-[#FFF8EC] px-5 py-3">
              <div className="flex items-center gap-2">
                <TrafficLights size="xs" />
              </div>
              <div className="mt-2 flex items-center gap-3">
                <AlertCircle className="h-4 w-4 text-[#FEBC2E]" />
                <span className="font-[DM_Sans] text-[14px] font-semibold text-[#1D1D1F]">
                  {totalPending} pending approvals
                </span>
                <button
                  onClick={() => router.push('/admin/users?status=pending')}
                  className="font-[DM_Sans] text-[13px] font-semibold text-[#FEBC2E] hover:underline"
                >
                  Review now →
                </button>
              </div>
            </div>
          </MacCard>
        )}
      </div>

      {/* ─── Platform Stats Row ─── */}
      <PlatformStatsRow stats={stats} />

      {/* ─── Revenue Chart + System Health ─── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueOverviewChart
            monthlyRevenue={monthlyRevenue}
            totalRevenue={stats.totalRevenue}
            thisMonthRevenue={stats.thisMonthRevenue}
          />
        </div>
        <SystemHealthCard />
      </div>

      {/* ─── Three Column Section ─── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Pending Approvals */}
        <PendingApprovalsCard approvals={pendingApprovals} onUpdate={(id) => {
          setPendingApprovals((prev) => prev.filter((a) => a.id !== id));
        }} />

        {/* User Breakdown */}
        <MacCard>
          <MacTitleBar title="User Breakdown" />
          <div className="p-5">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={userBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {userBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Center label */}
            <div className="relative -mt-[110px] mb-[110px] text-center">
              <p className="font-[DM_Sans] text-[22px] font-extrabold text-[#1D1D1F]">
                {stats.totalUsers}
              </p>
              <p className="text-[11px] text-[#AEAEB2]">users</p>
            </div>

            {/* Breakdown List */}
            <div className="mt-5 space-y-3">
              {userBreakdown.map((item) => (
                <div key={item.name}>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="flex-1 font-[DM_Sans] text-[13px] text-[#1D1D1F]">
                      {item.name}
                    </span>
                    <span className="font-[DM_Sans] text-[13px] font-bold text-[#1D1D1F]">
                      {item.value}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[rgba(0,0,0,0.06)]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(item.value / stats.totalUsers) * 100}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* New This Month */}
            <div className="mt-5 border-t border-[rgba(0,0,0,0.06)] pt-4">
              <p className="text-[11px] uppercase tracking-widest text-[#AEAEB2]">New this month</p>
              <p className="mt-1 font-[DM_Sans] text-[28px] font-extrabold text-[#28C840]">
                {stats.newThisMonth}
              </p>
              <p className="text-[12px] text-[#6E6E73]">users joined</p>
            </div>
          </div>
        </MacCard>

        {/* Recent Activity */}
        <RecentActivityFeed activities={recentActivity} />
      </div>

      {/* ─── Quick Actions Grid ─── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <button
          onClick={() => router.push('/admin/users?status=pending')}
          className="cursor-pointer text-left transition-all hover:scale-[1.02]"
        >
          <MacCard>
            <div className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(255,95,87,0.12)]">
                <UserCheck className="h-5 w-5 text-[#FF5F57]" />
              </div>
              <p className="mt-3 font-[DM_Sans] text-[15px] font-semibold text-[#1D1D1F]">
                Review Applications
              </p>
              <p className="mt-1 font-[DM_Sans] text-[11px] text-[#FEBC2E]">
                {totalPending} waiting
              </p>
            </div>
          </MacCard>
        </button>

        <button
          onClick={() => router.push('/admin/courses?status=pending')}
          className="cursor-pointer text-left transition-all hover:scale-[1.02]"
        >
          <MacCard>
            <div className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(59,130,246,0.12)]">
                <BookOpen className="h-5 w-5 text-[#3B82F6]" />
              </div>
              <p className="mt-3 font-[DM_Sans] text-[15px] font-semibold text-[#1D1D1F]">
                Approve Courses
              </p>
              <p className="mt-1 font-[DM_Sans] text-[11px] text-[#FEBC2E]">
                {stats.pendingCourses} pending
              </p>
            </div>
          </MacCard>
        </button>

        <button
          onClick={() => router.push('/admin/products?status=pending')}
          className="cursor-pointer text-left transition-all hover:scale-[1.02]"
        >
          <MacCard>
            <div className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(40,200,64,0.12)]">
                <Package className="h-5 w-5 text-[#28C840]" />
              </div>
              <p className="mt-3 font-[DM_Sans] text-[15px] font-semibold text-[#1D1D1F]">
                Approve Products
              </p>
              <p className="mt-1 font-[DM_Sans] text-[11px] text-[#FEBC2E]">
                {stats.pendingProducts} pending
              </p>
            </div>
          </MacCard>
        </button>

        <button
          onClick={() => router.push('/admin/payouts')}
          className="cursor-pointer text-left transition-all hover:scale-[1.02]"
        >
          <MacCard>
            <div className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(254,188,46,0.12)]">
                <DollarSign className="h-5 w-5 text-[#FEBC2E]" />
              </div>
              <p className="mt-3 font-[DM_Sans] text-[15px] font-semibold text-[#1D1D1F]">
                Process Payouts
              </p>
              <p className="mt-1 font-[DM_Sans] text-[11px] text-[#6E6E73]">
                Manage instructor + seller
              </p>
            </div>
          </MacCard>
        </button>
      </div>
    </div>
  );
}
