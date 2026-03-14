'use client';

import { useState, useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import TrafficLights from '@/components/auth/TrafficLights';

interface MonthlyEarning {
  month: string;
  amount: number;
}

interface EarningsChartProps {
  monthlyEarnings: MonthlyEarning[];
}

type Period = '3M' | '6M' | '1Y';

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-3 py-2 shadow-sm">
        <p className="text-[14px] font-bold text-[#1D1D1F]">
          ₹{payload[0].value.toLocaleString('en-IN')}
        </p>
        <p className="text-[11px] text-[#6E6E73]">{label}</p>
      </div>
    );
  }
  return null;
};

export function EarningsChart({ monthlyEarnings }: EarningsChartProps) {
  const [period, setPeriod] = useState<Period>('6M');

  const filtered = useMemo(() => {
    const count = period === '3M' ? 3 : period === '6M' ? 6 : 12;
    return monthlyEarnings.slice(-count);
  }, [monthlyEarnings, period]);

  const total = filtered.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
      {/* Titlebar */}
      <div className="flex h-11 items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
        <TrafficLights size="sm" />
        <span className="ml-3 flex-1 text-[13px] font-semibold text-[#1D1D1F]">Earnings Overview</span>
        <div className="flex gap-1">
          {(['3M', '6M', '1Y'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                period === p
                  ? 'bg-[#1D1D1F] text-white'
                  : 'bg-[#F5F5F7] text-[#6E6E73] hover:bg-gray-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Callout */}
        <div className="mb-5 flex items-end gap-3">
          <span className="font-sans text-[32px] font-extrabold text-[#1D1D1F]">
            ₹{total.toLocaleString('en-IN')}
          </span>
          <div className="mb-1 flex items-center gap-1 rounded-full bg-[#EDFAF0] px-2.5 py-1 text-[11px] font-semibold text-[#28C840]">
            <TrendingUp className="h-[11px] w-[11px] mr-0.5" />
            <span>This Period</span>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filtered} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1D1D1F" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#1D1D1F" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(0,0,0,0.04)" strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#AEAEB2' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#AEAEB2' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${v >= 1000 ? `${v / 1000}k` : v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#1D1D1F"
                strokeWidth={2}
                fill="url(#earningsGradient)"
                dot={{ fill: '#1D1D1F', r: 4, strokeWidth: 0 }}
                activeDot={{ fill: '#1D1D1F', r: 6, stroke: 'white', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
