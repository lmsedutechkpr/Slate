'use client';

import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  ComposedChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Point = {
  month: string;
  revenue?: number;
  orderCount?: number;
  users?: number;
  students?: number;
  instructors?: number;
  sellers?: number;
  enrollments?: number;
};

function WindowCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
      <div className="flex h-11 items-center justify-between border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-4">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
          <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
          <span className="h-2 w-2 rounded-full bg-[#28C840]" />
        </div>
        <p className="text-[12px] font-semibold text-[#6E6E73]">{title}</p>
        <div className="w-10" />
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function PlatformGrowthChart({
  points,
}: {
  points: Point[];
}) {
  const [mode, setMode] = useState<'revenue' | 'users' | 'enrollments'>('revenue');

  const summary = useMemo(() => {
    const values = points.map((p) => {
      if (mode === 'revenue') return Number(p.revenue || 0);
      if (mode === 'users') return Number(p.users || 0);
      return Number(p.enrollments || 0);
    });
    const total = values.reduce((a, b) => a + b, 0);
    const peak = points[values.indexOf(Math.max(...values))]?.month || '-';
    const avg = values.length ? total / values.length : 0;
    const first = values[0] || 0;
    const last = values[values.length - 1] || 0;
    const growth = first > 0 ? ((last - first) / first) * 100 : (last > 0 ? 100 : 0);
    return { total, peak, avg, growth };
  }, [points, mode]);

  return (
    <WindowCard title="Platform Growth">
      <div className="mb-4 flex justify-end gap-2">
        {(['revenue', 'users', 'enrollments'] as const).map((key) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`rounded-full px-3 py-1.5 text-[12px] font-semibold capitalize ${
              mode === key ? 'bg-[#1D1D1F] text-white' : 'bg-[#F5F5F7] text-[#6E6E73]'
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          {mode === 'revenue' ? (
            <ComposedChart data={points}>
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1D1D1F" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#1D1D1F" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.08)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6E6E73' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#6E6E73' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#6E6E73' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#1D1D1F" fill="url(#revFill)" strokeWidth={2} />
              <Bar yAxisId="right" dataKey="orderCount" fill="rgba(0,0,0,0.10)" radius={[4, 4, 0, 0]} />
            </ComposedChart>
          ) : mode === 'users' ? (
            <AreaChart data={points}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.08)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6E6E73' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6E6E73' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="students" stackId="1" stroke="#1D1D1F" fill="#1D1D1F" fillOpacity={0.9} />
              <Area type="monotone" dataKey="instructors" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.8} />
              <Area type="monotone" dataKey="sellers" stackId="1" stroke="#28C840" fill="#28C840" fillOpacity={0.8} />
            </AreaChart>
          ) : (
            <AreaChart data={points}>
              <defs>
                <linearGradient id="enFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#28C840" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#28C840" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.08)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6E6E73' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6E6E73' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="enrollments" stroke="#28C840" fill="url(#enFill)" strokeWidth={2} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-[#F5F5F7] p-4 text-[12px] text-[#6E6E73] md:grid-cols-4">
        <div>
          <p className="font-semibold text-[#1D1D1F]">Peak Month</p>
          <p>{summary.peak}</p>
        </div>
        <div>
          <p className="font-semibold text-[#1D1D1F]">Total This Period</p>
          <p>{mode === 'revenue' ? `₹${Math.round(summary.total).toLocaleString('en-IN')}` : Math.round(summary.total).toLocaleString('en-IN')}</p>
        </div>
        <div>
          <p className="font-semibold text-[#1D1D1F]">Avg Per Month</p>
          <p>{mode === 'revenue' ? `₹${Math.round(summary.avg).toLocaleString('en-IN')}` : Math.round(summary.avg).toLocaleString('en-IN')}</p>
        </div>
        <div>
          <p className="font-semibold text-[#1D1D1F]">Growth</p>
          <p className={summary.growth >= 0 ? 'text-[#28C840]' : 'text-[#FF5F57]'}>{summary.growth >= 0 ? '+' : ''}{summary.growth.toFixed(1)}%</p>
        </div>
      </div>
    </WindowCard>
  );
}
