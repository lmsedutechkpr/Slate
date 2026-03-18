'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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

interface Product {
  id: string;
  name: string;
  images: string[] | null;
  revenue: number;
  units: number;
}

interface Props {
  products: Product[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as Product;
  return (
    <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-3 py-2 shadow-sm max-w-[180px]">
      <p className="font-[DM_Sans] text-[11px] font-semibold text-[#1D1D1F] mb-1 leading-snug">{d.name}</p>
      <p className="text-[12px] font-bold text-[#1D1D1F]">₹{d.revenue.toLocaleString('en-IN')}</p>
      <p className="text-[11px] text-[#AEAEB2]">{d.units} units sold</p>
    </div>
  );
};

export function TopProductsChart({ products }: Props) {
  const [metric, setMetric] = useState<'revenue' | 'units'>('revenue');

  const sorted = [...products]
    .sort((a, b) => (metric === 'revenue' ? b.revenue - a.revenue : b.units - a.units))
    .slice(0, 8);

  const top5 = sorted.slice(0, 5);

  return (
    <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-[0_2px_12px_rgba(0,0,0,0.08)] overflow-hidden h-full">
      <div className="h-[44px] flex items-center gap-3 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
        <TL />
        <span className="flex-1 font-[DM_Sans] font-semibold text-[13px] text-[#1D1D1F]">Top Products by Revenue</span>
        <div className="flex gap-1">
          {(['revenue', 'units'] as const).map(v => (
            <button
              key={v}
              onClick={() => setMetric(v)}
              className={`rounded-full px-3 py-1 font-[DM_Sans] text-[11px] font-semibold transition-colors ${
                metric === v ? 'bg-[#1D1D1F] text-white' : 'bg-[rgba(0,0,0,0.06)] text-[#6E6E73] hover:bg-gray-200'
              }`}
            >
              {v === 'revenue' ? 'By Revenue' : 'By Units'}
            </button>
          ))}
        </div>
      </div>
      <div className="p-5">
        {sorted.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center">
            <p className="text-[13px] text-[#AEAEB2]">No product data yet</p>
          </div>
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={sorted}
                margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#AEAEB2', fontFamily: 'DM Sans' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => metric === 'revenue' ? `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}` : `${v}`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fontSize: 11, fill: '#6E6E73', fontFamily: 'DM Sans' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => v.length > 18 ? v.slice(0, 18) + '…' : v}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                <Bar dataKey={metric} radius={[0, 4, 4, 0]} maxBarSize={24}>
                  {sorted.map((_, i) => (
                    <Cell key={i} fill="#1D1D1F" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top 5 rows */}
        {top5.length > 0 && (
          <div className="mt-4 space-y-2">
            {top5.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="font-[DM_Sans] font-extrabold text-[13px] text-[#AEAEB2] w-6 flex-shrink-0">#{i + 1}</span>
                <div className="w-8 h-8 rounded-lg bg-[#F5F5F7] overflow-hidden flex-shrink-0">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#E5E5EA]" />
                  )}
                </div>
                <span className="font-[DM_Sans] font-medium text-[12px] text-[#1D1D1F] flex-1 line-clamp-1">{p.name}</span>
                <span className="font-[DM_Sans] font-bold text-[13px] text-[#1D1D1F]">₹{p.revenue.toLocaleString('en-IN')}</span>
                <span className="text-[11px] text-[#AEAEB2] w-14 text-right">{p.units} sold</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
