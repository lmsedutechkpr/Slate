'use client';

import { MessageSquare, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import TrafficLights from '@/components/auth/TrafficLights';

interface Props {
  totalQuestions: number;
  unanswered: number;
  answered: number;
  thisWeek: number;
}

function StatCard({
  icon: Icon,
  value,
  label,
  valueColor,
}: {
  icon: any;
  value: number;
  label: string;
  valueColor?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
      {/* Mac titlebar */}
      <div className="flex h-9 items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-4">
        <TrafficLights size="sm" />
      </div>
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5F5F7]">
          <Icon className="h-4 w-4 text-[#6E6E73]" />
        </div>
        <div>
          <p className={`text-[22px] font-bold leading-none ${valueColor ?? 'text-[#1D1D1F]'}`}>
            {value}
          </p>
          <p className="mt-0.5 text-[12px] text-[#6E6E73]">{label}</p>
        </div>
      </div>
    </div>
  );
}

export function QAStatsRow({ totalQuestions, unanswered, answered, thisWeek }: Props) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard icon={MessageSquare} value={totalQuestions} label="Total Questions" />
      <StatCard
        icon={AlertCircle}
        value={unanswered}
        label="Unanswered"
        valueColor={unanswered > 0 ? 'text-[#FF5F57]' : undefined}
      />
      <StatCard
        icon={CheckCircle2}
        value={answered}
        label="Answered"
        valueColor={answered > 0 ? 'text-[#28C840]' : undefined}
      />
      <StatCard icon={Clock} value={thisWeek} label="This Week" />
    </div>
  );
}
