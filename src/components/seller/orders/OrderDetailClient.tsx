'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, Truck, CheckCircle2, MessageSquare, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import TrafficLights from '@/components/auth/TrafficLights';
import OrderTimeline from './OrderTimeline';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  pending: { label: 'Pending', bg: '#FFF8EC', text: '#FEBC2E', border: 'rgba(254,188,46,0.2)' },
  confirmed: { label: 'Confirmed', bg: '#FFF8EC', text: '#FEBC2E', border: 'rgba(254,188,46,0.2)' },
  processing: { label: 'Processing', bg: '#FFF8EC', text: '#FEBC2E', border: 'rgba(254,188,46,0.2)' },
  shipped: { label: 'Shipped', bg: '#F0F7FF', text: '#3B82F6', border: 'rgba(59,130,246,0.2)' },
  delivered: { label: 'Delivered', bg: '#EDFAF0', text: '#28C840', border: 'rgba(40,200,64,0.2)' },
  cancelled: { label: 'Cancelled', bg: '#FFF0EF', text: '#FF5F57', border: 'rgba(255,95,87,0.2)' },
};

interface OrderDetailClientProps {
  orderItem: any;
  userId: string;
}

export default function OrderDetailClient({ orderItem: initialItem, userId }: OrderDetailClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [orderItem, setOrderItem] = useState(initialItem);
  const [loading, setLoading] = useState(false);

  // Realtime: listen for order_items updates (e.g. customer cancellation)
  useEffect(() => {
    const channel = supabase
      .channel('seller-order-detail-' + initialItem.id)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'order_items',
        filter: `id=eq.${initialItem.id}`,
      }, async (payload: any) => {
        // Re-fetch full item via API to get joined data
        try {
          const res = await fetch(`/api/seller/orders?itemId=${initialItem.id}`);
          const json = await res.json();
          if (json.item) {
            setOrderItem(json.item);
            if (payload.new.fulfillment_status === 'cancelled') {
              toast.error('This order was cancelled by the customer');
            }
          }
        } catch {}
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [initialItem.id]);

  // Shipping form state
  const [trackingNumber, setTrackingNumber] = useState(orderItem.tracking_number || '');
  const [trackingUrl, setTrackingUrl] = useState(orderItem.tracking_url || '');
  const [carrier, setCarrier] = useState('');

  const order = orderItem.orders;
  const product = orderItem.products;
  const customer = order?.profiles;
  const address = order?.addresses;
  const currentStatus = orderItem.fulfillment_status;
  const statusInfo = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.pending;

  const updateStatus = async (newStatus: string) => {
    setLoading(true);

    try {
      const res = await fetch('/api/seller/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderItemId: orderItem.id,
          newStatus,
          trackingNumber: newStatus === 'shipped' ? trackingNumber : undefined,
          trackingUrl: newStatus === 'shipped' ? trackingUrl : undefined,
          notifyCustomer: true,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error('Failed: ' + (json.error || 'Unknown error'));
        setLoading(false);
        return;
      }

      // Update local state
      const payload = json.payload || {};
      setOrderItem({
        ...orderItem,
        ...payload,
        fulfillment_status: newStatus,
        orders: { ...orderItem.orders, updated_at: new Date().toISOString() },
      });
      toast.success('Order updated! Customer notified.');
    } catch (err: any) {
      toast.error('Failed: ' + (err.message || 'Network error'));
    }

    setLoading(false);
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    await updateStatus('cancelled');
  };

  return (
    <div className="mx-auto max-w-6xl pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 mb-6 flex items-center gap-4 rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white px-5 py-3.5 shadow-sm">
        <button
          onClick={() => router.push('/seller/orders')}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5F5F7] transition-colors hover:bg-[rgba(0,0,0,0.08)]"
        >
          <ArrowLeft className="h-4 w-4 text-[#1D1D1F]" />
        </button>
        <div className="flex-1">
          <h1 className="font-[DM_Sans] text-[20px] font-bold text-[#1D1D1F]">
            Order #{orderItem.id.slice(0, 8).toUpperCase()}
          </h1>
        </div>
        <span
          className="inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-semibold"
          style={{ backgroundColor: statusInfo.bg, color: statusInfo.text, border: `1px solid ${statusInfo.border}` }}
        >
          {statusInfo.label}
        </span>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* LEFT COLUMN */}
        <div className="flex-1 space-y-5">

          {/* Timeline */}
          <OrderTimeline
            status={currentStatus}
            createdAt={order?.created_at}
            updatedAt={order?.updated_at}
            trackingNumber={orderItem.tracking_number}
            trackingUrl={orderItem.tracking_url}
          />

          {/* Product Detail */}
          <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
            <div className="flex h-10 items-center border-b border-[rgba(0,0,0,0.04)] bg-[#F5F5F7] px-4">
              <TrafficLights size="sm" />
              <span className="ml-3 font-[DM_Sans] text-[12px] font-bold uppercase tracking-wider text-[#6E6E73]">
                Product
              </span>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-4">
                <img
                  src={orderItem.product_image_url || product?.images?.[0] || '/placeholder.png'}
                  alt=""
                  className="h-16 w-16 rounded-xl bg-[#F5F5F7] object-cover"
                />
                <div className="flex-1">
                  <p className="font-[DM_Sans] text-[15px] font-bold text-[#1D1D1F]">{product?.name || orderItem.product_name || 'Product'}</p>
                  <div className="mt-1 flex items-center gap-4 text-[13px] text-[#6E6E73]">
                    <span>Qty: {orderItem.quantity}</span>
                    <span>₹{orderItem.unit_price?.toLocaleString('en-IN')} each</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-[DM_Sans] text-[18px] font-bold text-[#1D1D1F]">
                    ₹{orderItem.total_price?.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Actions */}
          <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
            <div className="flex h-10 items-center border-b border-[rgba(0,0,0,0.04)] bg-[#F5F5F7] px-4">
              <TrafficLights size="sm" />
              <span className="ml-3 font-[DM_Sans] text-[12px] font-bold uppercase tracking-wider text-[#6E6E73]">
                Shipping
              </span>
            </div>
            <div className="p-5">
              {(currentStatus === 'pending' || currentStatus === 'confirmed') && (
                <button
                  onClick={() => updateStatus('processing')}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1D1D1F] py-3 font-[DM_Sans] text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                  Mark as Processing
                </button>
              )}

              {currentStatus === 'processing' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="AWB / tracking number"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#F5F5F7] px-4 py-2.5 text-[13px] text-[#1D1D1F] focus:border-[#1D1D1F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1D1D1F]"
                  />
                  <input
                    type="text"
                    placeholder="https://track.delhivery.com/..."
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                    className="w-full rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#F5F5F7] px-4 py-2.5 text-[13px] text-[#1D1D1F] focus:border-[#1D1D1F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1D1D1F]"
                  />
                  <Select value={carrier} onValueChange={setCarrier}>
                    <SelectTrigger className="w-full rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#F5F5F7] text-[13px]">
                      <SelectValue placeholder="Select carrier" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {['Delhivery', 'Blue Dart', 'DTDC', 'India Post', 'Ekart', 'Amazon Shipping', 'Other'].map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    onClick={() => updateStatus('shipped')}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1D1D1F] py-3 font-[DM_Sans] text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                    Mark as Shipped
                  </button>
                </div>
              )}

              {currentStatus === 'shipped' && (
                <>
                  <div className="rounded-xl border border-[#3B82F6]/20 bg-[#F0F7FF] p-4">
                    <div className="mb-2"><TrafficLights size="xs" /></div>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-[#3B82F6]" />
                      <span className="font-[DM_Sans] text-[13px] font-semibold text-[#3B82F6]">In Transit</span>
                    </div>
                    {orderItem.tracking_number && (
                      <p className="mt-2 text-[12px] text-[#6E6E73]">Tracking: {orderItem.tracking_number}</p>
                    )}
                    {orderItem.tracking_url && (
                      <a
                        href={orderItem.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block font-[DM_Sans] text-[12px] font-medium text-[#3B82F6] hover:underline"
                      >
                        Track Package →
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => updateStatus('delivered')}
                    disabled={loading}
                    className="mt-3 w-full rounded-full border border-[#28C840]/30 py-2.5 font-[DM_Sans] text-[13px] font-semibold text-[#28C840] transition-colors hover:bg-[#EDFAF0] disabled:opacity-50"
                  >
                    Mark as Delivered
                  </button>
                </>
              )}

              {currentStatus === 'delivered' && (
                <div className="flex items-center gap-2 rounded-xl bg-[#EDFAF0] p-4">
                  <CheckCircle2 className="h-5 w-5 text-[#28C840]" />
                  <span className="font-[DM_Sans] text-[14px] font-semibold text-[#28C840]">Delivered</span>
                </div>
              )}

              {currentStatus === 'cancelled' && (
                <div className="flex items-center gap-2 rounded-xl bg-[#FFF0EF] p-4">
                  <span className="font-[DM_Sans] text-[14px] font-semibold text-[#FF5F57]">Order Cancelled</span>
                </div>
              )}

              {currentStatus !== 'delivered' && currentStatus !== 'cancelled' && (
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="mt-4 block w-full text-center font-[DM_Sans] text-[12px] font-medium text-[#FF5F57] hover:underline"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-full shrink-0 space-y-5 lg:w-[300px]">

          {/* Customer */}
          <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
            <div className="flex h-10 items-center border-b border-[rgba(0,0,0,0.04)] bg-[#F5F5F7] px-4">
              <TrafficLights size="sm" />
              <span className="ml-3 font-[DM_Sans] text-[12px] font-bold uppercase tracking-wider text-[#6E6E73]">
                Customer
              </span>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3">
                {customer?.avatar_url ? (
                  <img src={customer.avatar_url} alt="" className="h-11 w-11 rounded-full bg-[#F5F5F7] object-cover" />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F5F5F7] font-bold text-[#AEAEB2]">
                    {(customer?.full_name || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-[DM_Sans] text-[15px] font-semibold text-[#1D1D1F]">
                    {customer?.full_name || 'Customer'}
                  </p>
                  {(address?.phone || customer?.phone) && (
                    <p className="mt-0.5 text-[12px] text-[#6E6E73]">{address?.phone || customer?.phone}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => router.push(`/seller/messages?to=${customer?.id}`)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-[rgba(0,0,0,0.1)] py-2 font-[DM_Sans] text-[12px] font-medium text-[#1D1D1F] transition-colors hover:bg-[#F5F5F7]"
              >
                <MessageSquare className="h-3 w-3" />
                Send Message
              </button>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
            <div className="flex h-10 items-center border-b border-[rgba(0,0,0,0.04)] bg-[#F5F5F7] px-4">
              <TrafficLights size="sm" />
              <span className="ml-3 font-[DM_Sans] text-[12px] font-bold uppercase tracking-wider text-[#6E6E73]">
                Payment
              </span>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#6E6E73]">Subtotal ({orderItem.quantity} items)</span>
                <span className="font-semibold text-[#1D1D1F]">₹{orderItem.total_price?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#6E6E73]">Payment method</span>
                <span className="font-medium uppercase text-[#1D1D1F]">{order?.payment_method || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#6E6E73]">Order status</span>
                <span className={`font-semibold ${order?.status === 'confirmed' || order?.status === 'delivered' ? 'text-[#28C840]' : 'text-[#FEBC2E]'}`}>
                  {order?.status || 'Pending'}
                </span>
              </div>
              <div className="border-t border-[rgba(0,0,0,0.06)] pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-[DM_Sans] text-[14px] font-bold text-[#1D1D1F]">Total</span>
                  <span className="font-[DM_Sans] text-[18px] font-bold text-[#1D1D1F]">
                    ₹{orderItem.total_price?.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          {address && (
            <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
              <div className="flex h-10 items-center border-b border-[rgba(0,0,0,0.04)] bg-[#F5F5F7] px-4">
                <TrafficLights size="sm" />
                <span className="ml-3 font-[DM_Sans] text-[12px] font-bold uppercase tracking-wider text-[#6E6E73]">
                  Delivery Address
                </span>
              </div>
              <div className="p-5 text-[13px] leading-relaxed text-[#1D1D1F]">
                <p className="font-semibold">{address.full_name}</p>
                {address.phone && <p className="text-[#6E6E73]">{address.phone}</p>}
                <p className="mt-2">{address.address_line1}</p>
                {address.address_line2 && <p>{address.address_line2}</p>}
                <p>{[address.city, address.state, address.pincode].filter(Boolean).join(', ')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
