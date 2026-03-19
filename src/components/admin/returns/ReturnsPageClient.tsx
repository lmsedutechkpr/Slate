'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Search } from 'lucide-react';
import { toast } from 'sonner';
import ReturnStatsCards from '@/components/admin/returns/ReturnStatsCards';
import ReturnRow from '@/components/admin/returns/ReturnRow';
import ReturnDetailDrawer from '@/components/admin/returns/ReturnDetailDrawer';
import MediationModal from '@/components/admin/returns/MediationModal';

type ReturnRowType = Record<string, any>;

const TABS = ['all', 'pending', 'approved', 'rejected', 'disputed'] as const;

function normalizeStatus(status?: string) {
  const value = String(status || '').toLowerCase();
  if (value === 'pending' || value === 'requested' || value === 'pending_review') return 'pending';
  if (value === 'approved' || value === 'resolved') return 'approved';
  if (value === 'rejected') return 'rejected';
  if (value === 'disputed') return 'disputed';
  return 'pending';
}

function calcStats(rows: ReturnRowType[], totalOrders: number) {
  const counts = rows.reduce(
    (acc, row) => {
      const s = normalizeStatus(row.status);
      acc.total += 1;
      if (s === 'pending') acc.pending += 1;
      if (s === 'approved') acc.approved += 1;
      if (s === 'rejected') acc.rejected += 1;
      return acc;
    },
    { total: 0, pending: 0, approved: 0, rejected: 0 },
  );

  const returnRate = totalOrders > 0 ? (counts.total / totalOrders) * 100 : 0;
  return {
    totalReturns: counts.total,
    pendingReturns: counts.pending,
    approvedReturns: counts.approved,
    rejectedReturns: counts.rejected,
    returnRate,
  };
}

export default function ReturnsPageClient({
  returnsData,
  totalOrders,
}: {
  returnsData: ReturnRowType[];
  totalOrders: number;
}) {
  const [rows, setRows] = useState<ReturnRowType[]>(returnsData || []);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('all');
  const [search, setSearch] = useState('');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [sellerFilter, setSellerFilter] = useState('all');
  const [selected, setSelected] = useState<ReturnRowType | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mediationOpen, setMediationOpen] = useState(false);
  const [mediationTarget, setMediationTarget] = useState<ReturnRowType | null>(null);

  const stats = useMemo(() => calcStats(rows, totalOrders), [rows, totalOrders]);

  const reasons = useMemo(() => {
    const values = new Set<string>();
    rows.forEach((row) => {
      const reason = String(row.reason || '').trim();
      if (reason) values.add(reason);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const sellers = useMemo(() => {
    const values = new Set<string>();
    rows.forEach((row) => {
      const seller = String(row.order_items?.seller_profiles?.store_name || '').trim();
      if (seller) values.add(seller);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const normalized = normalizeStatus(row.status);
      if (activeTab !== 'all' && normalized !== activeTab) return false;

      if (reasonFilter !== 'all' && String(row.reason || '') !== reasonFilter) return false;

      const sellerName = String(row.order_items?.seller_profiles?.store_name || '');
      if (sellerFilter !== 'all' && sellerName !== sellerFilter) return false;

      if (!query) return true;

      const customer = String(row.profiles?.full_name || row.profiles?.display_name || '').toLowerCase();
      const product = String(row.order_items?.products?.name || '').toLowerCase();
      const id = String(row.id || '').toLowerCase();
      const reason = String(row.reason || '').toLowerCase();

      return customer.includes(query) || product.includes(query) || id.includes(query) || reason.includes(query);
    });
  }, [rows, activeTab, reasonFilter, sellerFilter, search]);

  const tabCounts = useMemo(
    () => ({
      all: rows.length,
      pending: rows.filter((r) => normalizeStatus(r.status) === 'pending').length,
      approved: rows.filter((r) => normalizeStatus(r.status) === 'approved').length,
      rejected: rows.filter((r) => normalizeStatus(r.status) === 'rejected').length,
      disputed: rows.filter((r) => normalizeStatus(r.status) === 'disputed').length,
    }),
    [rows],
  );

  const patchRow = (id: string, updater: (row: ReturnRowType) => ReturnRowType) => {
    setRows((prev) => prev.map((row) => (String(row.id) === String(id) ? updater(row) : row)));
    setSelected((prev) => (prev && String(prev.id) === String(id) ? updater(prev) : prev));
  };

  const postJson = async (url: string, payload: Record<string, any>) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json?.error || 'Action failed');
    }
    return json;
  };

  const handleApprove = async (row: ReturnRowType) => {
    try {
      await postJson('/api/admin/returns/resolve', {
        returnId: row.id,
        source: row.source,
        action: 'approved',
      });
      patchRow(String(row.id), (current) => ({ ...current, status: 'approved', updated_at: new Date().toISOString() }));
      toast.success('Return approved');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to approve return');
    }
  };

  const handleReject = async (row: ReturnRowType) => {
    try {
      await postJson('/api/admin/returns/resolve', {
        returnId: row.id,
        source: row.source,
        action: 'rejected',
      });
      patchRow(String(row.id), (current) => ({ ...current, status: 'rejected', updated_at: new Date().toISOString() }));
      toast.success('Return rejected');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to reject return');
    }
  };

  const handleMediate = async ({ resolution, note }: { resolution: string; note: string }) => {
    if (!mediationTarget) return;
    try {
      await postJson('/api/admin/returns/mediate', {
        returnId: mediationTarget.id,
        source: mediationTarget.source,
        resolution,
        note,
      });
      patchRow(String(mediationTarget.id), (current) => ({
        ...current,
        status: 'disputed',
        resolution,
        resolution_note: note,
        updated_at: new Date().toISOString(),
      }));
      toast.success('Mediation started');
      setMediationTarget(null);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to start mediation');
    }
  };

  const handleRemindSeller = async (row: ReturnRowType) => {
    try {
      await postJson('/api/admin/returns/remind-seller', {
        returnId: row.id,
        source: row.source,
      });
      toast.success('Reminder sent to seller');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to send reminder');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[26px] font-extrabold tracking-tight text-[#1D1D1F]">Returns Management</h1>
        <p className="mt-1 text-[13px] text-[#6E6E73]">Monitor and resolve return requests with SLA-aware actions.</p>
      </div>

      {stats.returnRate > 5 ? (
        <div className="mb-5 flex items-start gap-2 rounded-2xl border border-[rgba(255,95,87,0.28)] bg-[rgba(255,95,87,0.08)] px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-[#FF5F57]" />
          <div>
            <p className="text-[13px] font-semibold text-[#1D1D1F]">Return rate alert</p>
            <p className="text-[12px] text-[#6E6E73]">Current rate is {stats.returnRate.toFixed(2)}%. Investigate product quality and seller fulfillment.</p>
          </div>
        </div>
      ) : null}

      <ReturnStatsCards stats={stats} />

      <div className="mb-4 rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                activeTab === tab
                  ? 'bg-[#1D1D1F] text-white'
                  : 'border border-[rgba(0,0,0,0.08)] bg-white text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              {tab[0].toUpperCase() + tab.slice(1)} ({tabCounts[tab]})
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_180px_200px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#AEAEB2]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer, product, reason, id..."
              className="h-10 w-full rounded-xl border border-[rgba(0,0,0,0.1)] bg-white pl-9 pr-3 text-[13px] outline-none focus:border-[#007AFF]"
            />
          </div>

          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="h-10 rounded-xl border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] outline-none focus:border-[#007AFF]"
          >
            <option value="all">All Reasons</option>
            {reasons.map((reason) => (
              <option key={reason} value={reason}>
                {reason.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          <select
            value={sellerFilter}
            onChange={(e) => setSellerFilter(e.target.value)}
            className="h-10 rounded-xl border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] outline-none focus:border-[#007AFF]"
          >
            <option value="all">All Sellers</option>
            {sellers.map((seller) => (
              <option key={seller} value={seller}>
                {seller}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
        <div className="overflow-x-auto">
          <div className="min-w-[1240px] grid grid-cols-[120px_170px_220px_160px_140px_100px_120px_90px_120px] gap-3 border-b border-[rgba(0,0,0,0.08)] bg-[#F5F5F7] px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-[#6E6E73]">
            <p>Return ID</p>
            <p>Customer</p>
            <p>Product</p>
            <p>Seller</p>
            <p>Reason</p>
            <p>Amount</p>
            <p>Status</p>
            <p>Age</p>
            <p>Actions</p>
          </div>

          {filteredRows.length ? (
            filteredRows.map((row) => (
              <ReturnRow
                key={row.id}
                row={row}
                onView={(value) => {
                  setSelected(value);
                  setDrawerOpen(true);
                }}
                onMediate={(value) => {
                  setMediationTarget(value);
                  setMediationOpen(true);
                }}
              />
            ))
          ) : (
            <div className="px-6 py-10 text-center text-[13px] text-[#6E6E73]">No return requests match your filters.</div>
          )}
        </div>
      </div>

      <ReturnDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        row={selected}
        onApprove={handleApprove}
        onReject={handleReject}
        onRemindSeller={handleRemindSeller}
      />

      <MediationModal
        open={mediationOpen}
        onOpenChange={(next) => {
          setMediationOpen(next);
          if (!next) setMediationTarget(null);
        }}
        row={mediationTarget}
        onSubmit={handleMediate}
      />
    </div>
  );
}
