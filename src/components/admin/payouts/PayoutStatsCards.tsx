'use client';

import { Clock, CheckCircle2, GraduationCap, Store } from 'lucide-react';

function Card({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
      <div className="flex h-9 items-center gap-1 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-3">
        <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
        <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
        <span className="h-2 w-2 rounded-full bg-[#28C840]" />
      </div>
      <div className="p-4">
        <div className="mb-2 text-[#6E6E73]">{icon}</div>
        <p className={`text-[19px] font-bold ${valueClass || 'text-[#1D1D1F]'}`}>{value}</p>
        <p className="text-[12px] text-[#6E6E73]">{label}</p>
      </div>
    </div>
  );
}

export default function PayoutStatsCards({ stats }: { stats: any }) {
  const inr = (n: number) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

  return (
    <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Card icon={<Clock className="h-4 w-4" />} label="Total Pending" value={inr(stats.totalPending || 0)} valueClass="text-[#FEBC2E]" />
      <Card icon={<CheckCircle2 className="h-4 w-4" />} label="Total Paid Out" value={inr(stats.totalPaidOut || 0)} valueClass="text-[#28C840]" />
      <Card icon={<GraduationCap className="h-4 w-4" />} label="Instructors Waiting" value={String(stats.instructorsPending || 0)} />
      <Card icon={<Store className="h-4 w-4" />} label="Sellers Waiting" value={String(stats.sellersPending || 0)} />
    </div>
  );
}
