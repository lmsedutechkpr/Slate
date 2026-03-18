'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

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

const STATUS_COLORS: Record<string, string> = {
  confirmed: '#FEBC2E',
  processing: '#FFD580',
  shipped: '#3B82F6',
  delivered: '#28C840',
  cancelled: '#FF5F57',
  pending: '#AEAEB2',
  returned: '#6E6E73',
};

interface StatusData {
  status: string;
  count: number;
  percentage: number;
}

interface Props {
  data: StatusData[];
  totalOrders: number;
}

const CustomLabel = ({ cx, cy, totalOrders }: { cx: number; cy: number; totalOrders: number }) => (
  <>
    <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="middle" className="font-[DM_Sans]" style={{ fontSize: 22, fontWeight: 800, fill: '#1D1D1F', fontFamily: 'DM Sans' }}>
      {totalOrders}
    </text>
    <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 11, fill: '#AEAEB2', fontFamily: 'DM Sans' }}>
      orders
    </text>
  </>
);

export function OrderStatusChart({ data, totalOrders }: Props) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-[0_2px_12px_rgba(0,0,0,0.08)] overflow-hidden mb-4">
        <div className="h-[44px] flex items-center gap-3 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
          <TL /><span className="font-[DM_Sans] font-semibold text-[13px] text-[#1D1D1F]">Orders by Status</span>
        </div>
        <div className="p-5 text-center py-10">
          <p className="text-[13px] text-[#AEAEB2]">No orders yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-[0_2px_12px_rgba(0,0,0,0.08)] overflow-hidden mb-4">
      <div className="h-[44px] flex items-center gap-3 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
        <TL />
        <span className="font-[DM_Sans] font-semibold text-[13px] text-[#1D1D1F]">Orders by Status</span>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-4">
          {/* Donut */}
          <div className="h-[180px] w-[160px] flex-shrink-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="count"
                  isAnimationActive
                >
                  {data.map((d, i) => (
                    <Cell key={i} fill={STATUS_COLORS[d.status] ?? '#AEAEB2'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number, _: string, props: any) => [
                    `${v} orders (${props.payload.percentage}%)`,
                    props.payload.status,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-[DM_Sans] font-extrabold text-[22px] text-[#1D1D1F]">{totalOrders}</span>
              <span className="text-[11px] text-[#AEAEB2]">orders</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2">
            {data.map(d => (
              <div key={d.status} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[d.status] ?? '#AEAEB2' }} />
                <span className="text-[12px] text-[#1D1D1F] capitalize flex-1">{d.status}</span>
                <span className="text-[11px] text-[#AEAEB2]">{d.count} ({d.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
