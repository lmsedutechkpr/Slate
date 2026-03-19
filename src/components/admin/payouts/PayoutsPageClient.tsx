'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { rejectPayoutAction } from '@/app/actions/admin';
import PayoutStatsCards from './PayoutStatsCards';
import PayoutRequestRow from './PayoutRequestRow';
import ProcessPayoutModal from './ProcessPayoutModal';

const TABS = ['pending', 'completed', 'rejected', 'all'] as const;

type TabType = (typeof TABS)[number];

export default function PayoutsPageClient({
  payoutTransactions,
  instructorsPending,
  sellersPending,
  stats,
}: {
  payoutTransactions: any[];
  instructorsPending: any[];
  sellersPending: any[];
  stats: any;
}) {
  const supabase = createClient();
  const [tab, setTab] = useState<TabType>('pending');
  const [rows, setRows] = useState<any[]>(payoutTransactions || []);
  const [instPendingRows, setInstPendingRows] = useState<any[]>(instructorsPending || []);
  const [sellPendingRows, setSellPendingRows] = useState<any[]>(sellersPending || []);
  const [selected, setSelected] = useState<any | null>(null);
  const [openProcess, setOpenProcess] = useState(false);

  const refreshSnapshot = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/payouts', { cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();
      setRows(json.payoutTransactions || []);
      setInstPendingRows(json.instructorsPending || []);
      setSellPendingRows(json.sellersPending || []);
    } catch {
      // Best effort refresh.
    }
  }, []);

  useEffect(() => {
    setRows(payoutTransactions || []);
    setInstPendingRows(instructorsPending || []);
    setSellPendingRows(sellersPending || []);
  }, [payoutTransactions, instructorsPending, sellersPending]);

    useEffect(() => {
        refreshSnapshot();

    const channel = supabase
      .channel('admin-payouts-stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payouts' }, () => {
        refreshSnapshot();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'instructor_profiles' }, () => {
        refreshSnapshot();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seller_profiles' }, () => {
        refreshSnapshot();
      })
      .subscribe();

      const pollId = setInterval(() => {
        refreshSnapshot();
      }, 8000);

    return () => {
        clearInterval(pollId);
      supabase.removeChannel(channel);
    };
    }, [supabase, refreshSnapshot]);

  const fallbackRows = useMemo(() => {
    const fromInstructors = (instPendingRows || []).map((i: any, idx: number) => ({
      id: `inst-${idx}-${i.user_id}`,
      instructor_id: i.user_id,
      amount: Number(i.pending_balance || 0),
      pending_balance: Number(i.pending_balance || 0),
      total_paid_out: Number(i.total_paid_out || 0),
      payout_method: i.payout_method || 'bank',
      status: 'pending',
      created_at: new Date().toISOString(),
      role: 'instructor',
      profiles: i.profiles,
    }));

    const fromSellers = (sellPendingRows || []).map((s: any, idx: number) => ({
      id: `sell-${idx}-${s.user_id}`,
      instructor_id: s.user_id,
      amount: Number(s.pending_balance || 0),
      pending_balance: Number(s.pending_balance || 0),
      total_paid_out: Number(s.total_paid_out || 0),
      payout_method: s.payout_method || 'bank',
      status: 'pending',
      created_at: new Date().toISOString(),
      role: 'seller',
      profiles: s.profiles,
    }));

    return [...fromInstructors, ...fromSellers];
  }, [instPendingRows, sellPendingRows]);

  const computedStats = useMemo(() => {
      const normalized = (rows || []).map((r) => ({
        ...r,
        statusNormalized: String(r.status || '').toLowerCase(),
      }));

      const pendingRows = normalized.filter((r) => r.statusNormalized === 'pending');
      const completedRows = normalized.filter(
        (r) => r.statusNormalized === 'completed' || r.statusNormalized === 'processed' || r.statusNormalized === 'approved',
      );

      const pendingRequests = pendingRows.length;
      const totalPending = pendingRows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
      const totalPaidOut = completedRows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
      const instructorsWaiting = pendingRows.filter(
        (r) => String(r.role || r.recipient_type || '').toLowerCase() !== 'seller',
      ).length;
      const sellersWaiting = pendingRows.filter(
        (r) => String(r.role || r.recipient_type || '').toLowerCase() === 'seller',
      ).length;

    return {
      ...stats,
      pendingRequests,
      totalPending,
      totalPaidOut,
        instructorsPending: instructorsWaiting,
        sellersPending: sellersWaiting,
    };
    }, [rows, stats]);

  const effectiveRows = rows.length ? rows : fallbackRows;

  const filtered = useMemo(() => {
    if (tab === 'all') return effectiveRows;
    return effectiveRows.filter((r) => {
      const status = String(r.status || '').toLowerCase();
      if (tab === 'completed') return status === 'completed' || status === 'processed' || status === 'approved';
      if (tab === 'rejected') return status === 'rejected' || status === 'failed';
      return status === tab;
    });
  }, [effectiveRows, tab]);

  const processAll = () => {
    const firstPending = filtered.find((r) => (r.status || '').toLowerCase() === 'pending');
    if (!firstPending) {
      toast('No pending requests');
      return;
    }
    setSelected(firstPending);
    setOpenProcess(true);
  };

  return (
    <div className="font-[DM_Sans]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold text-[#1D1D1F]">Payouts</h1>
          <p className="mt-1 text-[13px] text-[#6E6E73]">Manage instructor and seller payouts</p>
        </div>
        <button
          onClick={processAll}
          disabled={(computedStats.pendingRequests || 0) === 0}
          className="rounded-full bg-[#1D1D1F] px-5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50"
        >
          Process All Pending
        </button>
      </div>

      <PayoutStatsCards stats={computedStats} />

      <div className="mb-3 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-3 py-1.5 text-[12px] font-semibold capitalize ${tab === t ? 'bg-[#1D1D1F] text-white' : 'bg-white text-[#6E6E73]'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
        <div className="flex h-11 items-center justify-between border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-4">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
              <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
              <span className="h-2 w-2 rounded-full bg-[#28C840]" />
            </div>
            <p className="text-[12px] font-semibold text-[#6E6E73]">Pending Payout Requests</p>
          </div>
          <p className="text-[12px] text-[#6E6E73]">{filtered.length} requests</p>
        </div>

        <div className="grid min-w-[1060px] grid-cols-[250px_110px_170px_130px_150px_120px_130px] gap-4 border-b border-[rgba(0,0,0,0.06)] px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#AEAEB2]">
          <span>User</span>
          <span>Role</span>
          <span>Amount</span>
          <span>Method</span>
          <span>Requested</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        {filtered.map((row) => (
          <PayoutRequestRow
            key={row.id}
            row={row}
            onProcess={(r) => {
              setSelected(r);
              setOpenProcess(true);
            }}
              onReject={async (r) => {
                const userId = String(r.recipient_id || r.instructor_id || r.user_id || '').trim();
                const role = String(r.role || r.recipient_type || r.profiles?.role || 'instructor').toLowerCase() === 'seller'
                  ? 'seller'
                  : 'instructor';

                if (!r.id || !userId) {
                  toast.error('Missing payout recipient details.');
                  return;
                }

                const res = await rejectPayoutAction({
                  payoutId: String(r.id),
                  userId,
                  role,
                });

                if (!res.success) {
                  toast.error(res.error || 'Unable to reject payout request.');
                  return;
                }

                setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: 'rejected' } : x)));
                await refreshSnapshot();
                toast.success('Payout request rejected.');
            }}
          />
        ))}

        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-[13px] text-[#AEAEB2]">No payout requests.</div>
        ) : null}
      </div>

      <ProcessPayoutModal
        open={openProcess}
        row={selected}
        onClose={() => setOpenProcess(false)}
          onDone={async () => {
            setRows((prev) => prev.map((x) => (x.id === selected?.id ? { ...x, status: 'completed' } : x)));
              await refreshSnapshot();
        }}
      />
    </div>
  );
}
