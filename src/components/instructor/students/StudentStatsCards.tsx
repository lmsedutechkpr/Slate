'use client';
import { Users, TrendingUp, Award, UserPlus } from 'lucide-react';
import TrafficLights from '@/components/auth/TrafficLights';

interface Props {
  stats: {
    totalStudents: number;
    avgCompletion: number;
    completionRate: number;
    newThisMonth: number;
  };
}

export function StudentStatsCards({ stats }: Props) {
  const { totalStudents, avgCompletion, completionRate, newThisMonth } = stats;

  const cards = [
    {
      icon: <Users className="h-4 w-4 text-[#6E6E73]" />,
      value: totalStudents.toString(),
      label: 'Total Students',
      trend: newThisMonth > 0 ? `+${newThisMonth} this month` : null,
    },
    {
      icon: <TrendingUp className="h-4 w-4 text-[#6E6E73]" />,
      value: `${avgCompletion}%`,
      label: 'Avg Completion',
      progress: avgCompletion,
    },
    {
      icon: <Award className="h-4 w-4 text-[#6E6E73]" />,
      value: `${completionRate}%`,
      label: 'Course Completion Rate',
    },
    {
      icon: <UserPlus className="h-4 w-4 text-[#6E6E73]" />,
      value: newThisMonth.toString(),
      label: 'New This Month',
      trend: newThisMonth > 0 ? `+${newThisMonth} enrolled` : 'None yet',
      trendPositive: newThisMonth > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
        >
          {/* Mac titlebar */}
          <div className="flex h-8 items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-4">
            <TrafficLights size="xs" />
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-semibold uppercase tracking-wide text-[#AEAEB2]">
                {card.label}
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F5F5F7]">
                {card.icon}
              </div>
            </div>

            <div className="text-[28px] font-bold text-[#1D1D1F] leading-none">{card.value}</div>

            {card.progress !== undefined && (
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[rgba(0,0,0,0.06)]">
                <div
                  className="h-full rounded-full bg-[#1D1D1F] transition-all"
                  style={{ width: `${card.progress}%` }}
                />
              </div>
            )}

            {card.trend && (
              <p className={`mt-2 text-[12px] font-medium ${card.trendPositive !== false ? 'text-[#28C840]' : 'text-[#AEAEB2]'}`}>
                {card.trend}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
