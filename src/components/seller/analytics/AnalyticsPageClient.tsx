'use client';

import { useState, useMemo } from 'react';
import {
  IndianRupee, ShoppingBag, Users, TrendingUp, TrendingDown,
  Download, BarChart2, Package, AlertTriangle, CheckCircle2, XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { RevenueChart } from './RevenueChart';
import { TopProductsChart } from './TopProductsChart';
import { OrderStatusChart } from './OrderStatusChart';
import { CategoryChart } from './CategoryChart';
import { CustomerInsights } from './CustomerInsights';

// ─── Helpers ────────────────────────────────────────────────────────────────

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

const LOW_STOCK_THRESHOLD = 10;

type Period = '30d' | '3m' | '6m' | '12m' | 'all';

function getPeriodStart(period: Period): Date | null {
  const now = new Date();
  if (period === '30d') return new Date(now.getTime() - 30 * 86400000);
  if (period === '3m') return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
  if (period === '6m') return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
  if (period === '12m') return new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
  return null;
}

function getPrevPeriodStart(period: Period): Date | null {
  const cur = getPeriodStart(period);
  if (!cur) return null;
  const now = new Date();
  const duration = now.getTime() - cur.getTime();
  return new Date(cur.getTime() - duration);
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  orderItems: any[];
  products: any[];
  userId: string;
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

interface KpiProps {
  icon: React.ComponentType<any>;
  value: string;
  label: string;
  trend?: number; // percentage change
  sub?: string;
}

function KpiCard({ icon: Icon, value, label, trend, sub }: KpiProps) {
  const trendPositive = trend !== undefined && trend >= 0;
  return (
    <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-[0_2px_12px_rgba(0,0,0,0.08)] overflow-hidden">
      <div className="h-[44px] flex items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-4">
        <TL />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="font-[DM_Sans] font-extrabold text-[24px] text-[#1D1D1F] leading-none truncate">{value}</p>
            <p className="text-[12px] text-[#6E6E73] mt-1">{label}</p>
            {sub && <p className="text-[11px] text-[#28C840] mt-0.5 font-medium">{sub}</p>}
          </div>
          <div className="flex-shrink-0 ml-3 bg-[#F5F5F7] rounded-xl p-2">
            <Icon className="w-5 h-5 text-[#6E6E73]" />
          </div>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-3 text-[11px] font-semibold ${trendPositive ? 'text-[#28C840]' : 'text-[#FF5F57]'}`}>
            {trendPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {trendPositive ? '+' : ''}{trend.toFixed(1)}% vs last period
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Export ──────────────────────────────────────────────────────────────────

function exportReport(
  period: Period,
  totalRevenue: number,
  totalOrders: number,
  uniqueCustomers: number,
  avgOrderValue: number,
  monthlyRevenue: { month: string; revenue: number; orders: number }[],
  topProducts: { name: string; units: number; revenue: number }[],
  ordersByStatus: { status: string; count: number; percentage: number }[],
  topCities: { city: string; state: string; count: number }[]
) {
  const periodLabels: Record<Period, string> = {
    '30d': 'Last 30 days', '3m': 'Last 3 months',
    '6m': 'Last 6 months', '12m': 'Last 12 months', 'all': 'All time',
  };

  const lines: string[] = [];

  lines.push('SLATE ANALYTICS REPORT');
  lines.push('');
  lines.push('OVERVIEW');
  lines.push(`Period,${periodLabels[period]}`);
  lines.push(`Total Revenue,₹${totalRevenue.toLocaleString('en-IN')}`);
  lines.push(`Total Orders,${totalOrders}`);
  lines.push(`Unique Customers,${uniqueCustomers}`);
  lines.push(`Avg Order Value,₹${avgOrderValue.toLocaleString('en-IN')}`);
  lines.push('');

  lines.push('MONTHLY REVENUE');
  lines.push('Month,Revenue,Orders');
  monthlyRevenue.forEach(d => lines.push(`${d.month},${d.revenue},${d.orders}`));
  lines.push('');

  lines.push('TOP PRODUCTS');
  lines.push('Rank,Product,Units Sold,Revenue');
  topProducts.slice(0, 10).forEach((p, i) => lines.push(`${i + 1},"${p.name}",${p.units},${p.revenue}`));
  lines.push('');

  lines.push('ORDERS BY STATUS');
  lines.push('Status,Count,Percentage');
  ordersByStatus.forEach(d => lines.push(`${d.status},${d.count},${d.percentage}%`));
  lines.push('');

  lines.push('TOP CITIES');
  lines.push('City,State,Orders');
  topCities.forEach(c => lines.push(`"${c.city}","${c.state}",${c.count}`));

  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `slate-analytics-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnalyticsPageClient({ orderItems, products, userId }: Props) {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('12m');

  // ── Filter by period ──
  const filteredItems = useMemo(() => {
    const start = getPeriodStart(period);
    if (!start) return orderItems;
    return orderItems.filter(item => new Date(item.created_at) >= start);
  }, [orderItems, period]);

  const prevItems = useMemo(() => {
    const start = getPeriodStart(period);
    const prevStart = getPrevPeriodStart(period);
    if (!start || !prevStart) return [];
    return orderItems.filter(item => {
      const d = new Date(item.created_at);
      return d >= prevStart && d < start;
    });
  }, [orderItems, period]);

  // ── Core metrics ──
  const totalRevenue = useMemo(() => filteredItems.reduce((s, i) => s + (i.total_price ?? 0), 0), [filteredItems]);
  const totalOrders = useMemo(() => new Set(filteredItems.map((i: any) => i.orders?.id)).size, [filteredItems]);
  const uniqueCustomers = useMemo(() => new Set(filteredItems.map((i: any) => i.orders?.user_id).filter(Boolean)).size, [filteredItems]);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // ── Prev period metrics for trend ──
  const prevRevenue = useMemo(() => prevItems.reduce((s: number, i: any) => s + (i.total_price ?? 0), 0), [prevItems]);
  const prevOrders = useMemo(() => new Set(prevItems.map((i: any) => i.orders?.id)).size, [prevItems]);
  const prevCustomers = useMemo(() => new Set(prevItems.map((i: any) => i.orders?.user_id).filter(Boolean)).size, [prevItems]);
  const prevAvgOrder = prevOrders > 0 ? Math.round(prevRevenue / prevOrders) : 0;

  const trend = (cur: number, prev: number) =>
    prev === 0 ? (cur > 0 ? 100 : 0) : ((cur - prev) / prev) * 100;

  // ── Monthly Revenue ──
  const monthlyRevenue = useMemo(() => {
    const map: Record<string, { revenue: number; orders: Set<string> }> = {};
    filteredItems.forEach((item: any) => {
      const d = new Date(item.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) map[key] = { revenue: 0, orders: new Set() };
      map[key].revenue += item.total_price ?? 0;
      if (item.orders?.id) map[key].orders.add(item.orders.id);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => ({
        month: new Date(key + '-01').toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
        revenue: Math.round(v.revenue),
        orders: v.orders.size,
      }));
  }, [filteredItems]);

  // ── Top Products ──
  const topProducts = useMemo(() => {
    const map: Record<string, { id: string; name: string; images: string[] | null; revenue: number; units: number }> = {};
    filteredItems.forEach((item: any) => {
      const p = item.products;
      if (!p) return;
      if (!map[p.id]) map[p.id] = { id: p.id, name: p.name, images: p.images, revenue: 0, units: 0 };
      map[p.id].revenue += item.total_price ?? 0;
      map[p.id].units += item.quantity ?? 0;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [filteredItems]);

  // ── Orders by Status ──
  const ordersByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    filteredItems.forEach((item: any) => {
      const s = item.status ?? 'unknown';
      map[s] = (map[s] ?? 0) + 1;
    });
    const total = Object.values(map).reduce((s, c) => s + c, 0);
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([status, count]) => ({
        status,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }));
  }, [filteredItems]);

  // ── Sales by Category ──
  const salesByCategory = useMemo(() => {
    const map: Record<string, { revenue: number; units: number }> = {};
    filteredItems.forEach((item: any) => {
      const cats = item.products?.product_categories;
      const catName = Array.isArray(cats) ? cats[0]?.name : cats?.name;
      const key = catName ?? 'Uncategorized';
      if (!map[key]) map[key] = { revenue: 0, units: 0 };
      map[key].revenue += item.total_price ?? 0;
      map[key].units += item.quantity ?? 0;
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .map(([category, v]) => ({
        category,
        revenue: Math.round(v.revenue),
        units: v.units,
      }));
  }, [filteredItems]);

  // ── Customer Insights ──
  const { repeatBuyers, repeatRate, avgItemsPerOrder, topCities } = useMemo(() => {
    const perUser: Record<string, { orders: Set<string>; items: number }> = {};
    const cityMap: Record<string, { count: number; state: string }> = {};

    filteredItems.forEach((item: any) => {
      const uid = item.orders?.user_id;
      if (uid) {
        if (!perUser[uid]) perUser[uid] = { orders: new Set(), items: 0 };
        if (item.orders?.id) perUser[uid].orders.add(item.orders.id);
        perUser[uid].items += item.quantity ?? 0;
      }
      const city = item.orders?.addresses?.city;
      const state = item.orders?.addresses?.state ?? '';
      if (city) {
        if (!cityMap[city]) cityMap[city] = { count: 0, state };
        cityMap[city].count++;
      }
    });

    const userList = Object.values(perUser);
    const rb = userList.filter(u => u.orders.size > 1).length;
    const uc = userList.length;
    const totalItems = userList.reduce((s, u) => s + u.items, 0);
    const totalOrd = userList.reduce((s, u) => s + u.orders.size, 0);

    return {
      repeatBuyers: rb,
      repeatRate: uc > 0 ? (rb / uc) * 100 : 0,
      avgItemsPerOrder: totalOrd > 0 ? totalItems / totalOrd : 0,
      topCities: Object.entries(cityMap)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 6)
        .map(([city, v]) => ({ city, state: v.state, count: v.count })),
    };
  }, [filteredItems]);

  // ── Inventory Health ──
  const { inStock, lowStock, outOfStock } = useMemo(() => {
    const inS = products.filter((p: any) => (p.stock_qty ?? 0) > LOW_STOCK_THRESHOLD);
    const low = products.filter((p: any) => (p.stock_qty ?? 0) > 0 && (p.stock_qty ?? 0) <= LOW_STOCK_THRESHOLD);
    const out = products.filter((p: any) => (p.stock_qty ?? 0) === 0);
    return { inStock: inS, lowStock: low, outOfStock: out };
  }, [products]);

  const maxStock = useMemo(() => Math.max(...products.map((p: any) => p.stock_qty ?? 0), 1), [products]);

  // ── Empty state ──
  if (orderItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] p-4 md:p-6 font-[DM_Sans] flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-[0_2px_12px_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="h-[44px] border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5 flex items-center">
            <TL size={2} />
          </div>
          <div className="px-8 py-24 text-center">
            <BarChart2 className="w-12 h-12 text-[#AEAEB2] mx-auto mt-2" />
            <p className="font-[DM_Sans] font-bold text-[22px] text-[#1D1D1F] mt-5">No data yet</p>
            <p className="text-[14px] text-[#6E6E73] mt-2 max-w-xs mx-auto">
              Analytics will appear once you start receiving orders.
            </p>
            <button
              onClick={() => router.push('/seller/products/new')}
              className="mt-8 bg-[#1D1D1F] text-white font-[DM_Sans] font-semibold text-[13px] rounded-xl px-6 py-2.5 hover:bg-[#333] transition-colors"
            >
              Add Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] p-4 md:p-6 font-[DM_Sans]">
      <div className="max-w-7xl mx-auto">

        {/* ── Page Header ── */}
        <div className="flex items-start sm:items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="font-[DM_Sans] font-bold text-[26px] text-[#1D1D1F]">Analytics</h1>
            <p className="text-[13px] text-[#6E6E73] mt-1">Store performance insights</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={period}
              onChange={e => setPeriod(e.target.value as Period)}
              className="w-[180px] border border-[rgba(0,0,0,0.1)] rounded-xl px-3 py-2 text-[13px] font-[DM_Sans] text-[#1D1D1F] bg-white focus:outline-none focus:border-[#1D1D1F] cursor-pointer"
            >
              <option value="30d">Last 30 days</option>
              <option value="3m">Last 3 months</option>
              <option value="6m">Last 6 months</option>
              <option value="12m">Last 12 months</option>
              <option value="all">All time</option>
            </select>
            <button
              onClick={() =>
                exportReport(period, totalRevenue, totalOrders, uniqueCustomers, avgOrderValue,
                  monthlyRevenue, topProducts, ordersByStatus, topCities)
              }
              className="flex items-center gap-2 border border-[rgba(0,0,0,0.1)] rounded-full px-4 py-2 text-[13px] font-[DM_Sans] font-medium text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard
            icon={IndianRupee}
            value={`₹${totalRevenue.toLocaleString('en-IN')}`}
            label="Total Revenue"
            trend={trend(totalRevenue, prevRevenue)}
          />
          <KpiCard
            icon={ShoppingBag}
            value={totalOrders.toString()}
            label="Total Orders"
            trend={trend(totalOrders, prevOrders)}
          />
          <KpiCard
            icon={Users}
            value={uniqueCustomers.toString()}
            label="Unique Customers"
            trend={trend(uniqueCustomers, prevCustomers)}
            sub={`${repeatRate.toFixed(1)}% repeat buyers`}
          />
          <KpiCard
            icon={TrendingUp}
            value={`₹${avgOrderValue.toLocaleString('en-IN')}`}
            label="Avg Order Value"
            trend={trend(avgOrderValue, prevAvgOrder)}
          />
        </div>

        {/* ── Revenue Chart ── */}
        <RevenueChart data={monthlyRevenue} />

        {/* ── Two Column Section ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left: Top Products */}
          <TopProductsChart products={topProducts} />

          {/* Right: Status + Category */}
          <div className="space-y-4">
            <OrderStatusChart data={ordersByStatus} totalOrders={filteredItems.length} />
            <CategoryChart data={salesByCategory} />
          </div>
        </div>

        {/* ── Customer Insights ── */}
        <CustomerInsights
          uniqueCustomers={uniqueCustomers}
          repeatBuyers={repeatBuyers}
          repeatRate={repeatRate}
          avgItemsPerOrder={avgItemsPerOrder}
          topCities={topCities}
        />

        {/* ── Inventory Health ── */}
        <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-[0_2px_12px_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="h-[44px] flex items-center gap-3 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
            <TL />
            <span className="font-[DM_Sans] font-semibold text-[13px] text-[#1D1D1F]">Inventory Health</span>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Left: Stock Levels */}
              <div>
                <p className="font-[DM_Sans] font-semibold text-[13px] text-[#1D1D1F] mb-3">Stock Levels</p>
                {products.length === 0 ? (
                  <p className="text-[13px] text-[#AEAEB2]">No products</p>
                ) : (
                  <div className="space-y-3">
                    {products.slice(0, 10).map((p: any) => {
                      const stock = p.stock_qty ?? 0;
                      const pct = (stock / maxStock) * 100;
                      const color = stock === 0 ? '#FF5F57' : stock <= LOW_STOCK_THRESHOLD ? '#FEBC2E' : '#28C840';
                      return (
                        <div key={p.id} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#F5F5F7] overflow-hidden flex-shrink-0">
                            {p.images?.[0] ? (
                              <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full" />
                            )}
                          </div>
                          <span className="text-[12px] text-[#1D1D1F] flex-1 line-clamp-1">{p.name}</span>
                          <div className="w-[100px] h-2 bg-[rgba(0,0,0,0.06)] rounded-full flex-shrink-0">
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                          </div>
                          <span className="font-[DM_Sans] font-bold text-[12px] w-8 text-right" style={{ color }}>{stock}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right: Summary */}
              <div className="space-y-3">
                <div className="bg-[#EDFAF0] rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#28C840] flex-shrink-0" />
                  <div>
                    <p className="font-[DM_Sans] font-bold text-[18px] text-[#1D1D1F]">{inStock.length} products</p>
                    <p className="text-[12px] text-[#6E6E73]">Well stocked</p>
                  </div>
                </div>
                <div className="bg-[#FFF8EC] rounded-xl p-4 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#FEBC2E] flex-shrink-0" />
                  <div>
                    <p className="font-[DM_Sans] font-bold text-[18px] text-[#1D1D1F]">{lowStock.length} products</p>
                    <p className="text-[12px] text-[#6E6E73]">Need restocking soon</p>
                  </div>
                </div>
                <div className="bg-[#FFF0EF] rounded-xl p-4 flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-[#FF5F57] flex-shrink-0" />
                  <div>
                    <p className="font-[DM_Sans] font-bold text-[18px] text-[#1D1D1F]">{outOfStock.length} products</p>
                    <p className="text-[12px] text-[#6E6E73]">No inventory — missing sales</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/seller/products?filter=low-stock')}
                  className="w-full border border-[rgba(0,0,0,0.1)] rounded-full px-4 py-2 text-[13px] font-[DM_Sans] font-medium text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors mt-1"
                >
                  Manage Inventory →
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
