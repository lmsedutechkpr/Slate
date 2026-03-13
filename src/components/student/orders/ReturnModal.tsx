'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface OrderItem {
  id: string;
  product_name: string;
  product_image_url?: string;
  quantity: number;
}

interface ReturnModalProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  userId: string;
  items: OrderItem[];
}

const REASONS = [
  'Damaged / Defective',
  'Wrong item received',
  'Not as described',
  'Changed my mind',
  'Quality issues',
];

export default function ReturnModal({ open, onClose, orderId, userId, items }: ReturnModalProps) {
  const supabase = createClient();
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id ?? '');
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const toggleReason = (r: string) =>
    setSelectedReasons(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);

  const submitReturn = async () => {
    if (selectedReasons.length === 0) {
      toast.error('Please select at least one reason');
      return;
    }
    setSubmitting(true);
    try {
      const reason = selectedReasons.join(', ');
      // Try returns table first
      const { error: returnErr } = await supabase.from('returns').insert({
        order_id: orderId,
        order_item_id: selectedItemId || null,
        user_id: userId,
        reason,
        description: description || null,
        status: 'requested',
      });

      if (returnErr) {
        // Fallback to support_tickets
        await supabase.from('support_tickets').insert({
          user_id: userId,
          subject: 'Return Request',
          body: JSON.stringify({ order_id: orderId, order_item_id: selectedItemId, reason, description }),
          status: 'open',
          category: 'returns',
        });
      }

      toast.success('Return request submitted. We will contact you within 2–3 business days.');
      onClose();
      setSelectedReasons([]);
      setDescription('');
    } catch {
      toast.error('Failed to submit return request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md overflow-hidden">
        {/* Titlebar */}
        <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex items-center">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
          </div>
          <span className="ml-3 text-[13px] font-semibold text-gray-900 flex-1">Request Return</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {/* Order ref */}
          <p className="font-mono text-[12px] text-gray-400 mb-4">
            Order #{orderId.replace(/-/g, '').slice(0, 8).toUpperCase()}
          </p>

          {/* Item selector */}
          {items.length > 1 && (
            <div className="mb-5">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Select item to return
              </p>
              <div className="space-y-2">
                {items.map(item => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${
                      selectedItemId === item.id ? 'border-gray-900 bg-gray-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                      {item.product_image_url
                        ? <img src={item.product_image_url} alt={item.product_name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-gray-200" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-gray-900 line-clamp-1">{item.product_name}</p>
                      <p className="text-[11px] text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedItemId === item.id ? 'border-gray-900' : 'border-gray-300'
                    }`}>
                      {selectedItemId === item.id && <div className="w-2 h-2 rounded-full bg-gray-900" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reason selector */}
          <div className="mb-4">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Reason for return
            </p>
            <div className="flex flex-wrap gap-2">
              {REASONS.map(r => (
                <button
                  key={r}
                  onClick={() => toggleReason(r)}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-all border ${
                    selectedReasons.includes(r)
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Additional details (optional)
            </p>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the issue..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors resize-none"
            />
          </div>

          <button
            onClick={submitReturn}
            disabled={submitting}
            className="mt-5 w-full bg-gray-900 text-white font-semibold text-[14px] rounded-xl py-3 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Return Request'}
          </button>
        </div>
      </div>
    </div>
  );
}
