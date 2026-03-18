'use client';

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

interface CategoryData {
  category: string;
  revenue: number;
  units: number;
}

interface Props {
  data: CategoryData[];
}

export function CategoryChart({ data }: Props) {
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);

  return (
    <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-[0_2px_12px_rgba(0,0,0,0.08)] overflow-hidden">
      <div className="h-[44px] flex items-center gap-3 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
        <TL />
        <span className="font-[DM_Sans] font-semibold text-[13px] text-[#1D1D1F]">Sales by Category</span>
      </div>
      <div className="p-5">
        {data.length === 0 ? (
          <p className="text-[13px] text-[#AEAEB2] text-center py-8">No category data yet</p>
        ) : (
          <div className="space-y-3">
            {data.map(d => (
              <div key={d.category} className="flex items-center gap-3">
                <span className="text-[13px] font-[DM_Sans] font-medium text-[#1D1D1F] flex-1 truncate">{d.category}</span>
                <div className="w-[120px] h-1.5 bg-[rgba(0,0,0,0.06)] rounded-full flex-shrink-0">
                  <div
                    className="h-full bg-[#1D1D1F] rounded-full transition-all"
                    style={{ width: `${(d.revenue / maxRevenue) * 100}%` }}
                  />
                </div>
                <span className="font-[DM_Sans] font-bold text-[12px] text-[#1D1D1F] w-20 text-right">
                  ₹{d.revenue.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
