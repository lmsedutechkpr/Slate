'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const RESOLUTION_OPTIONS = [
  { value: 'refund_full', label: 'Full Refund' },
  { value: 'refund_partial', label: 'Partial Refund' },
  { value: 'replace_item', label: 'Replace Item' },
  { value: 'reject_return', label: 'Reject Return' },
];

export default function MediationModal({
  open,
  onOpenChange,
  row,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  row: any | null;
  onSubmit: (payload: { resolution: string; note: string }) => Promise<void>;
}) {
  const [resolution, setResolution] = useState('refund_full');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!row) return;
    setLoading(true);
    try {
      await onSubmit({ resolution, note: note.trim() });
      setNote('');
      setResolution('refund_full');
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white text-[#1D1D1F]" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[18px] font-bold">
            <AlertTriangle className="h-5 w-5 text-[#FEBC2E]" />
            Mediate Return Case
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[#6E6E73]">
            This will move the return to disputed status and notify both customer and seller.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-[#1D1D1F]">Resolution</label>
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="h-10 w-full rounded-xl border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] outline-none focus:border-[#007AFF]"
            >
              {RESOLUTION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-[#1D1D1F]">Admin Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add context for both parties..."
              rows={5}
              className="w-full rounded-xl border border-[rgba(0,0,0,0.1)] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#007AFF]"
            />
          </div>
        </div>

        <DialogFooter className="-mx-0 -mb-0 border-0 bg-transparent p-0 pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-10 rounded-xl border border-[rgba(0,0,0,0.12)] bg-white px-4 text-[13px] font-semibold text-[#1D1D1F]"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="h-10 rounded-xl bg-[#007AFF] px-4 text-[13px] font-semibold text-white disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Start Mediation'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
