'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, Download } from 'lucide-react';
import { toast } from 'sonner';
import OrderStatsCards from './OrderStatsCards';
import OrderRow from './OrderRow';
import OrderDetailDrawer from './OrderDetailDrawer';

const TABS = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'] as const;

type TabType = (typeof TABS)[number];

export default function OrdersPageClient({
  orders: initialOrders,
  stats: initialStats,
}: {
  orders: any[];
  stats: any;
}) {
  const supabase = createClient();

  const [orders, setOrders] = useState(initialOrders || []);
  const [tab, setTab] = useState<TabType>('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [openDetail, setOpenDetail] = useState(false);

  const normalizeStatus = (value: unknown) => {
    const s = String(value || '').toLowerCase();
    if (s === 'confirmed') return 'pending';
    return s;
  };

  const refreshSnapshot = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/orders', { cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();
      setOrders(json.orders || []);
    } catch {
      // Best effort refresh.
    }
  }, []);

  useEffect(() => setOrders(initialOrders || []), [initialOrders]);

  useEffect(() => {
    const refreshOrder = async (orderId: string) => {
      try {
        const res = await fetch(`/api/admin/orders?orderId=${encodeURIComponent(orderId)}`, { cache: 'no-store' });
        if (!res.ok) return null;
        const json = await res.json();
        return json.order || null;
      } catch {
        return null;
      }
    };

    const ch = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        async (payload) => {
          const rawOrder = payload.new as any;
          const fullOrder = await refreshOrder(String(rawOrder.id || ''));
          const order = fullOrder || rawOrder;
          setOrders((prev) => {
            const without = prev.filter((o) => o.id !== order.id);
            return [order, ...without];
          });
          toast.success(`New order INR ${Math.round(order.total_amount || 0).toLocaleString('en-IN')}`);
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        async (payload) => {
          const rawOrder = payload.new as any;
          const fullOrder = await refreshOrder(String(rawOrder.id || ''));
          const order = fullOrder || rawOrder;
          setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, ...order } : o)));
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'orders' },
        (payload) => {
          const oldOrder = payload.old as any;
          setOrders((prev) => prev.filter((o) => o.id !== oldOrder.id));
        },
      )
      .subscribe();

      const pollId = setInterval(() => {
        refreshSnapshot();
      }, 8000);

    return () => {
        clearInterval(pollId);
      supabase.removeChannel(ch);
    };
    }, [supabase, refreshSnapshot]);

  const computedStats = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders
        .filter((o) => {
          const payment = String(o.payment_status || '').toLowerCase();
          const status = normalizeStatus(o.status);
          if (payment) return payment === 'paid';
          return status !== 'cancelled' && status !== 'failed' && status !== 'refunded';
        })
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

      const by = (s: string) => orders.filter((o) => normalizeStatus(o.status) === s).length;

    const todayKey = new Date().toISOString().slice(0, 10);
    const todayRevenue = orders
      .filter((o) => String(o.created_at || '').slice(0, 10) === todayKey)
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    return {
      ...initialStats,
      totalOrders,
      totalRevenue,
      pendingOrders: by('pending'),
      processingOrders: by('processing'),
      shippedOrders: by('shipped'),
      deliveredOrders: by('delivered'),
      cancelledOrders: by('cancelled'),
        refundedOrders: by('refunded'),
      todayRevenue,
      avgOrderValue: totalOrders ? totalRevenue / totalOrders : 0,
    };
  }, [orders, initialStats]);

  const computedTabCounts = useMemo(() => {
      const by = (s: string) => orders.filter((o) => normalizeStatus(o.status) === s).length;
    return {
      all: orders.length,
        pending: by('pending'),
      processing: by('processing'),
      shipped: by('shipped'),
      delivered: by('delivered'),
      cancelled: by('cancelled'),
        refunded: by('refunded'),
    };
  }, [orders]);

  const filtered = useMemo(() => {
    let list = [...orders];
    if (tab !== 'all') {
        list = list.filter((o) => normalizeStatus(o.status) === tab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((o) => {
        const id = String(o.id || '').toLowerCase();
          const name = String(o.profiles?.full_name || o.profiles?.display_name || '').toLowerCase();
          return id.includes(q) || name.includes(q);
      });
    }
    return list;
  }, [orders, tab, search]);

  const exportCsv = () => {
    const rows = filtered.map((o) => [
      o.created_at || '',
      o.id || '',
      o.profiles?.id || '',
      o.profiles?.full_name || o.profiles?.display_name || '',
      o.status || '',
      o.payment_status || '',
      o.payment_method || '',
      o.total_amount || 0,
    ]);
    const headers = ['Timestamp', 'Order ID', 'User ID', 'Customer', 'Status', 'Payment Status', 'Method', 'Amount'];
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `slate-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const openOrder = (order: any) => {
    setSelectedOrder(order);
    setOpenDetail(true);
  };

  return (
    <div className="font-[DM_Sans]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold text-[#1D1D1F]">Orders</h1>
          <p className="mt-1 text-[13px] text-[#6E6E73]">
            {computedStats.totalOrders || 0} orders · ₹{Math.round(computedStats.totalRevenue || 0).toLocaleString('en-IN')} revenue
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-full border border-[rgba(0,0,0,0.1)] bg-white px-4 py-2 text-[13px] font-semibold text-[#1D1D1F]">
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <div className="rounded-full border border-[#28C840]/20 bg-[#EDFAF0] px-4 py-2 text-[13px] font-semibold text-[#28C840]">
            Today: ₹{Math.round(computedStats.todayRevenue || 0).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      <OrderStatsCards stats={computedStats} />

      <div className="mb-3 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-3 py-1.5 text-[12px] font-semibold capitalize ${
              tab === t ? 'bg-[#1D1D1F] text-white' : 'bg-white text-[#6E6E73]'
            }`}
          >
            {t} ({computedTabCounts[t]})
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-3 py-2 text-[12px] text-[#1D1D1F]">
          <option>Date: All</option>
        </select>
        <select className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-3 py-2 text-[12px] text-[#1D1D1F]">
          <option>Seller: All</option>
        </select>
        <select className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-3 py-2 text-[12px] text-[#1D1D1F]">
          <option>Payment: All</option>
        </select>
        <select className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-3 py-2 text-[12px] text-[#1D1D1F]">
          <option>Sort: Latest</option>
        </select>
        <div className="ml-auto flex items-center rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-3 py-2">
          <Search className="mr-2 h-3.5 w-3.5 text-[#AEAEB2]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order/customer"
            className="w-[220px] bg-transparent text-[12px] text-[#1D1D1F] outline-none placeholder:text-[#AEAEB2]"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
        <div className="flex h-11 items-center justify-between border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-4">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
              <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
              <span className="h-2 w-2 rounded-full bg-[#28C840]" />
            </div>
            <p className="text-[12px] font-semibold text-[#6E6E73]">All Orders ({filtered.length})</p>
          </div>
        </div>

        <div className="grid min-w-[1220px] grid-cols-[170px_190px_160px_170px_130px_110px_90px_120px] gap-4 border-b border-[rgba(0,0,0,0.06)] px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#AEAEB2]">
          <span>Order ID</span>
          <span>Customer</span>
          <span>Items</span>
          <span>Seller</span>
          <span>Amount</span>
          <span>Status</span>
          <span>Date</span>
          <span>Actions</span>
        </div>

        {filtered.map((order) => (
          <OrderRow key={order.id} order={order} onOpen={openOrder} />
        ))}

        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-[13px] text-[#AEAEB2]">No orders found.</div>
        ) : null}
      </div>

      <OrderDetailDrawer
        open={openDetail}
        order={selectedOrder}
        onClose={() => setOpenDetail(false)}
        onUpdated={async () => {
          if (!selectedOrder?.id) return;
          try {
            const res = await fetch(`/api/admin/orders?orderId=${encodeURIComponent(selectedOrder.id)}`, { cache: 'no-store' });
            if (!res.ok) return;
            const json = await res.json();
            if (!json.order) return;
            setOrders((prev) => prev.map((o) => (o.id === json.order.id ? json.order : o)));
            setSelectedOrder(json.order);
          } catch {
            // Best effort UI refresh.
          }
        }}
      />
    </div>
  );
}
