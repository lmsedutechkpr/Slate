'use client';

import {
  Users,
  IndianRupee,
  BookOpen,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import TrafficLights from '@/components/auth/TrafficLights';

interface PlatformStats {
  totalUsers: number;
  newThisMonth: number;
  totalRevenue: number;
  thisMonthRevenue: number;
  totalCourses: number;
  pendingCourses: number;
  totalOrders: number;
  todayOrders: number;
  totalEnrollments: number;
  publishedCourses: number;
}

interface PlatformStatsRowProps {
  stats: PlatformStats;
}

// Helper component: KPI Card
function KpiCard({
  icon: Icon,
  value,
  label,
  subText,
  subColor = 'text-[#28C840]',
}: {
  icon: any;
  value: string;
  label: string;
  subText?: string;
  subColor?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
      {/* Titlebar */}
      <div className="flex h-[44px] items-center gap-3 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
        <TrafficLights size="xs" />
      </div>
      {/* Content */}
      <div className="p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F5F7]">
          <Icon className="h-5 w-5 text-[#1D1D1F]" />
        </div>
        <p className="mt-3 font-[DM_Sans] text-[28px] font-extrabold text-[#1D1D1F]">{value}</p>
        <p className="mt-1 font-[DM_Sans] text-[12px] text-[#6E6E73]">{label}</p>
        {subText && (
          <p className={`mt-1 font-[DM_Sans] text-[11px] font-semibold ${subColor}`}>{subText}</p>
        )}
      </div>
    </div>
  );
}

export default function PlatformStatsRow({ stats }: PlatformStatsRowProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {/* Total Users */}
      <KpiCard
        icon={Users}
        value={stats.totalUsers.toString()}
        label="Total Users"
        subText={`+${stats.newThisMonth} this month`}
        subColor="text-[#28C840]"
      />

      {/* Platform Revenue */}
      <KpiCard
        icon={IndianRupee}
        value={formatCurrency(stats.totalRevenue)}
        label="Platform Revenue"
        subText={`${formatCurrency(stats.thisMonthRevenue)} this month`}
        subColor="text-[#28C840]"
      />

      {/* Total Courses */}
      <KpiCard
        icon={BookOpen}
        value={stats.totalCourses.toString()}
        label="Total Courses"
        subText={stats.pendingCourses > 0 ? `${stats.pendingCourses} pending` : 'All approved'}
        subColor={stats.pendingCourses > 0 ? 'text-[#FEBC2E]' : 'text-[#28C840]'}
      />

      {/* Total Orders */}
      <KpiCard
        icon={ShoppingBag}
        value={stats.totalOrders.toString()}
        label="Total Orders"
        subText={`${stats.todayOrders} today`}
        subColor="text-[#1D1D1F]"
      />

      {/* Total Enrollments */}
      <KpiCard
        icon={TrendingUp}
        value={stats.totalEnrollments.toString()}
        label="Total Enrollments"
        subText={`across ${stats.publishedCourses} courses`}
        subColor="text-[#6E6E73]"
      />
    </div>
  );
}
