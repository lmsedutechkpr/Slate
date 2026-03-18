'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useState } from 'react';

interface Props {
  monthlyData: { month: string; amount: number }[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-xl border border-[rgba(0,0,0,0.08)] shadow-md px-3 py-2">
        <div className="font-[DM_Sans] text-[14px] font-bold text-[#1D1D1F]">
          ₹{payload[0].value.toLocaleString('en-IN')}
        </div>
        <div className="text-[11px] text-[#6E6E73] mt-0.5">{label}</div>
      </div>
    );
  }
  return null;
}

export default function SellerRevenueChart({ monthlyData }: Props) {
  const [period, setPeriod] = useState<'3M' | '6M' | '1Y'>('6M');

  const sliceMap = { '3M': 3, '6M': 6, '1Y': 12 };
  const visible = monthlyData.slice(-sliceMap[period]);

  const best = visible.reduce((a, b) => (b.amount > a.amount ? b : a), { month: '—', amount: 0 });
  const avg = visible.length > 0
    ? Math.round(visible.reduce((s, m) => s + m.amount, 0) / visible.length)
    : 0;

  return (
    <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm overflow-hidden mb-6">
      {/* TITLEBAR */}
      <div className="h-[44px] flex items-center justify-between border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
            <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
            <div className="h-2 w-2 rounded-full bg-[#28C840]" />
          </div>
          <span className="font-[DM_Sans] font-semibold text-[13px] text-[#1D1D1F] ml-2">Monthly Revenue</span>
        </div>
        <div className="flex items-center gap-1">
          {(['3M', '6M', '1Y'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-full text-[11px] font-[DM_Sans] font-medium transition-all ${
                period === p
                  ? 'bg-[#1D1D1F] text-white'
                  : 'text-[#6E6E73] hover:bg-[rgba(0,0,0,0.05)]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* CHART */}
      <div className="p-5">
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={visible} barCategoryGap="35%">
              <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.06)" strokeDasharray="4 4" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#AEAEB2', fontFamily: 'DM Sans' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#AEAEB2', fontFamily: 'DM Sans' }}
                tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
                width={48}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
              <Bar dataKey="amount" fill="#1D1D1F" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* SUMMARY ROW */}
        <div className="mt-4 flex items-center justify-between border-t border-[rgba(0,0,0,0.05)] pt-4 px-1">
          <span className="text-[12px] text-[#6E6E73]">
            Best month: <span className="font-semibold text-[#1D1D1F]">{best.month}</span>{' '}
            ₹{best.amount.toLocaleString('en-IN')}
          </span>
          <span className="text-[12px] text-[#6E6E73]">
            Average: <span className="font-semibold text-[#1D1D1F]">₹{avg.toLocaleString('en-IN')}</span>/month
          </span>
        </div>
      </div>
    </div>
  );
}
