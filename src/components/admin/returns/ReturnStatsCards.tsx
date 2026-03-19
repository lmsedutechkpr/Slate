'use client';

import { CheckCircle2, Clock, Percent, RotateCcw, XCircle } from 'lucide-react';

function Card({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
      <div className="flex h-9 items-center gap-1 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-3">
        <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
        <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
        <span className="h-2 w-2 rounded-full bg-[#28C840]" />
      </div>
      <div className="p-4">
        <div className="mb-2 text-[#6E6E73]">{icon}</div>
        <p className={`text-[22px] font-bold ${color || 'text-[#1D1D1F]'}`}>{value}</p>
        <p className="text-[12px] text-[#6E6E73]">{label}</p>
      </div>
    </div>
  );
}

export default function ReturnStatsCards({
  stats,
}: {
  stats: {
    totalReturns: number;
    pendingReturns: number;
    approvedReturns: number;
    rejectedReturns: number;
    returnRate: number;
  };
}) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      <Card icon={<RotateCcw className="h-4 w-4" />} label="Total Returns" value={String(stats.totalReturns)} />
      <Card icon={<Clock className="h-4 w-4" />} label="Pending" value={String(stats.pendingReturns)} color="text-[#FEBC2E]" />
      <Card icon={<CheckCircle2 className="h-4 w-4" />} label="Approved" value={String(stats.approvedReturns)} color="text-[#28C840]" />
      <Card icon={<XCircle className="h-4 w-4" />} label="Rejected" value={String(stats.rejectedReturns)} color="text-[#FF5F57]" />
      <Card
        icon={<Percent className="h-4 w-4" />}
        label="Return Rate"
        value={`${stats.returnRate.toFixed(2)}%`}
        color={stats.returnRate > 5 ? 'text-[#FF5F57]' : 'text-[#1D1D1F]'}
      />
    </div>
  );
}
