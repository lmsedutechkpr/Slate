'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  pending: { label: 'Pending', bg: '#FFF8EC', text: '#FEBC2E', border: 'rgba(254,188,46,0.2)' },
  confirmed: { label: 'Confirmed', bg: '#FFF8EC', text: '#FEBC2E', border: 'rgba(254,188,46,0.2)' },
  processing: { label: 'Processing', bg: '#FFF8EC', text: '#FEBC2E', border: 'rgba(254,188,46,0.2)' },
  shipped: { label: 'Shipped', bg: '#F0F7FF', text: '#3B82F6', border: 'rgba(59,130,246,0.2)' },
  delivered: { label: 'Delivered', bg: '#EDFAF0', text: '#28C840', border: 'rgba(40,200,64,0.2)' },
  cancelled: { label: 'Cancelled', bg: '#FFF0EF', text: '#FF5F57', border: 'rgba(255,95,87,0.2)' },
};

function formatDate(dateStr: string) {
  if (!dateStr) return { day: '—', year: '' };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { day: '—', year: '' };
  const day = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  const year = d.getFullYear().toString();
  return { day, year };
}

interface OrderRowProps {
  orderItem: any;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onUpdateStatus: (orderItem: any) => void;
  onViewDetail: (orderItem: any) => void;
}

export default function OrderRow({ orderItem, isSelected, onToggleSelect, onUpdateStatus, onViewDetail }: OrderRowProps) {
  const router = useRouter();
  const order = orderItem.orders;
  const product = orderItem.products;
  const customer = order?.profiles;
  const address = order?.addresses;
  const currentStatus = orderItem.fulfillment_status;
  const statusConfig = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.pending;
  const date = formatDate(order?.created_at || new Date().toISOString());
  const canUpdate = currentStatus !== 'delivered' && currentStatus !== 'cancelled';

  return (
    <div
      className="grid cursor-pointer grid-cols-[40px_100px_minmax(160px,1.3fr)_minmax(120px,1fr)_80px_100px_90px_100px] items-center gap-4 border-b border-[rgba(0,0,0,0.05)] bg-white px-5 py-4 transition-colors hover:bg-[#F5F5F7]"
      onClick={() => onViewDetail(orderItem)}
    >
      {/* Checkbox */}
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={isSelected} onCheckedChange={() => onToggleSelect(orderItem.id)} />
      </div>

      {/* Order ID */}
      <div>
        <p className="font-mono text-[12px] font-semibold text-[#1D1D1F]">
          #{orderItem.id.slice(0, 8).toUpperCase()}
        </p>
        {orderItem.tracking_number && (
          <p className="mt-0.5 text-[10px] text-[#AEAEB2]">Tracking: {orderItem.tracking_number}</p>
        )}
      </div>

      {/* Product */}
      <div className="flex min-w-0 items-center gap-2.5">
        <img
          src={orderItem.product_image_url || product?.images?.[0] || '/placeholder.png'}
          alt=""
          className="h-9 w-9 flex-shrink-0 rounded-lg bg-[#F5F5F7] object-cover"
        />
        <div className="min-w-0">
          <p className="line-clamp-1 font-[DM_Sans] text-[12px] font-medium text-[#1D1D1F]">
            {product?.name || orderItem.product_name || 'Product'}
          </p>
          <p className="text-[11px] text-[#AEAEB2]">×{orderItem.quantity}</p>
        </div>
      </div>

      {/* Customer */}
      <div className="flex min-w-0 items-center gap-2">
        {customer?.avatar_url ? (
          <img src={customer.avatar_url} alt="" className="h-7 w-7 flex-shrink-0 rounded-full bg-[#F5F5F7] object-cover" />
        ) : (
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#F5F5F7] text-[10px] font-bold text-[#AEAEB2]">
            {(customer?.full_name || 'U')[0].toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="line-clamp-1 text-[12px] text-[#1D1D1F]">{customer?.full_name || 'Customer'}</p>
          {address && (
            <p className="line-clamp-1 text-[11px] text-[#AEAEB2]">
              {[address.city, address.state].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Date */}
      <div>
        <p className="text-[12px] text-[#6E6E73]">{date.day}</p>
        <p className="mt-0.5 text-[11px] text-[#AEAEB2]">{date.year}</p>
      </div>

      {/* Amount */}
      <div>
        <p className="font-[DM_Sans] text-[13px] font-bold text-[#1D1D1F]">
          ₹{orderItem.total_price?.toLocaleString('en-IN')}
        </p>
        <p className="mt-0.5 text-[11px] uppercase text-[#AEAEB2]">
          {order?.payment_method || ''}
        </p>
      </div>

      {/* Status */}
      <div>
        <span
          className="inline-flex items-center rounded-full px-2.5 py-1 font-[DM_Sans] text-[10px] font-semibold"
          style={{
            backgroundColor: statusConfig.bg,
            color: statusConfig.text,
            border: `1px solid ${statusConfig.border}`,
          }}
        >
          {statusConfig.label}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        {canUpdate && (
          <button
            onClick={() => onUpdateStatus(orderItem)}
            className="rounded-full bg-[#1D1D1F] px-3 py-1.5 font-[DM_Sans] text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            Update
          </button>
        )}
        <ChevronRight
          className="h-4 w-4 cursor-pointer text-[#AEAEB2]"
          onClick={() => onViewDetail(orderItem)}
        />
      </div>
    </div>
  );
}
