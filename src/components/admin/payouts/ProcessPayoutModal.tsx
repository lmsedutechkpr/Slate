'use client';

import { useState } from 'react';
import { processPayoutAction } from '@/app/actions/admin';
import { toast } from 'sonner';

export default function ProcessPayoutModal({
  open,
  row,
  onClose,
  onDone,
}: {
  open: boolean;
  row: any | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const recipientName =
    row?.profiles?.full_name ||
    row?.profiles?.display_name ||
    (row?.profiles?.email ? String(row.profiles.email).split('@')[0] : null) ||
    (row?.recipient_id ? `User ${String(row.recipient_id).slice(0, 8)}` : null) ||
    'Unknown User';

  if (!open || !row) return null;

  const confirm = async () => {
    if (!reference.trim()) {
      toast.error('Transaction reference is required.');
      return;
    }
    setBusy(true);
    const res = await processPayoutAction({
      payoutId: row.id,
        userId: row.recipient_id || row.instructor_id || row.user_id,
        role: row.role || row.recipient_type || row.profiles?.role || 'instructor',
      amount: Number(row.amount || row.pending_balance || 0),
      reference: reference.trim(),
      note: note.trim() || null,
      currentPendingBalance: Number(row.pending_balance || 0),
      currentPaidOut: Number(row.total_paid_out || 0),
    });
    setBusy(false);
    if (!res.success) {
      toast.error(res.error || 'Unable to process payout');
      return;
    }
    toast.success(`₹${Math.round(row.amount || row.pending_balance || 0).toLocaleString('en-IN')} payout processed!`);
    onDone();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/15" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-2xl">
        <div className="p-6">
          <div className="mb-4 flex gap-1">
            <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
            <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
            <span className="h-2 w-2 rounded-full bg-[#28C840]" />
          </div>
          <h3 className="text-[18px] font-bold text-[#1D1D1F]">Process Payout</h3>

          <div className="mt-4 rounded-xl bg-[#F5F5F7] p-4">
            <div className="mb-3 flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF5F57]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#FEBC2E]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#28C840]" />
            </div>
              <p className="text-[13px] font-semibold text-[#1D1D1F]">{recipientName}</p>
            <p className="text-[12px] text-[#6E6E73]">{row.role || row.profiles?.role || 'instructor'}</p>
            <p className="mt-2 text-[12px] text-[#6E6E73]">Method: {row.payout_method || 'bank'}</p>
          </div>

          <p className="mt-5 text-center text-[36px] font-extrabold text-[#1D1D1F]">₹{Math.round(row.amount || row.pending_balance || 0).toLocaleString('en-IN')}</p>

          <div className="mt-4">
            <label className="mb-1 block text-[12px] text-[#6E6E73]">Transaction Reference</label>
            <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="UTR / transaction ID" className="h-10 w-full rounded-xl border border-[rgba(0,0,0,0.08)] px-3 text-[13px] outline-none" />
          </div>

          <div className="mt-3">
            <label className="mb-1 block text-[12px] text-[#6E6E73]">Processing Note</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Optional note..." className="w-full rounded-xl border border-[rgba(0,0,0,0.08)] p-3 text-[13px] outline-none" />
          </div>

          <div className="mt-4 rounded-xl bg-[#EDFAF0] p-3 text-[12px] text-[#28C840]">
            <p className="font-semibold">After processing:</p>
            <p>• Pending balance will be reduced</p>
            <p>• Creator will be notified</p>
            <p>• Transaction will be logged</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] p-4">
          <button onClick={onClose} className="rounded-full px-4 py-2 text-[12px] font-semibold text-[#6E6E73]">Cancel</button>
          <button onClick={confirm} disabled={busy} className="rounded-full bg-[#28C840] px-6 py-2.5 text-[12px] font-semibold text-white disabled:opacity-50">
            Confirm Payment ₹{Math.round(row.amount || row.pending_balance || 0).toLocaleString('en-IN')}
          </button>
        </div>
      </div>
    </div>
  );
}
