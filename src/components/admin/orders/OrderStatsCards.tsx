'use client';

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
      <div className="flex h-9 items-center gap-1 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-3">
        <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
        <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
        <span className="h-2 w-2 rounded-full bg-[#28C840]" />
      </div>
      <div className="p-4">
        <p className="text-[11px] uppercase tracking-wide text-[#AEAEB2]">{label}</p>
        <p className="mt-1 text-[18px] font-bold text-[#1D1D1F]">{value}</p>
      </div>
    </div>
  );
}

export default function OrderStatsCards({
  stats,
}: {
  stats: {
    pendingOrders: number;
    processingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    totalRevenue: number;
  };
}) {
  const inr = (n: number) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

  return (
    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard label="Pending" value={String(stats.pendingOrders || 0)} />
      <StatCard label="Processing" value={String(stats.processingOrders || 0)} />
      <StatCard label="Shipped" value={String(stats.shippedOrders || 0)} />
      <StatCard label="Delivered" value={String(stats.deliveredOrders || 0)} />
      <StatCard label="Revenue" value={inr(stats.totalRevenue || 0)} />
    </div>
  );
}
