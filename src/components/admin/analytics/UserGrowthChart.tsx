'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

function WindowCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
      <div className="flex h-10 items-center justify-between border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-4">
        <div className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
          <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
          <span className="h-2 w-2 rounded-full bg-[#28C840]" />
        </div>
        <p className="text-[12px] font-semibold text-[#6E6E73]">{title}</p>
        <div className="w-8" />
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function UserGrowthChart({
  points,
  roleTotals,
}: {
  points: Array<{ month: string; students: number; instructors: number; sellers: number }>;
  roleTotals: { students: number; instructors: number; sellers: number; total: number };
}) {
  const recent = points.slice(-6);
  const breakdown = [
    { label: 'Students', value: roleTotals.students, color: '#1D1D1F' },
    { label: 'Instructors', value: roleTotals.instructors, color: '#3B82F6' },
    { label: 'Sellers', value: roleTotals.sellers, color: '#28C840' },
  ];

  return (
    <WindowCard title="New Users by Role">
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={recent}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6E6E73' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#6E6E73' }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="students" fill="#1D1D1F" radius={[4, 4, 0, 0]} />
            <Bar dataKey="instructors" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="sellers" fill="#28C840" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 space-y-2 text-[12px]">
        {breakdown.map((item) => {
          const pct = roleTotals.total > 0 ? (item.value / roleTotals.total) * 100 : 0;
          return (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#6E6E73]">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.label}</span>
              </div>
              <span className="font-semibold text-[#1D1D1F]">{item.value.toLocaleString('en-IN')} ({pct.toFixed(0)}%)</span>
            </div>
          );
        })}
      </div>
    </WindowCard>
  );
}
