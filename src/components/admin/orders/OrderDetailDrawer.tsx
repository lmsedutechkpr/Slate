'use client';

import Image from 'next/image';
import { X } from 'lucide-react';
import { forceCancelOrderAction, markOrderRefundedAction } from '@/app/actions/admin';
import { toast } from 'sonner';
import { useState } from 'react';

function badge(status?: string | null) {
  const s = (status || '').toLowerCase();
  if (s === 'paid' || s === 'delivered' || s === 'processed') return 'bg-[#EDFAF0] text-[#28C840]';
  if (s === 'pending' || s === 'processing' || s === 'confirmed') return 'bg-[#FFF8EC] text-[#FEBC2E]';
  return 'bg-[#FFF0EF] text-[#FF5F57]';
}

export default function OrderDetailDrawer({
  order,
  open,
  onClose,
  onUpdated,
}: {
  order: any | null;
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  if (!open || !order) return null;

  const items = order.order_items || [];
  const address = order.addresses?.[0] || order.addresses || null;

  const forceCancel = async () => {
    if (!reason.trim()) {
      toast.error('Provide a cancellation reason.');
      return;
    }
    setBusy(true);
    const res = await forceCancelOrderAction({ orderId: order.id, reason: reason.trim() });
    setBusy(false);
    if (!res.success) {
      toast.error(res.error || 'Failed to cancel order');
      return;
    }
    toast.success('Order cancelled and users notified.');
    onUpdated?.();
    onClose();
  };

  const markRefunded = async () => {
    setBusy(true);
    const res = await markOrderRefundedAction({ orderId: order.id });
    setBusy(false);
    if (!res.success) {
      toast.error(res.error || 'Failed to mark refunded');
      return;
    }
    toast.success('Order marked as refunded.');
    onUpdated?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/20" onClick={onClose} aria-label="Close" />
      <div className="absolute right-0 top-0 h-full w-full max-w-[500px] overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-[rgba(0,0,0,0.08)] bg-white p-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
              <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
              <span className="h-2 w-2 rounded-full bg-[#28C840]" />
            </div>
            <button onClick={onClose} className="rounded-lg border border-[rgba(0,0,0,0.08)] p-1.5"><X className="h-4 w-4" /></button>
          </div>
          <p className="font-mono text-[20px] font-extrabold text-[#1D1D1F]">#{String(order.id || '').slice(0, 8)}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${badge(order.status)}`}>{order.status}</span>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${badge(order.payment_status)}`}>{order.payment_status}</span>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#F5F5F7] p-4">
            <div className="mb-3 flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF5F57]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#FEBC2E]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#28C840]" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <div>
                <p className="mb-1 text-[11px] uppercase text-[#AEAEB2]">Customer</p>
                <p className="font-semibold text-[#1D1D1F]">{order.profiles?.full_name || 'Customer'}</p>
                <p className="text-[#6E6E73]">{address?.city || '-'}, {address?.state || '-'}</p>
              </div>
              <div>
                <p className="mb-1 text-[11px] uppercase text-[#AEAEB2]">Delivery Address</p>
                <p className="text-[#6E6E73]">{address?.full_name || '-'}</p>
                <p className="text-[#6E6E73]">{address?.city || '-'}, {address?.state || '-'}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-[13px] font-semibold text-[#1D1D1F]">Items ({items.length})</p>
            <div className="space-y-2">
              {items.map((item: any) => (
                <div key={item.id} className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-3">
                  <div className="mb-2 flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FF5F57]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FEBC2E]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#28C840]" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-[#F5F5F7]">
                      {item.products?.images?.[0] ? <Image src={item.products.images[0]} alt="item" fill className="object-cover" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold text-[#1D1D1F]">{item.products?.name || 'Product'}</p>
                      <p className="text-[11px] text-[#AEAEB2]">×{item.quantity || 1} · ₹{Math.round((item.total_price || 0) / Math.max(1, item.quantity || 1)).toLocaleString('en-IN')} each</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-bold text-[#1D1D1F]">₹{Math.round(item.total_price || 0).toLocaleString('en-IN')}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge(item.status)}`}>{item.status || 'confirmed'}</span>
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] text-[#AEAEB2]">by {item.seller_profiles?.store_name || 'Seller'}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] p-4 text-[12px]">
            <div className="mb-1 flex justify-between"><span className="text-[#6E6E73]">Subtotal</span><span className="text-[#1D1D1F]">₹{Math.round(order.subtotal || 0).toLocaleString('en-IN')}</span></div>
            <div className="mb-1 flex justify-between"><span className="text-[#6E6E73]">Discount</span><span className="text-[#1D1D1F]">₹{Math.round(order.discount_amount || 0).toLocaleString('en-IN')}</span></div>
            <div className="mb-1 flex justify-between font-semibold"><span className="text-[#1D1D1F]">Total</span><span className="text-[#1D1D1F]">₹{Math.round(order.total_amount || 0).toLocaleString('en-IN')}</span></div>
            <div className="mb-1 flex justify-between"><span className="text-[#6E6E73]">Payment Method</span><span className="text-[#1D1D1F]">{order.payment_method || '-'}</span></div>
            <div className="flex justify-between"><span className="text-[#6E6E73]">Payment ID</span><span className="font-mono text-[#1D1D1F]">{order.payment_id || '-'}</span></div>
          </div>

          {(order.status || '').toLowerCase() !== 'delivered' ? (
            <div>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="Reason for force cancel"
                className="w-full rounded-xl border border-[rgba(0,0,0,0.08)] bg-white p-3 text-[12px] outline-none"
              />
              <button disabled={busy} onClick={forceCancel} className="mt-2 w-full rounded-full border border-[#FF5F57]/30 py-2.5 text-[12px] font-semibold text-[#FF5F57] disabled:opacity-50">
                Force Cancel Order
              </button>
            </div>
          ) : null}

          <button disabled={busy} onClick={markRefunded} className="w-full rounded-full border border-[rgba(0,0,0,0.1)] py-2.5 text-[12px] font-semibold text-[#1D1D1F] disabled:opacity-50">
            Mark as Refunded
          </button>

          <button className="w-full rounded-full border border-[rgba(0,0,0,0.1)] py-2.5 text-[12px] font-semibold text-[#1D1D1F]">
            Contact Customer
          </button>
        </div>
      </div>
    </div>
  );
}
