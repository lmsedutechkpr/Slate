'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface ResolutionModalProps {
  open: boolean;
  returnItem: any;
  onClose: () => void;
  onResolved: (returnId: string, newStatus: string) => void;
}

const ACTIONS = [
  {
    value: 'approved',
    label: 'Approve Return',
    description: 'Accept the return and allow the customer to send the item back',
    icon: CheckCircle2,
    color: '#28C840',
    bg: 'bg-[#E8FAE8]',
    border: 'border-[#28C840]/30',
  },
  {
    value: 'rejected',
    label: 'Reject Return',
    description: 'Decline the return request with a reason',
    icon: XCircle,
    color: '#FF3B30',
    bg: 'bg-[#FFE5E5]',
    border: 'border-[#FF3B30]/30',
  },
  {
    value: 'refunded',
    label: 'Refund Directly',
    description: 'Process an immediate refund without requiring item return',
    icon: RefreshCw,
    color: '#007AFF',
    bg: 'bg-[#E5F1FF]',
    border: 'border-[#007AFF]/30',
  },
];

export default function ResolutionModal({ open, returnItem, onClose, onResolved }: ResolutionModalProps) {
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open || !returnItem) return null;

  const handleSubmit = async () => {
    if (!selectedAction) {
      toast.error('Please select a resolution');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/seller/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnId: returnItem.id,
          action: selectedAction,
          resolution_note: note || null,
        }),
      });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error);
      } else {
        toast.success(
          selectedAction === 'approved' ? 'Return approved' :
          selectedAction === 'rejected' ? 'Return rejected' :
          'Refund processed'
        );
        onResolved(returnItem.id, selectedAction);
        onClose();
      }
    } catch {
      toast.error('Failed to resolve return');
    } finally {
      setSubmitting(false);
    }
  };

  const productName = returnItem.order_items?.product_name || 'this item';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        {/* Titlebar */}
        <div className="flex h-10 items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
          </div>
          <span className="ml-3 font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
            Resolve Return
          </span>
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-1 text-[#6E6E73] transition-colors hover:bg-[rgba(0,0,0,0.06)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Context */}
          <p className="text-[13px] text-[#6E6E73]">
            Choose how to resolve the return request for <span className="font-semibold text-[#1D1D1F]">{productName}</span>
          </p>

          {/* Action selection */}
          <div className="space-y-2">
            {ACTIONS.map((action) => {
              const ActionIcon = action.icon;
              const isSelected = selectedAction === action.value;
              return (
                <button
                  key={action.value}
                  onClick={() => setSelectedAction(action.value)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
                    isSelected
                      ? `${action.bg} ${action.border} ring-1`
                      : 'border-[rgba(0,0,0,0.08)] hover:border-[rgba(0,0,0,0.15)]'
                  }`}
                  style={isSelected ? { outlineColor: action.color, boxShadow: `0 0 0 1px ${action.color}` } : {}}
                >
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${action.color}15` }}
                  >
                    <ActionIcon className="h-4 w-4" style={{ color: action.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">{action.label}</p>
                    <p className="text-[11px] text-[#6E6E73] mt-0.5">{action.description}</p>
                  </div>
                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected ? '' : 'border-[#D1D1D6]'
                  }`} style={isSelected ? { borderColor: action.color } : {}}>
                    {isSelected && (
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: action.color }} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Note */}
          <AnimatePresence>
            {selectedAction && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div>
                  <p className="text-[11px] font-semibold text-[#AEAEB2] uppercase tracking-wide mb-1.5">
                    {selectedAction === 'rejected' ? 'Reason for rejection' : 'Note to customer'} (optional)
                  </p>
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={
                      selectedAction === 'rejected'
                        ? 'Explain why the return was declined...'
                        : 'Add any notes for the customer...'
                    }
                    className="w-full rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#FAFAFA] px-4 py-3 text-[13px] text-[#1D1D1F] placeholder:text-[#AEAEB2] focus:outline-none focus:border-[rgba(0,0,0,0.2)] transition-colors resize-none"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-[rgba(0,0,0,0.08)] py-2.5 font-[DM_Sans] text-[13px] font-semibold text-[#6E6E73] transition-colors hover:bg-[#F5F5F7]"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedAction || submitting}
              className="flex-1 rounded-xl bg-[#1D1D1F] py-2.5 font-[DM_Sans] text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? 'Processing...' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
