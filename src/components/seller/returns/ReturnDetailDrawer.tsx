'use client';

import { useState } from 'react';
import { X, Package, User, Calendar, FileText, MessageSquare, CheckCircle2, XCircle, RefreshCw, Clock, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  requested: { label: 'Pending Review', bg: 'bg-[#FFF8EC]', text: 'text-[#FEBC2E]', border: 'border-[#FEBC2E]/30' },
  approved: { label: 'Approved', bg: 'bg-[#E8FAE8]', text: 'text-[#28C840]', border: 'border-[#28C840]/30' },
  rejected: { label: 'Rejected', bg: 'bg-[#FFE5E5]', text: 'text-[#FF3B30]', border: 'border-[#FF3B30]/30' },
  refunded: { label: 'Refunded', bg: 'bg-[#E5F1FF]', text: 'text-[#007AFF]', border: 'border-[#007AFF]/30' },
  resolved: { label: 'Resolved', bg: 'bg-[#E8FAE8]', text: 'text-[#28C840]', border: 'border-[#28C840]/30' },
};

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface ReturnDetailDrawerProps {
  open: boolean;
  returnItem: any;
  onClose: () => void;
  onResolve: (returnItem: any) => void;
}

export default function ReturnDetailDrawer({ open, returnItem, onClose, onResolve }: ReturnDetailDrawerProps) {
  if (!returnItem) return null;

  const status = STATUS_CONFIG[returnItem.status] || STATUS_CONFIG.requested;
  const customerName =
    returnItem.orders?.profiles?.full_name ||
    returnItem.customer?.full_name ||
    'Customer';
  const customerAvatar =
    returnItem.orders?.profiles?.avatar_url ||
    returnItem.customer?.avatar_url ||
    null;
  const customerPhone =
    returnItem.orders?.profiles?.phone ||
    returnItem.customer?.phone ||
    null;
  const productName = returnItem.order_items?.product_name || 'Unknown Product';
  const productImage = returnItem.order_items?.product_image_url || null;
  const quantity = returnItem.order_items?.quantity || 1;
  const unitPrice = returnItem.order_items?.unit_price || 0;
  const totalPrice = returnItem.order_items?.total_price || 0;
  const orderNumber =
    returnItem.orders?.order_number ||
    returnItem.order_id?.replace(/-/g, '').slice(0, 8).toUpperCase() ||
    '—';

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-[rgba(0,0,0,0.08)] bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#F5F5F7] border-b border-[rgba(0,0,0,0.06)]">
              <div className="flex h-10 items-center px-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                </div>
                <span className="ml-3 font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
                  Return Details
                </span>
                <button
                  onClick={onClose}
                  className="ml-auto rounded-lg p-1.5 text-[#6E6E73] transition-colors hover:bg-[rgba(0,0,0,0.06)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Status badge */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-[#AEAEB2]">
                  Return #{returnItem.id?.slice(0, 8).toUpperCase()}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.bg} ${status.text} border ${status.border}`}>
                  {status.label}
                </span>
              </div>

              {/* Product card */}
              <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-[#FAFAFA] p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <Package className="h-3.5 w-3.5 text-[#AEAEB2]" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#AEAEB2]">Product</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-[#F5F5F7]">
                    {productImage ? (
                      <img src={productImage} alt={productName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-6 w-6 text-[#AEAEB2]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-[DM_Sans] text-[14px] font-semibold text-[#1D1D1F] line-clamp-2">{productName}</p>
                    <div className="mt-1 flex items-center gap-3 text-[12px] text-[#6E6E73]">
                      <span>Qty: {quantity}</span>
                      <span>₹{unitPrice.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <p className="font-[DM_Sans] text-[15px] font-bold text-[#1D1D1F]">
                    ₹{totalPrice.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Customer card */}
              <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-[#FAFAFA] p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <User className="h-3.5 w-3.5 text-[#AEAEB2]" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#AEAEB2]">Customer</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-[#F5F5F7]">
                    {customerAvatar ? (
                      <img src={customerAvatar} alt={customerName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[13px] font-bold text-[#AEAEB2]">
                        {customerName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-[DM_Sans] text-[14px] font-semibold text-[#1D1D1F]">{customerName}</p>
                    {customerPhone && (
                      <p className="text-[12px] text-[#6E6E73]">{customerPhone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Return reason */}
              <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-[#FAFAFA] p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <FileText className="h-3.5 w-3.5 text-[#AEAEB2]" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#AEAEB2]">Reason</span>
                </div>
                <p className="font-[DM_Sans] text-[13px] font-medium text-[#1D1D1F]">{returnItem.reason}</p>
                {returnItem.description && (
                  <p className="mt-2 text-[12px] text-[#6E6E73] leading-relaxed">{returnItem.description}</p>
                )}
              </div>

              {/* Timeline */}
              <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-[#FAFAFA] p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <Calendar className="h-3.5 w-3.5 text-[#AEAEB2]" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#AEAEB2]">Timeline</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1D1D1F]">
                      <Clock className="h-3 w-3 text-white" />
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-[#1D1D1F]">Return Requested</p>
                      <p className="text-[11px] text-[#AEAEB2]">{formatDate(returnItem.created_at)}</p>
                    </div>
                  </div>
                  {returnItem.resolved_at && (
                    <div className="flex items-center gap-3">
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full ${
                        returnItem.status === 'approved' || returnItem.status === 'refunded' ? 'bg-[#28C840]' : 'bg-[#FF3B30]'
                      }`}>
                        {returnItem.status === 'rejected' ? (
                          <XCircle className="h-3 w-3 text-white" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-[#1D1D1F]">
                          {returnItem.status === 'approved' ? 'Approved' :
                           returnItem.status === 'rejected' ? 'Rejected' :
                           returnItem.status === 'refunded' ? 'Refunded' : 'Resolved'}
                        </p>
                        <p className="text-[11px] text-[#AEAEB2]">{formatDate(returnItem.resolved_at)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Resolution note */}
              {returnItem.resolution_note && (
                <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-[#FAFAFA] p-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    <MessageSquare className="h-3.5 w-3.5 text-[#AEAEB2]" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#AEAEB2]">Resolution Note</span>
                  </div>
                  <p className="text-[13px] text-[#1D1D1F] leading-relaxed">{returnItem.resolution_note}</p>
                </div>
              )}

              {/* Order info */}
              <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-[#FAFAFA] p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <Info className="h-3.5 w-3.5 text-[#AEAEB2]" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#AEAEB2]">Order Info</span>
                </div>
                <div className="space-y-2 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-[#6E6E73]">Order ID</span>
                    <span className="font-mono font-medium text-[#1D1D1F]">#{orderNumber}</span>
                  </div>
                  {returnItem.orders?.created_at && (
                    <div className="flex justify-between">
                      <span className="text-[#6E6E73]">Order Date</span>
                      <span className="font-medium text-[#1D1D1F]">{formatDate(returnItem.orders.created_at)}</span>
                    </div>
                  )}
                  {returnItem.orders?.total_amount != null && (
                    <div className="flex justify-between">
                      <span className="text-[#6E6E73]">Order Total</span>
                      <span className="font-medium text-[#1D1D1F]">₹{returnItem.orders.total_amount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Return policy reminder */}
              <div className="rounded-xl bg-[#F5F5F7] px-4 py-3 text-[11px] text-[#6E6E73] leading-relaxed">
                <span className="font-semibold text-[#1D1D1F]">Return Policy:</span> Returns are accepted within 7 days of delivery for damaged, defective, or incorrect items. Refunds are processed within 5–7 business days after approval.
              </div>

              {/* Resolve button */}
              {returnItem.status === 'requested' && (
                <button
                  onClick={() => onResolve(returnItem)}
                  className="w-full rounded-xl bg-[#1D1D1F] py-3 font-[DM_Sans] text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Resolve Return
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
