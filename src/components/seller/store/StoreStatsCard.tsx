'use client';

import { Star } from 'lucide-react';

interface Props {
  totalSales: number;
  totalRevenue: number;
  avgRating: number;
  productCount: number;
}

export default function StoreStatsCard({ totalSales, totalRevenue, avgRating, productCount }: Props) {
  const stats = [
    { value: totalSales.toLocaleString('en-IN'), label: 'Total Sales' },
    { value: `₹${totalRevenue.toLocaleString('en-IN')}`, label: 'Revenue' },
    { value: avgRating > 0 ? `${avgRating.toFixed(1)}★` : '—', label: 'Rating', color: 'text-[#FEBC2E]' },
    { value: productCount.toString(), label: 'Products' },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
      <div className="flex h-11 items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
          <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
          <div className="h-2 w-2 rounded-full bg-[#28C840]" />
        </div>
        <span className="ml-3 font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">Store Performance</span>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-[#F5F5F7] rounded-xl p-3 text-center">
              <p className={`font-[DM_Sans] text-[18px] font-extrabold ${stat.color || 'text-[#1D1D1F]'}`}>
                {stat.value}
              </p>
              <p className="text-[11px] text-[#6E6E73] mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
