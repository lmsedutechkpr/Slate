'use client';

import Image from 'next/image';
import { Eye } from 'lucide-react';

function statusBadge(status?: string | null) {
  const s = (status || '').toLowerCase();
  if (s === 'delivered') return 'bg-[#EDFAF0] text-[#28C840]';
  if (s === 'shipped') return 'bg-[#EFF6FF] text-[#3B82F6]';
  if (s === 'processing') return 'bg-[#FFF8EC] text-[#FEBC2E]';
  if (s === 'refunded') return 'bg-[#EAF2FF] text-[#007AFF]';
  if (s === 'cancelled') return 'bg-[#FFF0EF] text-[#FF5F57]';
  return 'bg-[#F5F5F7] text-[#6E6E73]';
}

function paymentBadge(status?: string | null) {
  const s = (status || '').toLowerCase();
  if (s === 'paid') return 'text-[#28C840]';
  if (s === 'refunded') return 'text-[#007AFF]';
  if (s === 'pending') return 'text-[#FEBC2E]';
  return 'text-[#FF5F57]';
}

export default function OrderRow({
  order,
  onOpen,
}: {
  order: any;
  onOpen: (order: any) => void;
}) {
  const customerName =
    order?.profiles?.full_name ||
    order?.profiles?.display_name ||
    (order?.customer_id ? `User ${String(order.customer_id).slice(0, 8)}` : null) ||
    'Unknown User';

  const items = order.order_items || [];
  const firstAddress = order.addresses?.[0] || order.addresses || null;

  const sellerNames: string[] = Array.from(
    new Set(
      items
        .map((i: any) => i?.seller_profiles?.store_name)
        .filter((name: unknown): name is string => typeof name === 'string' && name.trim().length > 0)
    )
  );

  const created = order.created_at ? new Date(order.created_at) : null;
  const date = created
    ? created.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    : '--';
  const time = created
    ? created.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '--';

  const paymentState = String(order.payment_status || order.status || '-').toLowerCase();

  return (
    <div
      className="grid min-w-[1220px] grid-cols-[170px_190px_160px_170px_130px_110px_90px_120px] items-center gap-4 border-b border-[rgba(0,0,0,0.06)] px-5 py-4 hover:bg-[#F5F5F7]"
    >
      <button type="button" onClick={() => onOpen(order)} className="text-left">
        <p className="font-mono text-[12px] font-bold text-[#1D1D1F]">#{String(order.id || '').slice(0, 8).toUpperCase()}</p>
        <p className="text-[10px] text-[#AEAEB2]">{order.payment_method || 'NA'}</p>
      </button>

      <button type="button" onClick={() => onOpen(order)} className="flex items-center gap-2 text-left">
        <div className="relative h-7 w-7 overflow-hidden rounded-full bg-[#F5F5F7]">
          {order.profiles?.avatar_url ? <Image src={order.profiles.avatar_url} alt="avatar" fill className="object-cover" /> : null}
        </div>
        <div className="min-w-0">
            <p className="truncate text-[12px] text-[#1D1D1F]">{customerName}</p>
          <p className="truncate text-[10px] text-[#AEAEB2]">{firstAddress?.city || '-'}, {firstAddress?.state || '-'}</p>
        </div>
      </button>

      <button type="button" onClick={() => onOpen(order)} className="flex items-center gap-2 text-left">
        <div className="flex -space-x-2">
          {items.slice(0, 3).map((item: any) => (
            <div key={item.id} className="relative h-6 w-6 overflow-hidden rounded-full border border-white bg-[#F5F5F7]">
              {item.products?.images?.[0] ? (
                <Image src={item.products.images[0]} alt="item" fill className="object-cover" />
              ) : null}
            </div>
          ))}
        </div>
        <p className="text-[12px] text-[#6E6E73]">{items.length} items</p>
      </button>

      <button type="button" onClick={() => onOpen(order)} className="text-left">
        <p className="truncate text-[12px] text-[#6E6E73]">{sellerNames[0] || 'Seller'}</p>
        {sellerNames.length > 1 ? <p className="text-[10px] text-[#AEAEB2]">{sellerNames.length} sellers</p> : null}
      </button>

      <button type="button" onClick={() => onOpen(order)} className="text-left">
        <p className="text-[13px] font-bold text-[#1D1D1F]">₹{Math.round(order.total_amount || 0).toLocaleString('en-IN')}</p>
          <p className={`text-[10px] ${paymentBadge(paymentState)}`}>{paymentState}</p>
      </button>

      <button type="button" onClick={() => onOpen(order)} className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusBadge(order.status)}`}>
        {order.status || 'confirmed'}
      </button>

      <button type="button" onClick={() => onOpen(order)} className="text-left">
        <p className="text-[12px] text-[#6E6E73]">{date}</p>
        <p className="text-[10px] text-[#AEAEB2]">{time}</p>
      </button>

      <div className="flex items-center gap-2">
        <button onClick={() => onOpen(order)} className="rounded-lg border border-[rgba(0,0,0,0.08)] p-1.5 text-[#6E6E73] hover:bg-white">
          <Eye className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
