'use client';

import { Clock, CheckCircle2, XCircle, RefreshCw, ChevronRight, Package } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
  requested: { label: 'Pending', bg: 'bg-[#FFF8EC]', text: 'text-[#FEBC2E]', border: 'border-[#FEBC2E]/30', icon: Clock },
  approved: { label: 'Approved', bg: 'bg-[#E8FAE8]', text: 'text-[#28C840]', border: 'border-[#28C840]/30', icon: CheckCircle2 },
  rejected: { label: 'Rejected', bg: 'bg-[#FFE5E5]', text: 'text-[#FF3B30]', border: 'border-[#FF3B30]/30', icon: XCircle },
  refunded: { label: 'Refunded', bg: 'bg-[#E5F1FF]', text: 'text-[#007AFF]', border: 'border-[#007AFF]/30', icon: RefreshCw },
  resolved: { label: 'Resolved', bg: 'bg-[#E8FAE8]', text: 'text-[#28C840]', border: 'border-[#28C840]/30', icon: CheckCircle2 },
};

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function timeAgo(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  return formatDate(dateStr);
}

interface ReturnCardProps {
  returnItem: any;
  onClick: () => void;
}

export default function ReturnCard({ returnItem, onClick }: ReturnCardProps) {
  const status = STATUS_CONFIG[returnItem.status] || STATUS_CONFIG.requested;
  const StatusIcon = status.icon;

  const customerName =
    returnItem.orders?.profiles?.full_name ||
    returnItem.customer?.full_name ||
    'Customer';

  const customerAvatar =
    returnItem.orders?.profiles?.avatar_url ||
    returnItem.customer?.avatar_url ||
    null;

  const productName =
    returnItem.order_items?.product_name ||
    'Unknown Product';

  const productImage =
    returnItem.order_items?.product_image_url ||
    null;

  const orderNumber =
    returnItem.orders?.order_number ||
    returnItem.order_id?.replace(/-/g, '').slice(0, 8).toUpperCase() ||
    '—';

  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-4 border-b border-[rgba(0,0,0,0.05)] px-5 py-4 text-left transition-colors hover:bg-[#FAFAFA]"
    >
      {/* Product image */}
      <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-xl bg-[#F5F5F7]">
        {productImage ? (
          <img src={productImage} alt={productName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-5 w-5 text-[#AEAEB2]" />
          </div>
        )}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F] line-clamp-1">
            {productName}
          </p>
          <span className="font-mono text-[10px] text-[#AEAEB2]">#{orderNumber}</span>
        </div>
        <p className="mt-0.5 text-[12px] text-[#6E6E73] line-clamp-1">
          {returnItem.reason}
        </p>
      </div>

      {/* Customer */}
      <div className="hidden items-center gap-2 sm:flex">
        <div className="h-6 w-6 flex-shrink-0 overflow-hidden rounded-full bg-[#F5F5F7]">
          {customerAvatar ? (
            <img src={customerAvatar} alt={customerName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-[#AEAEB2]">
              {customerName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <span className="text-[12px] font-medium text-[#6E6E73] max-w-[100px] truncate">
          {customerName}
        </span>
      </div>

      {/* Time */}
      <span className="hidden text-[11px] text-[#AEAEB2] lg:block min-w-[70px] text-right">
        {timeAgo(returnItem.created_at)}
      </span>

      {/* Status badge */}
      <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.bg} ${status.text} border ${status.border}`}>
        <StatusIcon className="h-3 w-3" />
        {status.label}
      </div>

      {/* Chevron */}
      <ChevronRight className="h-4 w-4 text-[#AEAEB2] opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
