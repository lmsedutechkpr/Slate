import { Package, TrendingUp, AlertTriangle, IndianRupee } from 'lucide-react';
import TrafficLights from '@/components/auth/TrafficLights';

interface ProductStatsCardsProps {
  stats: {
    totalProducts: number;
    activeProducts: number;
    outOfStock: number;
    lowStock: number;
    totalRevenue: number;
    totalSold: number;
    pendingProducts?: number;
    draftProducts?: number;
  };
}

export default function ProductStatsCards({ stats }: ProductStatsCardsProps) {
  const stockIssues = stats.outOfStock + stats.lowStock;

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {/* Total Products */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex h-10 items-center justify-between border-b border-[rgba(0,0,0,0.04)] bg-[#F5F5F7] px-4">
          <TrafficLights size="sm" />
          <div className="flex items-center gap-1.5 text-[#6E6E73]">
            <Package className="h-3.5 w-3.5" />
            <span className="font-[DM_Sans] text-[10px] font-bold uppercase tracking-wider">Total Products</span>
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-center p-5">
          <p className="font-[DM_Sans] text-[28px] font-extrabold leading-none text-[#1D1D1F]">
            {stats.totalProducts}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            <span className="text-[11px] font-medium text-[#28C840]">{stats.activeProducts} active</span>
            {stats.pendingProducts !== undefined && stats.pendingProducts > 0 && (
              <span className="text-[11px] font-medium text-[#FEBC2E]">{stats.pendingProducts} pending</span>
            )}
            {stats.draftProducts !== undefined && stats.draftProducts > 0 && (
              <span className="text-[11px] font-medium text-[#AEAEB2]">{stats.draftProducts} drafts</span>
            )}
          </div>
        </div>
      </div>

      {/* Units Sold */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex h-10 items-center justify-between border-b border-[rgba(0,0,0,0.04)] bg-[#F5F5F7] px-4">
          <TrafficLights size="sm" />
          <div className="flex items-center gap-1.5 text-[#6E6E73]">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="font-[DM_Sans] text-[10px] font-bold uppercase tracking-wider">Units Sold</span>
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-center p-5">
          <p className="font-[DM_Sans] text-[28px] font-extrabold leading-none text-[#1D1D1F]">
            {stats.totalSold}
          </p>
          <p className="mt-2 text-[11px] font-medium text-[#AEAEB2]">
            Across all products
          </p>
        </div>
      </div>

      {/* Stock Issues */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex h-10 items-center justify-between border-b border-[rgba(0,0,0,0.04)] bg-[#F5F5F7] px-4">
          <TrafficLights size="sm" />
          <div className="flex items-center gap-1.5 text-[#6E6E73]">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="font-[DM_Sans] text-[10px] font-bold uppercase tracking-wider">Stock Issues</span>
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-center p-5">
          <p className={`font-[DM_Sans] text-[28px] font-extrabold leading-none ${stockIssues > 0 ? 'text-[#FF5F57]' : 'text-[#1D1D1F]'}`}>
            {stockIssues}
          </p>
          <div className="mt-2 flex gap-3">
             <span className="text-[11px] font-medium text-[#FF5F57]">{stats.outOfStock} out</span>
             <span className="text-[11px] font-medium text-[#FEBC2E]">{stats.lowStock} low</span>
          </div>
        </div>
      </div>

      {/* Gross Revenue */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex h-10 items-center justify-between border-b border-[rgba(0,0,0,0.04)] bg-[#F5F5F7] px-4">
          <TrafficLights size="sm" />
          <div className="flex items-center gap-1.5 text-[#6E6E73]">
            <IndianRupee className="h-3.5 w-3.5" />
            <span className="font-[DM_Sans] text-[10px] font-bold uppercase tracking-wider">Gross Revenue</span>
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-center p-5">
          <p className="font-[DM_Sans] text-[28px] font-extrabold leading-none text-[#1D1D1F]">
            ₹{stats.totalRevenue.toLocaleString('en-IN')}
          </p>
          <p className="mt-2 text-[11px] font-medium text-[#AEAEB2]">
            Lifetime sales
          </p>
        </div>
      </div>
    </div>
  );
}
