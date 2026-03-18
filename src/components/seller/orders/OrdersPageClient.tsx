'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Download, AlertCircle, Search, Package, ShoppingBag } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import TrafficLights from '@/components/auth/TrafficLights';

import OrderStatsCards from './OrderStatsCards';
import OrderRow from './OrderRow';
import UpdateStatusModal from './UpdateStatusModal';

interface OrdersPageClientProps {
  initialOrderItems: any[];
  stats: any;
  userId: string;
}

const TABS = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function OrdersPageClient({ initialOrderItems, stats: initialStats, userId }: OrdersPageClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [orderItems, setOrderItems] = useState(initialOrderItems);
  const [stats, setStats] = useState(initialStats);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [sortOption, setSortOption] = useState('newest');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [updateModalItem, setUpdateModalItem] = useState<any | null>(null);

  // Realtime subscription
  useEffect(() => {
    const fetchFullItem = async (id: string) => {
      try {
        const res = await fetch(`/api/seller/orders?itemId=${id}`);
        const json = await res.json();
        return json.item || null;
      } catch { return null; }
    };

    const channel = supabase
      .channel('seller-orders')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'order_items',
        filter: `seller_id=eq.${userId}`,
      }, async (payload) => {
        const data = await fetchFullItem(payload.new.id);
        if (data) {
          setOrderItems(prev => [data, ...prev]);
          setStats((prev: any) => ({ ...prev, pendingOrders: prev.pendingOrders + 1, totalOrders: prev.totalOrders + 1 }));
          toast.success('New order received!');
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'order_items',
        filter: `seller_id=eq.${userId}`,
      }, async (payload) => {
        const data = await fetchFullItem(payload.new.id);
        if (data) {
          setOrderItems(prev => prev.map(item =>
            item.id === data.id ? data : item
          ));
          // Notify seller if customer cancelled
          if (payload.new.fulfillment_status === 'cancelled') {
            toast.error('An order has been cancelled by the customer');
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // Filtering
  const filteredItems = useMemo(() => {
    let result = [...orderItems];

    // Tab filter
    if (activeTab === 'Pending') result = result.filter(i => i.fulfillment_status === 'pending' || i.fulfillment_status === 'confirmed');
    if (activeTab === 'Processing') result = result.filter(i => i.fulfillment_status === 'processing');
    if (activeTab === 'Shipped') result = result.filter(i => i.fulfillment_status === 'shipped');
    if (activeTab === 'Delivered') result = result.filter(i => i.fulfillment_status === 'delivered');
    if (activeTab === 'Cancelled') result = result.filter(i => i.fulfillment_status === 'cancelled');

    // Date range
    if (dateRange !== 'all') {
      const now = new Date();
      let cutoff = new Date();
      if (dateRange === 'today') cutoff.setHours(0, 0, 0, 0);
      if (dateRange === '7days') cutoff.setDate(now.getDate() - 7);
      if (dateRange === '30days') cutoff.setDate(now.getDate() - 30);
      if (dateRange === '3months') cutoff.setMonth(now.getMonth() - 3);
      result = result.filter(i => new Date(i.orders?.created_at) >= cutoff);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i =>
        i.id.toLowerCase().includes(q) ||
        i.product_name?.toLowerCase().includes(q) ||
        i.products?.name?.toLowerCase().includes(q) ||
        i.orders?.profiles?.full_name?.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortOption === 'newest') return new Date(b.orders?.created_at).getTime() - new Date(a.orders?.created_at).getTime();
      if (sortOption === 'oldest') return new Date(a.orders?.created_at).getTime() - new Date(b.orders?.created_at).getTime();
      if (sortOption === 'highest') return (b.total_price || 0) - (a.total_price || 0);
      if (sortOption === 'lowest') return (a.total_price || 0) - (b.total_price || 0);
      return 0;
    });

    return result;
  }, [orderItems, activeTab, dateRange, searchQuery, sortOption]);

  // Tab counts
  const tabCounts = useMemo(() => ({
    All: orderItems.length,
    Pending: orderItems.filter(i => i.fulfillment_status === 'pending' || i.fulfillment_status === 'confirmed').length,
    Processing: orderItems.filter(i => i.fulfillment_status === 'processing').length,
    Shipped: orderItems.filter(i => i.fulfillment_status === 'shipped').length,
    Delivered: orderItems.filter(i => i.fulfillment_status === 'delivered').length,
    Cancelled: orderItems.filter(i => i.fulfillment_status === 'cancelled').length,
  }), [orderItems]);

  // Selection
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) setSelectedIds([]);
    else setSelectedIds(filteredItems.map(i => i.id));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Bulk update
  const bulkUpdate = async (newStatus: string) => {
    const toastId = toast.loading(`Updating ${selectedIds.length} orders...`);

    try {
      // Update each item via the API (ensures admin access + parent order sync + notifications)
      const results = await Promise.all(
        selectedIds.map(id =>
          fetch('/api/seller/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderItemId: id, newStatus, notifyCustomer: true }),
          }).then(r => r.json())
        )
      );

      const failed = results.filter(r => r.error);
      if (failed.length > 0) {
        toast.error(`${failed.length} updates failed`, { id: toastId });
      } else {
        setOrderItems(prev => prev.map(item =>
          selectedIds.includes(item.id)
            ? { ...item, fulfillment_status: newStatus, orders: { ...item.orders, updated_at: new Date().toISOString() } }
            : item
        ));
        toast.success(`${selectedIds.length} orders updated to ${newStatus}`, { id: toastId });
        setSelectedIds([]);
      }
    } catch {
      toast.error('Bulk update failed', { id: toastId });
    }
  };

  // Status update callback
  const handleStatusUpdated = (orderItemId: string, newStatus: string) => {
    setOrderItems(prev => prev.map(item =>
      item.id === orderItemId ? { ...item, fulfillment_status: newStatus } : item
    ));
  };

  // Export CSV
  const exportOrdersCSV = () => {
    const headers = ['Order ID', 'Date', 'Product', 'Customer', 'City', 'State', 'Quantity', 'Amount', 'Status', 'Tracking Number'];
    const rows = filteredItems.map(i => [
      i.id.slice(0, 8).toUpperCase(),
      new Date(i.orders?.created_at).toLocaleDateString('en-IN'),
      i.product_name || i.products?.name || '',
      i.orders?.profiles?.full_name || '',
      i.orders?.addresses?.city || '',
      i.orders?.addresses?.state || '',
      i.quantity,
      i.total_price,
      i.fulfillment_status,
      i.tracking_number || '',
    ]);

    const csv = [headers, ...rows].map(r => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `slate-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Orders exported!');
  };

  const toProcess = stats.pendingOrders + stats.processingOrders;

  return (
    <div className="mx-auto max-w-6xl pb-24">

      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-[DM_Sans] text-[26px] font-bold text-[#1D1D1F]">Orders</h1>
          <p className="mt-1 text-[13px] text-[#6E6E73]">
            {stats.totalOrders} orders · {toProcess} to process
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportOrdersCSV}
            className="flex items-center rounded-full border border-[rgba(0,0,0,0.1)] px-4 py-2 font-[DM_Sans] text-[13px] font-medium text-[#1D1D1F] transition-colors hover:bg-[#F5F5F7]"
          >
            <Download className="mr-2 h-[13px] w-[13px]" />
            Export Orders
          </button>
          {stats.pendingOrders > 0 && (
            <div className="flex items-center gap-2 rounded-full border border-[#FEBC2E]/30 bg-[#FFF8EC] px-4 py-2">
              <AlertCircle className="h-[14px] w-[14px] text-[#FEBC2E]" />
              <span className="font-[DM_Sans] text-[13px] font-semibold text-[#FEBC2E]">
                {stats.pendingOrders} need processing
              </span>
            </div>
          )}
        </div>
      </div>

      {/* STATS */}
      <OrderStatsCards stats={stats} />

      {/* FILTERS */}
      <div className="mb-5 flex flex-wrap items-center gap-4 border-b border-[rgba(0,0,0,0.06)] pb-4">
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSelectedIds([]); }}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 font-[DM_Sans] text-[13px] font-semibold transition-colors ${
                activeTab === tab
                  ? 'bg-[#1D1D1F] text-white'
                  : 'text-[#6E6E73] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]'
              }`}
            >
              {tab}
              {(tabCounts as any)[tab] > 0 && (
                <span
                  className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    activeTab === tab
                      ? 'bg-white/20 text-white'
                      : tab === 'Pending' && (tabCounts as any)[tab] > 0
                        ? 'bg-[#FEBC2E]/20 text-[#FEBC2E]'
                        : 'bg-[rgba(0,0,0,0.06)] text-[#AEAEB2]'
                  }`}
                >
                  {(tabCounts as any)[tab]}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[160px] rounded-xl border-none bg-white text-[13px] shadow-sm">
              <SelectValue placeholder="All time" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[rgba(0,0,0,0.08)]">
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="3months">Last 3 months</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className="w-[160px] rounded-xl border-none bg-white text-[13px] shadow-sm">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[rgba(0,0,0,0.08)]">
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="highest">Highest Value</SelectItem>
              <SelectItem value="lowest">Lowest Value</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative w-[220px]">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#AEAEB2]" />
            <input
              type="text"
              placeholder="Order ID, product, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-[#F5F5F7] py-2 pl-9 pr-4 text-[13px] text-[#1D1D1F] placeholder:text-[#AEAEB2] focus:outline-none focus:ring-1 focus:ring-[rgba(0,0,0,0.15)]"
            />
          </div>
        </div>
      </div>

      {/* CONTENT */}
      {orderItems.length === 0 ? (
        /* Global empty state */
        <div className="relative flex flex-col items-center justify-center rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white py-24 shadow-sm">
          <div className="absolute left-4 top-4"><TrafficLights size="sm" /></div>
          <ShoppingBag className="h-12 w-12 text-[#AEAEB2]" />
          <h3 className="mt-5 font-[DM_Sans] text-[22px] font-bold text-[#1D1D1F]">No orders yet</h3>
          <p className="mt-2 text-[14px] text-[#6E6E73]">
            Orders will appear here once customers purchase your products.
          </p>
          <button
            onClick={() => router.push('/seller/products')}
            className="mt-8 rounded-full bg-[#1D1D1F] px-6 py-2.5 font-[DM_Sans] text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            View My Products
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        /* Tab empty state */
        <div className="flex flex-col items-center justify-center py-20">
          <Package className="h-9 w-9 text-[#AEAEB2]" />
          <h3 className="mt-4 font-[DM_Sans] text-[16px] font-semibold text-[#1D1D1F]">
            No {activeTab.toLowerCase()} orders
          </h3>
          <p className="mt-2 text-[13px] text-[#6E6E73]">Try a different filter</p>
        </div>
      ) : (
        /* Table */
        <div className="overflow-x-auto rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
          {/* Titlebar */}
          <div className="flex h-11 min-w-[1000px] items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
            <TrafficLights size="sm" />
            <span className="ml-3 font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
              {activeTab} Orders ({filteredItems.length})
            </span>
          </div>

          {/* Header */}
          <div className="grid min-w-[1000px] grid-cols-[40px_100px_minmax(160px,1.3fr)_minmax(120px,1fr)_80px_100px_90px_100px] items-center gap-4 border-b border-[rgba(0,0,0,0.05)] bg-[#F5F5F7] px-5 py-3">
            <Checkbox
              checked={selectedIds.length === filteredItems.length && filteredItems.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#AEAEB2]">Order ID</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#AEAEB2]">Product</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#AEAEB2]">Customer</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#AEAEB2]">Date</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#AEAEB2]">Amount</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#AEAEB2]">Status</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#AEAEB2]">Actions</span>
          </div>

          {/* Rows */}
          <div className="flex min-w-[1000px] flex-col">
            {filteredItems.map(item => (
              <OrderRow
                key={item.id}
                orderItem={item}
                isSelected={selectedIds.includes(item.id)}
                onToggleSelect={toggleSelect}
                onUpdateStatus={setUpdateModalItem}
                onViewDetail={(oi) => router.push(`/seller/orders/${oi.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#1D1D1F] px-6 py-3.5 text-white shadow-xl"
          >
            <TrafficLights size="xs" />
            <span className="mr-4 font-[DM_Sans] text-[13px] font-semibold">
              {selectedIds.length} selected
            </span>

            <button
              onClick={() => bulkUpdate('processing')}
              className="rounded-full border border-[rgba(255,255,255,0.2)] px-4 py-1.5 font-[DM_Sans] text-[12px] font-medium text-white transition-colors hover:bg-white/10"
            >
              Mark Processing
            </button>
            <button
              onClick={() => bulkUpdate('shipped')}
              className="rounded-full border border-[rgba(255,255,255,0.2)] px-4 py-1.5 font-[DM_Sans] text-[12px] font-medium text-white transition-colors hover:bg-white/10"
            >
              Mark Shipped
            </button>
            <button
              onClick={() => bulkUpdate('delivered')}
              className="rounded-full border border-[rgba(255,255,255,0.2)] px-4 py-1.5 font-[DM_Sans] text-[12px] font-medium text-white transition-colors hover:bg-white/10"
            >
              Mark Delivered
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="ml-2 text-[16px] text-white/60 hover:text-white"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Status Modal */}
      <UpdateStatusModal
        isOpen={!!updateModalItem}
        orderItem={updateModalItem}
        onClose={() => setUpdateModalItem(null)}
        onSuccess={handleStatusUpdated}
      />
    </div>
  );
}
