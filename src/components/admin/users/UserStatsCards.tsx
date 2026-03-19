'use client';

import { Users, Clock, CheckCircle2, UserX } from 'lucide-react';
import TrafficLights from '@/components/auth/TrafficLights';

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  suspendedUsers: number;
  newThisMonth: number;
}

interface UserStatsCardsProps {
  stats: UserStats;
}

function StatCard({
  icon: Icon,
  value,
  label,
  subText,
  valueColor = 'text-[#1D1D1F]',
  subColor = 'text-[#6E6E73]',
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  subText?: string;
  valueColor?: string;
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
        <p className={`mt-3 font-[DM_Sans] text-[28px] font-extrabold ${valueColor}`}>
          {value}
        </p>
        <p className="mt-1 font-[DM_Sans] text-[12px] text-[#6E6E73]">{label}</p>
        {subText && (
          <p className={`mt-1 font-[DM_Sans] text-[11px] font-semibold ${subColor}`}>
            {subText}
          </p>
        )}
      </div>
    </div>
  );
}

export default function UserStatsCards({ stats }: UserStatsCardsProps) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {/* Total Users */}
      <StatCard
        icon={Users}
        value={stats.totalUsers}
        label="Total Users"
        subText={`+${stats.newThisMonth} this month`}
        subColor="text-[#28C840]"
      />

      {/* Pending Approval */}
      <StatCard
        icon={Clock}
        value={stats.pendingUsers}
        label="Pending Approval"
        valueColor={stats.pendingUsers > 0 ? 'text-[#FEBC2E]' : 'text-[#1D1D1F]'}
        subText="Awaiting review"
        subColor="text-[#6E6E73]"
      />

      {/* Active Users */}
      <StatCard
        icon={CheckCircle2}
        value={stats.activeUsers}
        label="Active Users"
        valueColor="text-[#28C840]"
      />

      {/* Suspended */}
      <StatCard
        icon={UserX}
        value={stats.suspendedUsers}
        label="Suspended"
        valueColor={stats.suspendedUsers > 0 ? 'text-[#FF5F57]' : 'text-[#1D1D1F]'}
      />
    </div>
  );
}
