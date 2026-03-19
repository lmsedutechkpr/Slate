'use client';

import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import TrafficLights from '@/components/auth/TrafficLights';

interface MonthlyRevenue {
  month: string;
  revenue: number;
  orders: number;
}

interface RevenueOverviewChartProps {
  monthlyRevenue: MonthlyRevenue[];
  totalRevenue: number;
  thisMonthRevenue: number;
}

export default function RevenueOverviewChart({
  monthlyRevenue,
  totalRevenue,
  thisMonthRevenue,
}: RevenueOverviewChartProps) {
  const [period, setPeriod] = useState<'3M' | '6M' | '1Y'>('1Y');

  // Filter data based on period
  const getFilteredData = () => {
    const now = new Date();
    let monthsAgo = 12;

    if (period === '3M') monthsAgo = 3;
    if (period === '6M') monthsAgo = 6;

    const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
    const cutoffString = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth() + 1).padStart(2, '0')}`;

    return monthlyRevenue.filter((d) => d.month >= cutoffString);
  };

  const filteredData = getFilteredData();

  // Format month for X-axis
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('en-US', { month: 'short', year: '2-digit' });
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return `₹${(value / 1000).toFixed(0)}k`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-white p-3 shadow-lg">
          <p className="font-[DM_Sans] text-[11px] text-[#AEAEB2]">
            {formatMonth(payload[0].payload.month)}
          </p>
          <p className="mt-1 font-[DM_Sans] text-[15px] font-bold text-[#1D1D1F]">
            ₹{payload[0].value.toLocaleString('en-IN')}
          </p>
          <p className="mt-0.5 font-[DM_Sans] text-[11px] text-[#6E6E73]">
            {payload[1]?.value || 0} orders
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
      {/* Titlebar */}
      <div className="flex h-[44px] items-center justify-between border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
        <div className="flex items-center gap-3">
          <TrafficLights size="xs" />
          <span className="font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
            Platform Revenue
          </span>
        </div>

        {/* Period Selector */}
        <div className="flex gap-1 rounded-full bg-white p-1">
          {(['3M', '6M', '1Y'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-full px-3 py-1 font-[DM_Sans] text-[11px] font-semibold transition-all ${
                period === p
                  ? 'bg-[#1D1D1F] text-white'
                  : 'text-[#6E6E73] hover:bg-[#F5F5F7]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Revenue Callout */}
        <div className="mb-5 flex items-end gap-4">
          <div>
            <p className="font-[DM_Sans] text-[36px] font-extrabold text-[#1D1D1F]">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </p>
            <p className="mt-0.5 text-[13px] text-[#AEAEB2]">All time</p>
          </div>

          <div className="mx-2 h-8 w-px bg-[rgba(0,0,0,0.08)]" />

          <div>
            <p className="font-[DM_Sans] text-[20px] font-bold text-[#1D1D1F]">
              ₹{thisMonthRevenue.toLocaleString('en-IN')}
            </p>
            <p className="mt-0.5 text-[12px] text-[#AEAEB2]">This month</p>
          </div>

          {/* Growth Badge */}
          <div className="ml-2 flex items-center gap-2 rounded-full bg-[#EDFAF0] px-3 py-1">
            <TrendingUp className="h-3 w-3 text-[#28C840]" />
            <span className="font-[DM_Sans] text-[11px] font-semibold text-[#28C840]">
              Growing
            </span>
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart
            data={filteredData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1D1D1F" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#1D1D1F" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="0"
              stroke="rgba(0,0,0,0.05)"
              horizontal={true}
              vertical={false}
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#AEAEB2', fontSize: 11, fontFamily: 'DM Sans' }}
              tickFormatter={formatMonth}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#AEAEB2', fontSize: 11, fontFamily: 'DM Sans' }}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#1D1D1F"
              strokeWidth={2}
              fill="url(#colorRevenue)"
            />
            <Line
              type="monotone"
              dataKey="orders"
              stroke="#FEBC2E"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="mt-4 flex gap-6">
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-8 bg-[#1D1D1F]" />
            <span className="font-[DM_Sans] text-[12px] text-[#6E6E73]">Platform Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-8 border-b-2 border-dashed border-[#FEBC2E]" />
            <span className="font-[DM_Sans] text-[12px] text-[#6E6E73]">Order Count</span>
          </div>
        </div>
      </div>
    </div>
  );
}
