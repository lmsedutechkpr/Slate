'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, RotateCcw, Package } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import TrafficLights from '@/components/auth/TrafficLights';

import ReturnStatsCards from './ReturnStatsCards';
import ReturnCard from './ReturnCard';
import ReturnDetailDrawer from './ReturnDetailDrawer';
import ResolutionModal from './ResolutionModal';

interface ReturnsPageClientProps {
  initialReturns: any[];
  stats: any;
  userId: string;
  useFallback: boolean;
}

const TABS = ['All', 'Pending', 'Approved', 'Rejected', 'Refunded'];

export default function ReturnsPageClient({ initialReturns, stats: initialStats, userId, useFallback }: ReturnsPageClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [returns, setReturns] = useState(initialReturns);
  const [stats, setStats] = useState(initialStats);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [resolveItem, setResolveItem] = useState<any>(null);

  // Realtime subscription for new/updated returns
  useEffect(() => {
    if (useFallback) return; // No realtime for support_tickets fallback

    const channel = supabase
      .channel('seller-returns')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'returns',
      }, async (payload) => {
        // Fetch full return with joins
        try {
          const res = await fetch(`/api/seller/returns?returnId=${payload.new.id}`);
          const json = await res.json();
          if (json.returnItem) {
            // Check if this return belongs to our products
            if (json.returnItem.order_items?.seller_id === userId || !json.returnItem.order_item_id) {
              setReturns(prev => [json.returnItem, ...prev]);
              setStats((prev: any) => ({
                ...prev,
                total: prev.total + 1,
                requested: prev.requested + 1,
              }));
              toast.info('New return request received');
            }
          }
        } catch {}
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'returns',
      }, async (payload) => {
        try {
          const res = await fetch(`/api/seller/returns?returnId=${payload.new.id}`);
          const json = await res.json();
          if (json.returnItem) {
            setReturns(prev => prev.map(r => r.id === json.returnItem.id ? json.returnItem : r));
          }
        } catch {}
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, useFallback]);

  // Filtering
  const filteredReturns = useMemo(() => {
    let result = [...returns];

    // Tab filter
    if (activeTab === 'Pending') result = result.filter(r => r.status === 'requested');
    if (activeTab === 'Approved') result = result.filter(r => r.status === 'approved');
    if (activeTab === 'Rejected') result = result.filter(r => r.status === 'rejected');
    if (activeTab === 'Refunded') result = result.filter(r => r.status === 'refunded' || r.status === 'resolved');

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.id?.toLowerCase().includes(q) ||
        r.reason?.toLowerCase().includes(q) ||
        r.order_items?.product_name?.toLowerCase().includes(q) ||
        r.orders?.profiles?.full_name?.toLowerCase().includes(q) ||
        r.customer?.full_name?.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortOption === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortOption === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return 0;
    });

    return result;
  }, [returns, activeTab, searchQuery, sortOption]);

  // Tab counts
  const tabCounts = useMemo(() => ({
    All: returns.length,
    Pending: returns.filter(r => r.status === 'requested').length,
    Approved: returns.filter(r => r.status === 'approved').length,
    Rejected: returns.filter(r => r.status === 'rejected').length,
    Refunded: returns.filter(r => r.status === 'refunded' || r.status === 'resolved').length,
  }), [returns]);

  // Handle resolution
  const handleResolved = (returnId: string, newStatus: string) => {
    setReturns(prev => prev.map(r =>
      r.id === returnId
        ? { ...r, status: newStatus, resolution: newStatus, resolved_at: new Date().toISOString() }
        : r
    ));

    // Update stats
    setStats((prev: any) => {
      const updated = { ...prev, requested: Math.max(0, prev.requested - 1) };
      if (newStatus === 'approved') updated.approved = prev.approved + 1;
      if (newStatus === 'rejected') updated.rejected = prev.rejected + 1;
      if (newStatus === 'refunded') updated.refunded = prev.refunded + 1;
      return updated;
    });

    setDrawerOpen(false);
    setSelectedReturn(null);
  };

  const openDrawer = (returnItem: any) => {
    setSelectedReturn(returnItem);
    setDrawerOpen(true);
  };

  const openResolveModal = (returnItem: any) => {
    setResolveItem(returnItem);
    setDrawerOpen(false);
  };

  return (
    <div className="mx-auto max-w-6xl pb-24">
      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-[DM_Sans] text-[26px] font-bold text-[#1D1D1F]">Returns</h1>
          <p className="mt-1 text-[13px] text-[#6E6E73]">
            {stats.total} return{stats.total !== 1 ? 's' : ''} · {stats.requested} pending review
          </p>
        </div>
        {stats.requested > 0 && (
          <div className="flex items-center gap-2 rounded-full border border-[#FEBC2E]/30 bg-[#FFF8EC] px-4 py-2">
            <RotateCcw className="h-[14px] w-[14px] text-[#FEBC2E]" />
            <span className="font-[DM_Sans] text-[13px] font-semibold text-[#FEBC2E]">
              {stats.requested} need{stats.requested === 1 ? 's' : ''} attention
            </span>
          </div>
        )}
      </div>

      {/* STATS */}
      <ReturnStatsCards stats={stats} />

      {/* FILTERS */}
      <div className="mb-5 flex flex-wrap items-center gap-4 border-b border-[rgba(0,0,0,0.06)] pb-4">
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
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
          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className="w-[160px] rounded-xl border-none bg-white text-[13px] shadow-sm">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[rgba(0,0,0,0.08)]">
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative w-[220px]">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#AEAEB2]" />
            <input
              type="text"
              placeholder="Product, customer, reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-[#F5F5F7] py-2 pl-9 pr-4 text-[13px] text-[#1D1D1F] placeholder:text-[#AEAEB2] focus:outline-none focus:ring-1 focus:ring-[rgba(0,0,0,0.15)]"
            />
          </div>
        </div>
      </div>

      {/* CONTENT */}
      {returns.length === 0 ? (
        /* Global empty state */
        <div className="relative flex flex-col items-center justify-center rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white py-24 shadow-sm">
          <div className="absolute left-4 top-4"><TrafficLights size="sm" /></div>
          <RotateCcw className="h-12 w-12 text-[#AEAEB2]" />
          <h3 className="mt-5 font-[DM_Sans] text-[22px] font-bold text-[#1D1D1F]">No returns yet</h3>
          <p className="mt-2 max-w-sm text-center text-[14px] text-[#6E6E73]">
            Return requests from customers will appear here. You can review, approve, or reject them.
          </p>
          <button
            onClick={() => router.push('/seller/orders')}
            className="mt-8 rounded-full bg-[#1D1D1F] px-6 py-2.5 font-[DM_Sans] text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            View Orders
          </button>
        </div>
      ) : filteredReturns.length === 0 ? (
        /* Tab empty state */
        <div className="flex flex-col items-center justify-center py-20">
          <Package className="h-9 w-9 text-[#AEAEB2]" />
          <h3 className="mt-4 font-[DM_Sans] text-[16px] font-semibold text-[#1D1D1F]">
            No {activeTab.toLowerCase()} returns
          </h3>
          <p className="mt-2 text-[13px] text-[#6E6E73]">Try a different filter</p>
        </div>
      ) : (
        /* Return cards */
        <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
          {/* Titlebar */}
          <div className="flex h-11 items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
            <TrafficLights size="sm" />
            <span className="ml-3 font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
              {activeTab} Returns ({filteredReturns.length})
            </span>
          </div>

          {/* Cards */}
          <div className="divide-y divide-[rgba(0,0,0,0.05)]">
            {filteredReturns.map(returnItem => (
              <ReturnCard
                key={returnItem.id}
                returnItem={returnItem}
                onClick={() => openDrawer(returnItem)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      <ReturnDetailDrawer
        open={drawerOpen}
        returnItem={selectedReturn}
        onClose={() => { setDrawerOpen(false); setSelectedReturn(null); }}
        onResolve={openResolveModal}
      />

      {/* Resolution Modal */}
      <ResolutionModal
        open={!!resolveItem}
        returnItem={resolveItem}
        onClose={() => setResolveItem(null)}
        onResolved={handleResolved}
      />
    </div>
  );
}
