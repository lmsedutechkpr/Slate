'use client';

import { Eye } from 'lucide-react';

function reasonPill(reason?: string) {
  const value = String(reason || 'other').toLowerCase();
  if (value.includes('damag')) return 'bg-[#FFF0EF] text-[#FF5F57]';
  if (value.includes('wrong') || value.includes('mismatch')) return 'bg-[#FFF8EC] text-[#FEBC2E]';
  return 'bg-[#EFF6FF] text-[#3B82F6]';
}

function statusPill(status?: string) {
  const s = String(status || '').toLowerCase();
  if (s === 'approved' || s === 'resolved') return 'bg-[#EDFAF0] text-[#28C840]';
  if (s === 'rejected') return 'bg-[#FFF0EF] text-[#FF5F57]';
  if (s === 'disputed') return 'bg-[#EAF2FF] text-[#007AFF]';
  return 'bg-[#FFF8EC] text-[#FEBC2E]';
}

function ageInfo(createdAt?: string) {
  const d = createdAt ? new Date(createdAt) : null;
  if (!d) return { text: '-', days: 0 };
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (days < 1) return { text: 'Today', days };
  return { text: `${days} days`, days };
}

export default function ReturnRow({
  row,
  onView,
  onMediate,
}: {
  row: any;
  onView: (row: any) => void;
  onMediate: (row: any) => void;
}) {
  const age = ageInfo(row.created_at);
  const overdue = String(row.status || '').toLowerCase() === 'requested' && age.days > 2;

  return (
    <div className="grid min-w-[1240px] grid-cols-[120px_170px_220px_160px_140px_100px_120px_90px_120px] items-center gap-3 border-b border-[rgba(0,0,0,0.06)] px-5 py-4 hover:bg-[#F5F5F7]">
      <button type="button" onClick={() => onView(row)} className="text-left">
        <p className="font-mono text-[11px] font-semibold text-[#1D1D1F]">#{String(row.id || '').slice(0, 8)}</p>
        <p className="text-[10px] text-[#AEAEB2]">{new Date(row.created_at || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
      </button>

      <button type="button" onClick={() => onView(row)} className="flex items-center gap-2 text-left">
        <div className="h-6 w-6 overflow-hidden rounded-full bg-[#F5F5F7]">
          {row.profiles?.avatar_url ? <img src={row.profiles.avatar_url} alt="avatar" className="h-full w-full object-cover" /> : null}
        </div>
        <p className="truncate text-[12px] text-[#1D1D1F]">{row.profiles?.full_name || row.profiles?.display_name || 'Customer'}</p>
      </button>

      <button type="button" onClick={() => onView(row)} className="flex items-center gap-2 text-left">
        <div className="h-7 w-7 overflow-hidden rounded-lg bg-[#F5F5F7]">
          {row.order_items?.products?.images?.[0] ? (
            <img src={row.order_items.products.images[0]} alt="product" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <p className="line-clamp-1 text-[11px] text-[#1D1D1F]">{row.order_items?.products?.name || 'Product'}</p>
      </button>

      <p className="truncate text-[12px] text-[#6E6E73]">{row.order_items?.seller_profiles?.store_name || 'Seller'}</p>

      <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold ${reasonPill(row.reason)}`}>
        {String(row.reason || 'other').replace(/_/g, ' ')}
      </span>

      <p className="text-[12px] font-bold text-[#1D1D1F]">₹{Math.round(Number(row.order_items?.total_price || 0)).toLocaleString('en-IN')}</p>

      <div>
        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusPill(row.status)}`}>
          {row.status || 'requested'}
        </span>
        {overdue ? <p className="mt-1 text-[10px] text-[#FF5F57]">Overdue</p> : null}
      </div>

      <p className={`text-[12px] ${age.days > 5 ? 'text-[#FF5F57]' : 'text-[#6E6E73]'}`}>{age.text}</p>

      <div className="flex items-center gap-2">
        <button onClick={() => onView(row)} className="rounded-lg border border-[rgba(0,0,0,0.08)] p-1.5 text-[#6E6E73]">
          <Eye className="h-3.5 w-3.5" />
        </button>
        {overdue ? (
          <button onClick={() => onMediate(row)} className="rounded-full bg-[#FEBC2E] px-3 py-1 text-[11px] font-semibold text-[#1D1D1F]">
            Mediate
          </button>
        ) : null}
      </div>
    </div>
  );
}
