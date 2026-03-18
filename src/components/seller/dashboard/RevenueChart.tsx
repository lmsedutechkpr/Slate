'use client';

import { useState, useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import TrafficLights from '@/components/auth/TrafficLights';

interface MonthlyRevenue {
  month: string;
  amount: number;
  orders: number;
}

interface RevenueChartProps {
  monthlyRevenue: MonthlyRevenue[];
}

type Period = '3M' | '6M' | '1Y';

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    const data = payload[0].payload as MonthlyRevenue;
    return (
      <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-3 py-2 shadow-sm">
        <p className="font-[DM_Sans] text-[14px] font-bold text-[#1D1D1F]">
          ₹{data.amount.toLocaleString('en-IN')}
        </p>
        <p className="text-[11px] text-[#6E6E73]">{label}</p>
        <p className="mt-1 border-t border-[rgba(0,0,0,0.06)] pt-1 text-[10px] font-medium text-[#AEAEB2]">
          {data.orders} orders
        </p>
      </div>
    );
  }
  return null;
};

export function RevenueChart({ monthlyRevenue }: RevenueChartProps) {
  const [period, setPeriod] = useState<Period>('6M');

  const filtered = useMemo(() => {
    const count = period === '3M' ? 3 : period === '6M' ? 6 : 12;
    return monthlyRevenue.slice(-count);
  }, [monthlyRevenue, period]);

  const totalRevenue = filtered.reduce((sum, d) => sum + d.amount, 0);
  const totalOrders = filtered.reduce((sum, d) => sum + d.orders, 0);
  
  const thisMonthData = filtered[filtered.length - 1];
  const thisMonthRevenue = thisMonthData?.amount || 0;
  
  const bestMonth = [...filtered].sort((a, b) => b.amount - a.amount)[0];
  const avgMonthly = filtered.length > 0 ? Math.round(totalRevenue / filtered.length) : 0;

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
      {/* Titlebar */}
      <div className="flex h-11 items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
        <TrafficLights size="sm" />
        <span className="ml-3 flex-1 font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">Revenue Overview</span>
        <div className="flex gap-1">
          {(['3M', '6M', '1Y'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-full px-3 py-1 font-[DM_Sans] text-[11px] font-semibold transition-colors ${
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
          <span className="font-[DM_Sans] text-[32px] font-extrabold text-[#1D1D1F]">
            ₹{thisMonthRevenue.toLocaleString('en-IN')}
          </span>
          <div className="mb-2 flex items-center gap-1 rounded-full bg-[#EDFAF0] px-2.5 py-1 text-[11px] font-semibold text-[#28C840]">
            <TrendingUp className="mr-0.5 h-[11px] w-[11px]" />
            <span>This Month</span>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filtered} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="rgba(0,0,0,0.04)" strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#AEAEB2', fontFamily: 'DM Sans' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#AEAEB2', fontFamily: 'DM Sans' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${v >= 1000 ? `${v / 1000}k` : v}`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {filtered.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === filtered.length - 1 ? '#1D1D1F' : '#AEAEB2'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Footer */}
        <div className="mt-5 flex flex-wrap items-center justify-between border-t border-[rgba(0,0,0,0.04)] pt-4">
          <div className="flex gap-4">
            <div>
              <p className="text-[11px] text-[#AEAEB2]">Best Month</p>
              <p className="font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
                {bestMonth?.month || '-'} (₹{bestMonth?.amount.toLocaleString('en-IN') || 0})
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[#AEAEB2]">Monthly Avg</p>
              <p className="font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
                ₹{avgMonthly.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-[#AEAEB2]">Total Period Orders</p>
            <p className="font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
              {totalOrders}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
