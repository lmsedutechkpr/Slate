'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { bulkModerateContentAction, moderateContentAction } from '@/app/actions/admin';
import ContentRow from './ContentRow';
import ContentStatsCards from './ContentStatsCards';
import type { ProductItem, ProductsStats } from './types';

interface ProductsPageClientProps {
  products: ProductItem[];
  stats: ProductsStats;
  adminId: string;
}

type TabFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'draft';

function normalizeProductStatus(status?: string | null): TabFilter {
  const s = (status || 'draft').toLowerCase();
  if (s === 'active' || s === 'approved') return 'approved';
  if (s === 'pending' || s === 'rejected' || s === 'draft') return s;
  return 'draft';
}

export default function ProductsPageClient({ products: initialProducts, stats, adminId }: ProductsPageClientProps) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'sold' | 'rating'>('newest');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkRejectReason, setBulkRejectReason] = useState('');
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
  const [loadingBulk, setLoadingBulk] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => setProducts(initialProducts), [initialProducts]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-content-products')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products' },
        (payload) => {
          const next = payload.new as ProductItem;
          setProducts((prev) => {
            const exists = prev.some((p) => p.id === next.id);
            if (!exists && next.status === 'pending') {
              toast('New product submitted for review!', { style: { color: '#FEBC2E' } });
              return [next, ...prev];
            }
            return prev.map((p) => (p.id === next.id ? { ...p, ...next } : p));
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.product_categories?.name && set.add(p.product_categories.name));
    return Array.from(set);
  }, [products]);

  const tabCounts = useMemo(() => {
    return {
      all: products.length,
      pending: products.filter((p) => normalizeProductStatus(p.status) === 'pending').length,
      approved: products.filter((p) => normalizeProductStatus(p.status) === 'approved').length,
      rejected: products.filter((p) => normalizeProductStatus(p.status) === 'rejected').length,
      draft: products.filter((p) => normalizeProductStatus(p.status) === 'draft').length,
    };
  }, [products]);

  const filtered = useMemo(() => {
    let data = [...products];

    if (activeTab !== 'all') data = data.filter((p) => normalizeProductStatus(p.status) === activeTab);
    if (categoryFilter !== 'all') data = data.filter((p) => p.product_categories?.name === categoryFilter);

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((p) => {
        const seller = p.seller_profiles?.store_name || p.seller_profiles?.profiles?.full_name || '';
        return p.name.toLowerCase().includes(q) || seller.toLowerCase().includes(q);
      });
    }

    data.sort((a, b) => {
      if (sortBy === 'sold') return (b.total_sold || 0) - (a.total_sold || 0);
      if (sortBy === 'rating') return (b.avg_rating || 0) - (a.avg_rating || 0);
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    return data;
  }, [products, activeTab, categoryFilter, search, sortBy]);

  const allVisibleSelected = filtered.length > 0 && filtered.every((c) => selectedIds.includes(c.id));

  const toggleAllVisible = (next: boolean) => {
    if (!next) {
      setSelectedIds((prev) => prev.filter((id) => !filtered.some((f) => f.id === id)));
      return;
    }
    setSelectedIds((prev) => Array.from(new Set([...prev, ...filtered.map((c) => c.id)])));
  };

  const runAction = async (productId: string, action: 'approve' | 'reject' | 'revoke' | 'pending', note?: string) => {
    const result = await moderateContentAction({ itemId: productId, adminId, type: 'product', action, note });
    if (!result.success) {
      toast.error(result.error || 'Action failed');
      return;
    }
    toast.success(
      action === 'approve'
        ? 'Product approved and live!'
        : action === 'reject'
          ? 'Product rejected. Creator notified.'
          : action === 'revoke'
            ? 'Product approval revoked.'
            : 'Product moved to pending review.'
    );
    router.refresh();
  };

  const bulkApprove = async () => {
    if (selectedIds.length === 0) return;
    setLoadingBulk(true);
    const result = await bulkModerateContentAction({
      adminId,
      type: 'product',
      action: 'approve',
      itemIds: selectedIds,
    });
    setLoadingBulk(false);
    if (!result.success) {
      toast.error(result.error || 'Bulk approval failed');
      return;
    }
    toast.success(`${selectedIds.length} products approved and live.`);
    setSelectedIds([]);
    router.refresh();
  };

  const bulkReject = async () => {
    if (selectedIds.length === 0) return;
    if (bulkRejectReason.trim().length < 50) {
      toast.error('Rejection feedback must be at least 50 characters.');
      return;
    }
    setLoadingBulk(true);
    const result = await bulkModerateContentAction({
      adminId,
      type: 'product',
      action: 'reject',
      itemIds: selectedIds,
      note: bulkRejectReason,
    });
    setLoadingBulk(false);
    if (!result.success) {
      toast.error(result.error || 'Bulk rejection failed');
      return;
    }
    toast.success(`${selectedIds.length} products rejected. Creators notified.`);
    setSelectedIds([]);
    setBulkRejectReason('');
    setBulkRejectOpen(false);
    router.refresh();
  };

  return (
    <div className="font-[DM_Sans]">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold text-[#1D1D1F]">Products</h1>
          <p className="mt-1 text-[13px] text-[#6E6E73]">{stats.totalProducts} products on platform</p>
        </div>
        {stats.pendingProducts > 0 ? (
          <div className="rounded-full border border-[#FEBC2E]/30 bg-[#FFF8EC] px-3 py-1.5 text-[13px] font-semibold text-[#FEBC2E]">
            {stats.pendingProducts} pending review
          </div>
        ) : null}
      </div>

      <ContentStatsCards type="product" stats={stats} />

      <div className="mb-4 flex flex-wrap gap-2">
        {(['all', 'pending', 'approved', 'rejected', 'draft'] as TabFilter[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-3 py-1.5 text-[12px] font-semibold capitalize ${
              activeTab === tab
                ? tab === 'pending'
                  ? 'bg-[#FEBC2E]/20 text-[#FEBC2E]'
                  : 'bg-[#1D1D1F] text-white'
                : 'bg-white text-[#6E6E73]'
            }`}
          >
            {tab} ({tabCounts[tab]})
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-3 py-2 text-[12px] text-[#1D1D1F]"
        >
          <option value="all">All Categories</option>
          {categoryOptions.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'newest' | 'sold' | 'rating')}
          className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-3 py-2 text-[12px] text-[#1D1D1F]"
        >
          <option value="newest">Newest</option>
          <option value="sold">Most Sold</option>
          <option value="rating">Highest Rated</option>
        </select>

        <div className="ml-auto flex items-center rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-3 py-2">
          <Search className="mr-2 h-3.5 w-3.5 text-[#AEAEB2]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Product name, seller..."
            className="w-[230px] bg-transparent text-[12px] text-[#1D1D1F] outline-none placeholder:text-[#AEAEB2]"
          />
        </div>
      </div>

      {selectedIds.length > 0 ? (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white px-4 py-3">
          <span className="text-[13px] text-[#6E6E73]">{selectedIds.length} selected</span>
          <button
            type="button"
            disabled={loadingBulk}
            onClick={bulkApprove}
            className="rounded-full bg-[#28C840] px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-60"
          >
            Approve All
          </button>
          <button
            type="button"
            disabled={loadingBulk}
            onClick={() => setBulkRejectOpen(true)}
            className="rounded-full border border-[#FF5F57]/30 px-4 py-2 text-[12px] font-semibold text-[#FF5F57] disabled:opacity-60"
          >
            Reject All
          </button>
          <button type="button" onClick={() => setSelectedIds([])} className="ml-auto text-[12px] text-[#6E6E73] underline">
            Clear
          </button>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
        <div className="border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-4 py-3">
          <div className="mb-2 flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
            <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
            <span className="h-2 w-2 rounded-full bg-[#28C840]" />
          </div>
          <p className="text-[12px] font-semibold text-[#6E6E73]">All Products ({filtered.length})</p>
        </div>

        <div className="min-w-[1080px] grid-cols-[40px_2.3fr_1.4fr_1fr_1fr_1fr_1fr_1fr] gap-4 border-b border-[rgba(0,0,0,0.06)] px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#AEAEB2] grid">
          <input
            type="checkbox"
            checked={allVisibleSelected}
            onChange={(e) => toggleAllVisible(e.target.checked)}
            aria-label="Select all"
          />
          <span>Image + Name</span>
          <span>Seller/Store</span>
          <span>Category</span>
          <span>Price</span>
          <span>Status</span>
          <span>Stock</span>
          <span>Actions</span>
        </div>

        {filtered.length === 0 ? (
          activeTab === 'pending' ? (
            <div className="px-6 py-14 text-center">
              <p className="text-[20px] text-[#28C840]">All content reviewed!</p>
              <p className="mt-1 text-[13px] text-[#6E6E73]">No pending submissions.</p>
            </div>
          ) : (
            <div className="px-6 py-14 text-center">
              <p className="text-[20px] text-[#AEAEB2]">No products yet</p>
              <p className="mt-1 text-[13px] text-[#6E6E73]">Products will appear here once sellers submit.</p>
            </div>
          )
        ) : (
          filtered.map((product) => (
            <ContentRow
              key={product.id}
              type="product"
              item={product}
              checked={selectedIds.includes(product.id)}
              onCheckedChange={(checked) =>
                setSelectedIds((prev) =>
                  checked ? [...prev, product.id] : prev.filter((id) => id !== product.id)
                )
              }
              onView={() => router.push(`/admin/products/${product.id}`)}
              onApprove={() => runAction(product.id, 'approve')}
              onReject={() => {
                const reason = window.prompt('Provide rejection reason (min 50 chars):', '');
                if (!reason) return;
                runAction(product.id, 'reject', reason);
              }}
              onRevoke={() => runAction(product.id, 'revoke', 'Approval revoked by admin.')}
            />
          ))
        )}
      </div>

      {bulkRejectOpen ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/20 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
            <h3 className="text-[18px] font-bold text-[#1D1D1F]">Reject Selected Products</h3>
            <p className="mt-1 text-[12px] text-[#6E6E73]">One reason will be applied to all selected items.</p>
            <textarea
              rows={4}
              value={bulkRejectReason}
              onChange={(e) => setBulkRejectReason(e.target.value)}
              className="mt-3 w-full resize-none rounded-xl bg-[#F5F5F7] p-3 text-[13px] text-[#1D1D1F] outline-none"
              placeholder="Explain what needs to be fixed before resubmission..."
            />
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded-full px-4 py-2 text-[13px] text-[#6E6E73]" onClick={() => setBulkRejectOpen(false)}>
                Cancel
              </button>
              <button
                className="rounded-full bg-[#FF5F57] px-5 py-2 text-[13px] font-semibold text-white"
                onClick={bulkReject}
                disabled={loadingBulk}
              >
                Send Rejection
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
