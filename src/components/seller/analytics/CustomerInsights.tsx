'use client';

import { Users, MapPin } from 'lucide-react';

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

interface CityData {
  city: string;
  state: string;
  count: number;
}

interface Props {
  uniqueCustomers: number;
  repeatBuyers: number;
  repeatRate: number;
  avgItemsPerOrder: number;
  topCities: CityData[];
}

export function CustomerInsights({ uniqueCustomers, repeatBuyers, repeatRate, avgItemsPerOrder, topCities }: Props) {
  const maxCityCount = Math.max(...topCities.map(c => c.count), 1);

  const insightColor = repeatRate > 20 ? '#28C840' : repeatRate >= 10 ? '#FEBC2E' : '#FF5F57';
  const insightMsg =
    repeatRate > 20
      ? 'Excellent! Your customers love coming back.'
      : repeatRate >= 10
      ? 'Good retention. Focus on post-purchase experience.'
      : 'Opportunity: engage customers after purchase.';

  return (
    <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-[0_2px_12px_rgba(0,0,0,0.08)] overflow-hidden mb-6">
      <div className="h-[44px] flex items-center gap-3 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
        <TL />
        <span className="font-[DM_Sans] font-semibold text-[13px] text-[#1D1D1F]">Customer Insights</span>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Col 1: Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: uniqueCustomers.toString(), label: 'Unique Customers', color: '' },
              { value: repeatBuyers.toString(), label: 'Repeat Buyers', color: 'text-[#28C840]' },
              { value: `${repeatRate.toFixed(1)}%`, label: 'Repeat Rate', color: '' },
              { value: avgItemsPerOrder.toFixed(1), label: 'Avg Items/Order', color: '' },
            ].map(({ value, label, color }) => (
              <div key={label} className="bg-[#F5F5F7] rounded-xl p-4 text-center">
                <p className={`font-[DM_Sans] font-bold text-[22px] text-[#1D1D1F] ${color}`}>{value}</p>
                <p className="text-[11px] text-[#AEAEB2] mt-0.5 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          {/* Col 2: Top Cities */}
          <div>
            <p className="font-[DM_Sans] font-semibold text-[13px] text-[#1D1D1F] mb-3">Top Locations</p>
            {topCities.length === 0 ? (
              <p className="text-[13px] text-[#AEAEB2]">No location data yet</p>
            ) : (
              <div className="space-y-2">
                {topCities.slice(0, 6).map(c => (
                  <div key={`${c.city}-${c.state}`}>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-[#AEAEB2] flex-shrink-0" />
                      <span className="text-[13px] text-[#1D1D1F] flex-1">
                        {c.city}{c.state ? `, ${c.state}` : ''}
                      </span>
                      <span className="font-[DM_Sans] font-bold text-[13px] text-[#1D1D1F]">{c.count}</span>
                    </div>
                    <div className="w-full h-1 bg-[rgba(0,0,0,0.06)] rounded-full mt-1">
                      <div
                        className="h-full bg-[#1D1D1F] rounded-full transition-all"
                        style={{ width: `${(c.count / maxCityCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Col 3: Repeat Buyer Insight */}
          <div>
            <div className="bg-[#F5F5F7] rounded-xl p-4">
              <TL size={1.5} />
              <div className="flex flex-col items-center text-center mt-4">
                <Users className="w-5 h-5 text-[#1D1D1F]" />
                <p className="font-[DM_Sans] font-semibold text-[13px] text-[#1D1D1F] mt-2">Repeat Customer Rate</p>
                <p className="font-[DM_Sans] font-extrabold text-[40px] mt-1" style={{ color: insightColor }}>
                  {repeatRate.toFixed(1)}%
                </p>
                <p className="text-[13px] text-[#6E6E73] mt-3 leading-relaxed">{insightMsg}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
