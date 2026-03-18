'use client';

interface ProductEarning {
  id: string;
  name: string;
  image?: string | null;
  unitsSold: number;
  grossRevenue: number;
  netEarnings: number;
}

interface Props {
  productEarnings: ProductEarning[];
}

export default function ProductEarningsBreakdown({ productEarnings }: Props) {
  const totalEarnings = productEarnings.reduce((s, p) => s + p.netEarnings, 0);
  const maxEarnings = Math.max(...productEarnings.map(p => p.netEarnings), 1);

  return (
    <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm overflow-hidden h-full flex flex-col">
      {/* TITLEBAR */}
      <div className="h-[44px] flex-shrink-0 flex items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5 gap-2">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
          <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
          <div className="h-2 w-2 rounded-full bg-[#28C840]" />
        </div>
        <span className="font-[DM_Sans] font-semibold text-[13px] text-[#1D1D1F] ml-1">Earnings by Product</span>
      </div>

      {/* CONTENT */}
      <div className="p-4 space-y-3 flex-1 overflow-auto">
        {productEarnings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-[14px] text-[#AEAEB2]">No product data yet</p>
          </div>
        ) : (
          productEarnings.map(product => {
            const pct = maxEarnings > 0 ? (product.netEarnings / maxEarnings) * 100 : 0;
            return (
              <div
                key={product.id}
                className="flex items-center gap-3 bg-[#F5F5F7] rounded-xl p-3 hover:bg-[rgba(0,0,0,0.04)] transition-colors"
              >
                {/* Thumbnail */}
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white border border-[rgba(0,0,0,0.06)]">
                  {product.image ? (
                    <img src={product.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
                  )}
                </div>

                {/* Center */}
                <div className="flex-1 min-w-0">
                  <div className="font-[DM_Sans] font-semibold text-[13px] text-[#1D1D1F] line-clamp-1">
                    {product.name}
                  </div>
                  <div className="flex gap-3 mt-1">
                    <span className="text-[11px] text-[#AEAEB2]">{product.unitsSold} sold</span>
                    <span className="text-[11px] text-[#AEAEB2]">
                      Gross ₹{product.grossRevenue.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {/* earnings bar */}
                  <div className="mt-2 h-1.5 rounded-full bg-[rgba(0,0,0,0.06)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#1D1D1F] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Right */}
                <div className="text-right flex-shrink-0">
                  <div className="font-[DM_Sans] font-bold text-[14px] text-[#1D1D1F]">
                    ₹{product.netEarnings.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-[#AEAEB2] mt-0.5">
                    {product.unitsSold} sales
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* TOTAL ROW */}
      {productEarnings.length > 0 && (
        <div className="mx-4 my-4 pt-4 border-t border-[rgba(0,0,0,0.06)] flex items-center justify-between flex-shrink-0">
          <span className="font-[DM_Sans] font-semibold text-[13px] text-[#1D1D1F]">Total</span>
          <span className="font-[DM_Sans] font-bold text-[16px] text-[#1D1D1F]">
            ₹{totalEarnings.toLocaleString('en-IN')}
          </span>
        </div>
      )}
    </div>
  );
}
