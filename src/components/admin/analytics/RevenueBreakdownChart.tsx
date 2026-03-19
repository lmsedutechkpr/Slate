'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#1D1D1F', '#28C840', '#FEBC2E'];

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

export default function RevenueBreakdownChart({
  total,
  courseRevenue,
  productRevenue,
  fees,
}: {
  total: number;
  courseRevenue: number;
  productRevenue: number;
  fees: number;
}) {
  const data = [
    { label: 'Course Enrollments', value: Math.max(0, courseRevenue) },
    { label: 'Product Sales', value: Math.max(0, productRevenue) },
    { label: 'Platform Fees', value: Math.max(0, fees) },
  ];

  return (
    <WindowCard title="Revenue Sources">
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius={52} outerRadius={74} stroke="none">
              {data.map((entry, i) => (
                <Cell key={entry.label} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="-mt-24 mb-12 text-center">
        <p className="text-[11px] text-[#AEAEB2]">Total</p>
        <p className="text-[18px] font-bold text-[#1D1D1F]">₹{Math.round(total).toLocaleString('en-IN')}</p>
      </div>

      <div className="space-y-3">
        {data.map((row, i) => {
          const pct = total > 0 ? (row.value / total) * 100 : 0;
          return (
            <div key={row.label}>
              <div className="mb-1 flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2 text-[#6E6E73]">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span>{row.label}</span>
                </div>
                <span className="font-semibold text-[#1D1D1F]">₹{Math.round(row.value).toLocaleString('en-IN')} ({pct.toFixed(0)}%)</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[#F5F5F7]">
                <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i] }} />
              </div>
            </div>
          );
        })}
      </div>
    </WindowCard>
  );
}
