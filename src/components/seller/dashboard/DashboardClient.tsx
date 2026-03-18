'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  AlertTriangle,
  IndianRupee,
  ShoppingBag,
  Package,
  Star,
  Plus,
  RotateCcw,
  Store,
} from 'lucide-react';

import TrafficLights from '@/components/auth/TrafficLights';
import { RevenueChart } from './RevenueChart';
import RecentOrderRow from './RecentOrderRow';
import TopProductCard from './TopProductCard';
import InventoryAlertRow from './InventoryAlertRow';

function StatCard({ icon: Icon, value, label, subValue, trend }: any) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      {/* Top Bar with Traffic Lights on the Left */}
      <div className="flex h-10 items-center justify-between border-b border-[rgba(0,0,0,0.04)] bg-[#F5F5F7] px-4">
        <TrafficLights size="sm" />
        <div className="flex items-center gap-1.5 text-[#6E6E73]">
          <Icon className="h-3.5 w-3.5" />
          <span className="font-[DM_Sans] text-[10px] font-bold uppercase tracking-wider">{label}</span>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex flex-1 flex-col justify-center p-5">
        <p className="font-[DM_Sans] text-[28px] leading-none font-extrabold text-[#1D1D1F]">
          {value}
        </p>
        
        {/* Footer / Trend */}
        {(trend || subValue) && (
          <div className="mt-3 flex items-center gap-2">
            {trend ? (
              <span className="flex items-center gap-1 rounded-md bg-[#EDFAF0] px-2 py-0.5 text-[11px] font-bold text-[#28C840]">
                <TrendingUpIcon className="h-3 w-3 inline-block" />
                {trend}
              </span>
            ) : null}
            {subValue?.text ? (
              <span className={`text-[11px] font-medium ${subValue.color}`}>
                {subValue.text}
              </span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

const TrendingUpIcon = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
);

export default function DashboardClient({
  sellerProfile,
  products,
  initialRecentOrders,
  initialLowStockProducts,
  monthlyRevenue,
  userId,
  stats
}: {
  sellerProfile: any;
  products: any[];
  initialRecentOrders: any[];
  initialLowStockProducts: any[];
  monthlyRevenue: any[];
  userId: string;
  stats: any;
}) {
  const router = useRouter();
  const supabase = createClient();
  
  const [recentOrders, setRecentOrders] = useState(initialRecentOrders);
  const [lowStockProducts, setLowStockProducts] = useState(initialLowStockProducts);
  
  // Stats state (for realtime updates)
  const [liveStats, setLiveStats] = useState(stats);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase.channel('seller-dashboard')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'order_items',
        filter: `seller_id=eq.${userId}`
      }, (payload) => {
        // Optimistic update for order items
        setLiveStats((prev: any) => ({
          ...prev,
          totalOrders: prev.totalOrders + 1,
          pendingOrders: prev.pendingOrders + 1,
        }));
        
        toast.success("New order received! 🛍️", {
          style: { background: '#EDFAF0', color: '#28C840', border: '1px solid #28C840' }
        });
        
        // We'd typically refetch recent orders here or just push a dummy row if we had the full join
        router.refresh(); 
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'products',
        filter: `seller_id=eq.${userId}`
      }, (payload) => {
        router.refresh(); // Simple refresh to pick up stock changes
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId, router]);

  const handleStockUpdate = (productId: string, newQty: number) => {
    setLowStockProducts(prev => 
      prev.map(p => p.id === productId ? { ...p, stock_qty: newQty } : p)
        // Optionally filter out if newQty > threshold, but seeing it there updated is fine too
    );
  };

  const name = sellerProfile?.store_name || 'Seller';
  const greeting = new Date().getHours() < 12 ? 'Good morning' : 'Good afternoon';

  return (
    <div className="mx-auto max-w-6xl pb-10">
      
      {/* Header and Alerts */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-[DM_Sans] text-[26px] font-bold text-[#1D1D1F]">
            {greeting}, {name} 👋
          </h1>
          <p className="mt-1 text-[13px] text-[#6E6E73]">
            {name} · {liveStats.totalProducts} active products
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {lowStockProducts.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-[#FF5F57]/20 bg-[#FFF0EF] px-4 py-2">
              <AlertTriangle className="h-[14px] w-[14px] text-[#FF5F57]" />
              <span className="font-[DM_Sans] text-[13px] font-medium text-[#FF5F57]">
                {lowStockProducts.length} products low on stock
              </span>
              <button 
                onClick={() => router.push('/seller/products?filter=low-stock')}
                className="ml-2 font-[DM_Sans] text-[13px] font-bold text-[#FF5F57] transition-opacity hover:opacity-80"
              >
                Fix now &rarr;
              </button>
            </div>
          )}

          {liveStats.pendingOrders > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-[#FEBC2E]/20 bg-[#FFF8EC] px-4 py-2">
              <ShoppingBag className="h-[14px] w-[14px] text-[#FEBC2E]" />
              <span className="font-[DM_Sans] text-[13px] font-medium text-[#FEBC2E]">
                {liveStats.pendingOrders} orders to process
              </span>
              <button 
                onClick={() => router.push('/seller/orders?filter=pending')}
                className="ml-2 font-[DM_Sans] text-[13px] font-bold text-[#FEBC2E] transition-opacity hover:opacity-80"
              >
                View &rarr;
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={IndianRupee}
          value={`₹${liveStats.totalRevenue.toLocaleString('en-IN')}`}
          label="Total Revenue"
          trend={liveStats.thisMonthRevenue > 0 ? "+ Active" : undefined}
        />
        <StatCard
          icon={ShoppingBag}
          value={liveStats.totalOrders}
          label="Total Orders"
          subValue={liveStats.pendingOrders > 0 ? {
            text: `${liveStats.pendingOrders} pending`,
            color: 'text-[#FEBC2E]'
          } : undefined}
        />
        <StatCard
          icon={Package}
          value={liveStats.totalProducts}
          label="Active Products"
          subValue={lowStockProducts.length > 0 ? {
            text: `${lowStockProducts.length} low stock`,
            color: 'text-[#FF5F57]'
          } : undefined}
        />
        <StatCard
          icon={Star}
          value={`${sellerProfile?.avg_rating || 0} ★`}
          label="Store Rating"
          subValue={{ text: "From customer reviews", color: "text-[#AEAEB2]" }}
        />
      </div>

      {/* Low Stock Banner (Details) */}
      {lowStockProducts.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-[#FF5F57]/20 bg-[#FFFAF5]">
          <div className="flex h-11 items-center border-b border-[#FF5F57]/15 bg-[#FFF0EF] px-5">
            <TrafficLights size="sm" />
            <AlertTriangle className="ml-3 h-[14px] w-[14px] text-[#FF5F57]" />
            <span className="ml-2 flex-1 font-[DM_Sans] text-[13px] font-semibold text-[#FF5F57]">
              Low Stock Alerts
            </span>
            <button
              onClick={() => router.push('/seller/products?filter=low-stock')}
              className="font-[DM_Sans] text-[13px] font-bold text-[#FF5F57] hover:underline"
            >
              Manage Inventory &rarr;
            </button>
          </div>
          <div className="p-4">
            {lowStockProducts.slice(0, 5).map(p => (
              <InventoryAlertRow 
                key={p.id} 
                product={p} 
                onStockUpdated={handleStockUpdate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Revenue Chart */}
      <RevenueChart monthlyRevenue={monthlyRevenue} />

      {/* 3 Col Layout */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Recent Orders (2 cols) */}
        <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm lg:col-span-2">
          <div className="flex h-11 items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
            <TrafficLights size="sm" />
            <span className="ml-3 flex-1 font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
              Recent Orders
            </span>
            <button
              onClick={() => router.push('/seller/orders')}
              className="text-[12px] font-semibold text-[#AEAEB2] hover:text-[#1D1D1F]"
            >
              View all &rarr;
            </button>
          </div>
          
          <div className="grid grid-cols-[1fr_2fr_1.5fr_1fr_1fr] border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5 py-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#AEAEB2]">Order</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#AEAEB2]">Product</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#AEAEB2]">Customer</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#AEAEB2]">Amount</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#AEAEB2]">Status</span>
          </div>
          
          <div className="flex flex-col">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-[13px] text-[#6E6E73]">
                No recent orders found.
              </div>
            ) : (
              recentOrders.map(item => (
                <RecentOrderRow key={item.id} orderItem={item} />
              ))
            )}
          </div>
        </div>

        {/* Top Products (1 col) */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
          <div className="flex h-11 items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
            <TrafficLights size="sm" />
            <span className="ml-3 flex-1 font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
              Top Products
            </span>
            <button
              onClick={() => router.push('/seller/products')}
              className="text-[12px] font-semibold text-[#AEAEB2] hover:text-[#1D1D1F]"
            >
              View all &rarr;
            </button>
          </div>
          
          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {products.slice(0, 5).map((p, idx) => (
              <TopProductCard key={p.id} product={p} rank={idx + 1} />
            ))}
            {products.length === 0 && (
              <div className="pt-6 text-center text-[13px] text-[#6E6E73]">
                No products yet. List your first product!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions Row */}
      <h2 className="mb-4 font-[DM_Sans] text-[16px] font-bold text-[#1D1D1F]">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { icon: Plus, title: "Add Product", sub: "List something new", fn: () => router.push('/seller/products/new') },
          { icon: ShoppingBag, title: "Process Orders", sub: liveStats.pendingOrders > 0 ? `${liveStats.pendingOrders} pending` : "Manage queue", color: liveStats.pendingOrders > 0 ? "text-[#FEBC2E]" : "text-[#AEAEB2]", fn: () => router.push('/seller/orders?filter=pending') },
          { icon: RotateCcw, title: "Handle Returns", sub: "Manage requests", fn: () => router.push('/seller/returns') },
          { icon: Store, title: "View My Store", sub: "See public page", fn: () => router.push('/seller/store') },
        ].map((action, i) => (
          <button
            key={i}
            onClick={action.fn}
            className="flex items-center gap-3 rounded-xl border border-[rgba(0,0,0,0.08)] bg-white p-4 text-left shadow-sm transition-all hover:border-[rgba(0,0,0,0.15)] hover:shadow-md"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#F5F5F7] text-[#1D1D1F]">
              <action.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="font-[DM_Sans] text-[13px] font-bold text-[#1D1D1F]">{action.title}</p>
              <p className={`mt-0.5 text-[11px] font-medium ${action.color || 'text-[#AEAEB2]'}`}>{action.sub}</p>
            </div>
          </button>
        ))}
      </div>

    </div>
  );
}
