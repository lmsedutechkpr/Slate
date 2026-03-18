'use client';

import { useState } from 'react';
import { Package, Truck, CheckCircle2, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import TrafficLights from '@/components/auth/TrafficLights';
import { motion, AnimatePresence } from 'framer-motion';

const NEXT_STATUSES: Record<string, string[]> = {
  pending: ['processing', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
};

const STATUS_OPTIONS: Record<string, { icon: any; color: string; label: string; description: string }> = {
  processing: { icon: Package, color: '#FEBC2E', label: 'Processing', description: 'Preparing the order' },
  shipped: { icon: Truck, color: '#3B82F6', label: 'Shipped', description: 'Order is on the way' },
  delivered: { icon: CheckCircle2, color: '#28C840', label: 'Delivered', description: 'Customer received it' },
  cancelled: { icon: XCircle, color: '#FF5F57', label: 'Cancelled', description: 'Cancel this order' },
};

interface UpdateStatusModalProps {
  isOpen: boolean;
  orderItem: any;
  onClose: () => void;
  onSuccess: (orderItemId: string, newStatus: string) => void;
}

export default function UpdateStatusModal({ isOpen, orderItem, onClose, onSuccess }: UpdateStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState(orderItem?.tracking_number || '');
  const [trackingUrl, setTrackingUrl] = useState(orderItem?.tracking_url || '');
  const [carrier, setCarrier] = useState('');
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!orderItem) return null;

  const product = orderItem.products;
  const currentStatus = orderItem.fulfillment_status;
  const availableStatuses = NEXT_STATUSES[currentStatus] || [];

  const handleUpdate = async () => {
    if (!selectedStatus) return toast.error('Please select a status');
    setLoading(true);

    try {
      const res = await fetch('/api/seller/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderItemId: orderItem.id,
          newStatus: selectedStatus,
          trackingNumber: selectedStatus === 'shipped' ? trackingNumber : undefined,
          trackingUrl: selectedStatus === 'shipped' ? trackingUrl : undefined,
          notifyCustomer,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error('Failed to update status: ' + (json.error || 'Unknown error'));
        setLoading(false);
        return;
      }

      toast.success(
        notifyCustomer
          ? 'Order updated! Customer has been notified.'
          : 'Order updated!'
      );
      onSuccess(orderItem.id, selectedStatus);
      onClose();
    } catch (err: any) {
      toast.error('Failed: ' + (err.message || 'Network error'));
    }

    setLoading(false);
    setSelectedStatus(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md rounded-2xl border-[rgba(0,0,0,0.08)] p-0">
        <div className="p-6">
          <TrafficLights size="sm" />

          <DialogTitle className="mt-4 font-[DM_Sans] text-[18px] font-bold text-[#1D1D1F]">
            Update Order Status
          </DialogTitle>

          {/* Order summary */}
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#F5F5F7] p-4">
            <img
              src={orderItem.product_image_url || product?.images?.[0] || '/placeholder.png'}
              alt=""
              className="h-10 w-10 rounded-lg bg-white object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
                {product?.name || orderItem.product_name || 'Product'}
              </p>
              <p className="text-[11px] text-[#AEAEB2]">
                #{orderItem.id.slice(0, 8).toUpperCase()} · ₹{orderItem.total_price?.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Current status */}
          <div className="mt-5">
            <p className="text-[12px] font-bold uppercase tracking-wider text-[#AEAEB2]">Current Status</p>
            <div className="mt-2">
              {(() => {
                const cfg = STATUS_OPTIONS[currentStatus] || { label: currentStatus, color: '#AEAEB2' };
                return (
                  <span
                    className="inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-semibold"
                    style={{ backgroundColor: cfg.color + '18', color: cfg.color }}
                  >
                    {cfg.label || currentStatus}
                  </span>
                );
              })()}
            </div>
          </div>

          {/* New status options */}
          <div className="mt-5">
            <p className="text-[12px] font-bold uppercase tracking-wider text-[#AEAEB2]">Update to</p>
            <div className="mt-3 space-y-2">
              {availableStatuses.map((s) => {
                const opt = STATUS_OPTIONS[s];
                if (!opt) return null;
                const isSelected = selectedStatus === s;
                const Icon = opt.icon;

                return (
                  <button
                    key={s}
                    onClick={() => setSelectedStatus(s)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-[#1D1D1F] bg-white shadow-sm'
                        : 'border-transparent bg-[#F5F5F7] hover:bg-[rgba(0,0,0,0.06)]'
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" style={{ color: opt.color }} />
                    <div>
                      <p className="font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">{opt.label}</p>
                      <p className="text-[11px] text-[#AEAEB2]">{opt.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tracking info (show if shipped selected) */}
          <AnimatePresence>
            {selectedStatus === 'shipped' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 space-y-3">
                  <input
                    type="text"
                    placeholder="AWB / tracking no."
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#F5F5F7] px-4 py-2.5 text-[13px] text-[#1D1D1F] focus:border-[#1D1D1F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1D1D1F]"
                  />
                  <div>
                    <input
                      type="text"
                      placeholder="https://track.delhivery.com/..."
                      value={trackingUrl}
                      onChange={(e) => setTrackingUrl(e.target.value)}
                      className="w-full rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#F5F5F7] px-4 py-2.5 text-[13px] text-[#1D1D1F] focus:border-[#1D1D1F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1D1D1F]"
                    />
                    <p className="mt-1 text-[11px] text-[#AEAEB2]">Share tracking link with customer</p>
                  </div>
                  <Select value={carrier} onValueChange={setCarrier}>
                    <SelectTrigger className="w-full rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#F5F5F7] text-[13px]">
                      <SelectValue placeholder="Select carrier" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {['Delhivery', 'Blue Dart', 'DTDC', 'India Post', 'Ekart', 'Amazon Shipping', 'Other'].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notify Customer toggle */}
          <div className="mt-4 flex items-center justify-between rounded-xl bg-[#F5F5F7] p-3">
            <span className="text-[13px] text-[#1D1D1F]">Notify customer by email</span>
            <Switch checked={notifyCustomer} onCheckedChange={setNotifyCustomer} />
          </div>

          {/* Footer */}
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-full border border-[rgba(0,0,0,0.1)] py-2.5 font-[DM_Sans] text-[13px] font-semibold text-[#6E6E73] transition-colors hover:bg-[#F5F5F7]"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              disabled={loading || !selectedStatus}
              className="flex-1 rounded-full bg-[#1D1D1F] py-2.5 font-[DM_Sans] text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
