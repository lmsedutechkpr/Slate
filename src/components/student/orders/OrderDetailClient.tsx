'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, CreditCard, Package, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import OrderTimeline from './OrderTimeline';
import ReturnModal from './ReturnModal';
import { OrderStatusBadge } from './OrderCard';

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN'); }
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function TrafficLights() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full bg-[#FF5F57]" />
      <div className="w-2 h-2 rounded-full bg-[#FEBC2E]" />
      <div className="w-2 h-2 rounded-full bg-[#28C840]" />
    </div>
  );
}

const METHOD_LABEL: Record<string, string> = {
  upi: 'UPI', card: 'Credit / Debit Card', netbanking: 'Net Banking',
};

// Statuses that can be cancelled by the student
const CANCELLABLE = ['pending', 'confirmed'];

interface OrderDetailClientProps {
  order: any;
  userId: string;
}

export default function OrderDetailClient({ order: initialOrder, userId }: OrderDetailClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [order, setOrder] = useState(initialOrder);
  const [returnOpen, setReturnOpen] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Realtime single order update
  useEffect(() => {
    const channel = supabase
      .channel('order-detail-' + order.id)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'orders',
        filter: `id=eq.${order.id}`,
      }, (payload: any) => {
        setOrder((prev: any) => ({ ...prev, ...payload.new }));
        toast(`Order status updated to ${payload.new.status}`);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, order.id]);

  const cancelOrder = async () => {
    setCancelling(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', order.id)
        .eq('customer_id', userId);

      if (error) throw error;

      // Optimistic UI update
      setOrder((prev: any) => ({ ...prev, status: 'cancelled' }));
      setShowCancelConfirm(false);
      toast.success('Order cancelled successfully. Refund will be processed within 5–7 days.');

      // Post a notification
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'order',
        title: 'Order Cancelled',
        message: `Your order #${order.id.replace(/-/g, '').slice(0, 8).toUpperCase()} has been cancelled.`,
        action_url: '/student/orders',
        is_read: false,
      });
    } catch (e: any) {
      toast.error(e.message || 'Failed to cancel order. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const addr = Array.isArray(order.addresses) ? order.addresses[0] : order.addresses;
  const items = order.order_items ?? [];
  const trackingItem = items.find((i: any) => i.tracking_number);
  const canCancel = CANCELLABLE.includes(order.status);

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => router.push('/student/orders')}
        className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-900 transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        My Orders
      </button>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-mono text-[22px] font-bold text-gray-900">
            Order #{order.id.replace(/-/g, '').slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-[13px] text-gray-400 mt-0.5">Placed on {fmtDate(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.status} />
          {canCancel && !showCancelConfirm && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="text-[12px] font-medium text-[#FF5F57] border border-red-200 rounded-full px-4 py-1.5 hover:bg-red-50 transition-colors"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Banner */}
      {showCancelConfirm && canCancel && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4">
          <AlertTriangle className="w-5 h-5 text-[#FF5F57] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-gray-900">Cancel this order?</p>
            <p className="text-[13px] text-gray-500 mt-0.5">
              This action cannot be undone. A refund of <span className="font-semibold text-gray-900">{fmt(order.total_amount)}</span> will be processed within 5–7 business days.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={cancelOrder}
                disabled={cancelling}
                className="bg-[#FF5F57] text-white font-semibold text-[13px] rounded-xl px-5 py-2 hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
              </button>
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={cancelling}
                className="text-[13px] text-gray-600 border border-gray-200 rounded-xl px-5 py-2 hover:bg-gray-50 transition-colors"
              >
                Keep Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* LEFT */}
        <div className="flex-1 min-w-0">

          {/* Timeline */}
          <OrderTimeline
            status={order.status}
            createdAt={order.created_at}
            updatedAt={order.updated_at}
            trackingNumber={trackingItem?.tracking_number}
            trackingUrl={trackingItem?.tracking_url}
          />

          {/* Items */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-5">
            <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex items-center gap-3">
              <TrafficLights />
              <span className="ml-1 text-[13px] font-semibold text-gray-900">
                Items ({items.length})
              </span>
            </div>
            {items.length === 0 ? (
              <div className="px-5 py-8 text-center text-[13px] text-gray-400">
                No items found for this order.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {items.map((item: any) => (
                  <div key={item.id} className="px-5 py-4 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100">
                      {item.product_image_url
                        ? <img src={item.product_image_url} alt={item.product_name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-gray-300" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-gray-900 leading-snug">{item.product_name}</p>
                      <p className="text-[12px] text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                      {item.fulfillment_status && item.fulfillment_status !== order.status && (
                        <div className="mt-1">
                          <OrderStatusBadge status={item.fulfillment_status} />
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[15px] font-bold text-gray-900">{fmt(item.total_price)}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{fmt(item.unit_price)} each</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Return section (if delivered) */}
          {order.status === 'delivered' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
              <div>
                <p className="text-[14px] font-semibold text-gray-900">Need to return something?</p>
                <p className="text-[12px] text-gray-500 mt-0.5">Request a return within 7 days of delivery</p>
              </div>
              <button
                onClick={() => setReturnOpen(true)}
                className="text-[13px] font-semibold text-[#FF5F57] border border-red-200 rounded-xl px-5 py-2 hover:bg-red-50 transition-colors"
              >
                Request Return
              </button>
            </div>
          )}

          {/* Cancelled notice */}
          {order.status === 'cancelled' && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-[#FF5F57]" />
                <p className="text-[14px] font-semibold text-gray-900">Order Cancelled</p>
              </div>
              <p className="text-[13px] text-gray-500 ml-6">
                This order has been cancelled. If payment was made, a refund will be processed within 5–7 business days.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="w-full lg:w-[300px] flex-shrink-0 space-y-4">

          {/* Payment Summary */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex items-center gap-3">
              <TrafficLights />
              <span className="ml-1 text-[13px] font-semibold text-gray-900">Payment</span>
            </div>
            <div className="p-5 space-y-2.5">
              <div className="flex justify-between text-[13px]">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">{fmt(order.subtotal ?? 0)}</span>
              </div>
              {(order.discount_amount ?? 0) > 0 && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-gray-500">Discount</span>
                  <span className="text-[#28C840] font-medium">−{fmt(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[13px]">
                <span className="text-gray-500">Delivery</span>
                <span className="text-[#28C840] font-medium">FREE</span>
              </div>

              <div className="h-px bg-gray-100 my-1" />

              <div className="flex justify-between">
                <span className="text-[16px] font-bold text-gray-900">Total</span>
                <span className="text-[18px] font-extrabold text-gray-900">{fmt(order.total_amount ?? 0)}</span>
              </div>

              <div className="h-px bg-gray-100 my-1" />

              <div className="flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[13px] text-gray-600">
                  {METHOD_LABEL[order.payment_method] ?? order.payment_method}
                </span>
              </div>

              {order.payment_id && (
                <div className="mt-2">
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold">Payment ID</p>
                  <p className="font-mono text-[11px] text-gray-500 break-all mt-0.5">{order.payment_id}</p>
                </div>
              )}

              <div className="mt-2">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide border ${
                  order.status === 'cancelled'
                    ? 'bg-red-50 text-[#FF5F57] border-red-200'
                    : 'bg-green-50 text-[#28C840] border-green-200'
                }`}>
                  {order.status === 'cancelled' ? 'Refund Pending' : 'Paid'}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          {addr && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex items-center gap-3">
                <TrafficLights />
                <span className="ml-1 text-[13px] font-semibold text-gray-900">Delivery Address</span>
              </div>
              <div className="p-5">
                <MapPin className="w-4 h-4 text-gray-400 mb-2" />
                <p className="text-[14px] font-semibold text-gray-900">{addr.full_name}</p>
                <p className="text-[13px] text-gray-500 mt-1">{addr.address_line1}</p>
                {addr.address_line2 && <p className="text-[13px] text-gray-500">{addr.address_line2}</p>}
                <p className="text-[13px] text-gray-500">{addr.city}, {addr.state} — {addr.pincode}</p>
                {addr.phone && <p className="text-[13px] text-gray-500 mt-2">{addr.phone}</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Return Modal */}
      <ReturnModal
        open={returnOpen}
        onClose={() => setReturnOpen(false)}
        orderId={order.id}
        userId={userId}
        items={items}
      />
    </div>
  );
}
