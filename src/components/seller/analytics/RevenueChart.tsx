'use client';

import { useState } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

function TL({ size = 2 }: { size?: number }) {
  const s = `h-${size} w-${size}`;
  return (
    <div className="flex items-center gap-1.5">
      <div className={`${s} rounded-full bg-[#FF5F57]`} />
      <div className={`${s} rounded-full bg-[#FEBC2E]`} />
      <div className={`${s} rounded-full bg-[#28C840]`} />
    </div>
  );
}

interface DataPoint {
  month: string;
  revenue: number;
  orders: number;
}

interface Props {
  data: DataPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-3 py-2 shadow-sm">
      <p className="font-[DM_Sans] text-[11px] font-semibold text-[#AEAEB2] mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="font-[DM_Sans] text-[13px] font-bold" style={{ color: p.color === '#FEBC2E' ? '#FEBC2E' : '#1D1D1F' }}>
          {p.dataKey === 'revenue'
            ? `₹${Number(p.value).toLocaleString('en-IN')}`
            : `${p.value} orders`}
        </p>
      ))}
    </div>
  );
};

export function RevenueChart({ data }: Props) {
  const [toggle, setToggle] = useState<'both' | 'revenue' | 'orders'>('both');

  const bestMonth = [...data].sort((a, b) => b.revenue - a.revenue)[0];
  const avgMonthly = data.length > 0
    ? Math.round(data.reduce((s, d) => s + d.revenue, 0) / data.length)
    : 0;

  const showRevenue = toggle === 'both' || toggle === 'revenue';
  const showOrders = toggle === 'both' || toggle === 'orders';

  return (
    <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-[0_2px_12px_rgba(0,0,0,0.08)] overflow-hidden mb-6">
      <div className="h-[44px] flex items-center gap-3 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
        <TL />
        <span className="flex-1 font-[DM_Sans] font-semibold text-[13px] text-[#1D1D1F]">Revenue & Orders Over Time</span>
        <div className="flex gap-1">
          {(['both', 'revenue', 'orders'] as const).map(v => (
            <button
              key={v}
              onClick={() => setToggle(v)}
              className={`rounded-full px-3 py-1 font-[DM_Sans] text-[11px] font-semibold transition-colors capitalize ${
                toggle === v
                  ? 'bg-[#1D1D1F] text-white'
                  : 'bg-[rgba(0,0,0,0.06)] text-[#6E6E73] hover:bg-gray-200'
              }`}
            >
              {v === 'both' ? 'Both' : v === 'revenue' ? 'Revenue' : 'Orders'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5">
        {data.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center">
            <p className="text-[13px] text-[#AEAEB2]">No revenue data yet</p>
          </div>
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="rgba(0,0,0,0.04)" strokeDasharray="4 4" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#AEAEB2', fontFamily: 'DM Sans' }}
                  axisLine={false}
                  tickLine={false}
                />
                {showRevenue && (
                  <YAxis
                    yAxisId="rev"
                    orientation="left"
                    tick={{ fontSize: 11, fill: '#AEAEB2', fontFamily: 'DM Sans' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
                  />
                )}
                {showOrders && (
                  <YAxis
                    yAxisId="ord"
                    orientation="right"
                    tick={{ fontSize: 11, fill: '#AEAEB2', fontFamily: 'DM Sans' }}
                    axisLine={false}
                    tickLine={false}
                  />
                )}
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                {showRevenue && (
                  <Bar
                    yAxisId="rev"
                    dataKey="revenue"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                    fill="#1D1D1F"
                    opacity={0.85}
                    isAnimationActive
                  />
                )}
                {showOrders && (
                  <Line
                    yAxisId="ord"
                    type="monotone"
                    dataKey="orders"
                    stroke="#FEBC2E"
                    strokeWidth={2}
                    dot={{ fill: '#FEBC2E', r: 3, strokeWidth: 0 }}
                    isAnimationActive
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mt-5 bg-[#F5F5F7] rounded-xl p-4 flex flex-wrap items-center justify-around gap-4">
          <div className="text-center">
            <p className="text-[11px] text-[#AEAEB2]">Best Month</p>
            <p className="font-[DM_Sans] font-semibold text-[13px] text-[#1D1D1F] mt-0.5">
              {bestMonth?.month ?? '—'} · ₹{bestMonth?.revenue.toLocaleString('en-IN') ?? 0}
            </p>
          </div>
          <div className="w-px h-8 bg-[rgba(0,0,0,0.08)] hidden sm:block" />
          <div className="text-center">
            <p className="text-[11px] text-[#AEAEB2]">Monthly Average</p>
            <p className="font-[DM_Sans] font-semibold text-[13px] text-[#1D1D1F] mt-0.5">
              ₹{avgMonthly.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="w-px h-8 bg-[rgba(0,0,0,0.08)] hidden sm:block" />
          <div className="text-center">
            <p className="text-[11px] text-[#AEAEB2]">Total Months</p>
            <p className="font-[DM_Sans] font-semibold text-[13px] text-[#1D1D1F] mt-0.5">{data.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
