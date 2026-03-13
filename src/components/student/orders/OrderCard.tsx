'use client';

import { useRouter } from 'next/navigation';
import { Calendar, Truck, Package } from 'lucide-react';

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

interface OrderItem {
  id: string;
  product_name: string;
  product_image_url?: string;
  quantity: number;
  total_price: number;
}

interface Order {
  id: string;
  status: OrderStatus;
  payment_method: string;
  total_amount: number;
  created_at: string;
  order_items: OrderItem[];
  addresses?: { full_name?: string; city?: string; state?: string } | null;
}

interface OrderCardProps {
  order: Order;
  onReturn?: (order: Order) => void;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  pending:    { label: 'Pending',    bg: 'bg-yellow-50',  text: 'text-[#FEBC2E]', border: 'border-yellow-200' },
  confirmed:  { label: 'Confirmed',  bg: 'bg-green-50',   text: 'text-[#28C840]', border: 'border-green-200'  },
  processing: { label: 'Processing', bg: 'bg-yellow-50',  text: 'text-[#FEBC2E]', border: 'border-yellow-200' },
  shipped:    { label: 'Shipped',    bg: 'bg-gray-100',   text: 'text-gray-700',  border: 'border-gray-200'   },
  delivered:  { label: 'Delivered',  bg: 'bg-green-50',   text: 'text-[#28C840]', border: 'border-green-200'  },
  cancelled:  { label: 'Cancelled',  bg: 'bg-red-50',     text: 'text-[#FF5F57]', border: 'border-red-200'    },
  refunded:   { label: 'Refunded',   bg: 'bg-red-50',     text: 'text-[#FF5F57]', border: 'border-red-200'    },
};

export function OrderStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
}

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN'); }
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function OrderCard({ order, onReturn }: OrderCardProps) {
  const router = useRouter();
  const items = order.order_items ?? [];
  const visible = items.slice(0, 3);
  const extra = items.length - 3;
  const trackingNum = items.find(i => (i as any).tracking_number)?.['tracking_number' as keyof typeof items[0]];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:border-gray-300 hover:shadow-md transition-all duration-200 mb-4">
      {/* Titlebar */}
      <div className="bg-gray-50 border-b border-gray-100 px-5 h-11 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#FF5F57]" />
          <div className="w-2 h-2 rounded-full bg-[#FEBC2E]" />
          <div className="w-2 h-2 rounded-full bg-[#28C840]" />
        </div>
        <span className="font-mono text-[12px] text-gray-400">
          Order #{order.id.replace(/-/g, '').slice(0, 8).toUpperCase()}
        </span>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-4">
          {/* Images + summary */}
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              {visible.map((item, i) => (
                <div key={item.id}
                  className={`w-12 h-12 rounded-xl bg-gray-100 overflow-hidden border-2 border-white flex-shrink-0 ${i > 0 ? '-ml-3' : ''}`}>
                  {item.product_image_url
                    ? <img src={item.product_image_url} alt={item.product_name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-gray-300" /></div>}
                </div>
              ))}
              {extra > 0 && (
                <div className="w-12 h-12 rounded-xl bg-gray-100 -ml-3 border-2 border-white flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-semibold text-gray-500">+{extra}</span>
                </div>
              )}
            </div>
            <div>
              <p className="text-[14px] font-semibold text-gray-900">{items.length} item{items.length !== 1 ? 's' : ''}</p>
              <p className="text-[12px] text-gray-400 mt-0.5 leading-snug line-clamp-1 max-w-[200px]">
                {items[0]?.product_name}
              </p>
              {items.length > 1 && (
                <p className="text-[11px] text-gray-400">+{items.length - 1} more</p>
              )}
            </div>
          </div>

          {/* Total */}
          <div className="text-right flex-shrink-0">
            <p className="text-[18px] font-bold text-gray-900">{fmt(order.total_amount)}</p>
            <p className="text-[11px] text-gray-400 uppercase mt-0.5">{order.payment_method}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="my-4 h-px bg-gray-100" />

        {/* Bottom row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Meta */}
          <div className="flex items-center gap-3 text-[12px] text-gray-500">
            <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span>{fmtDate(order.created_at)}</span>
            {order.status === 'shipped' && trackingNum && (
              <>
                <span className="text-gray-300">·</span>
                <Truck className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span>Tracking: {String(trackingNum)}</span>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {order.status === 'delivered' && onReturn && (
              <button
                onClick={() => onReturn(order)}
                className="text-[12px] text-[#FF5F57] border border-red-200 rounded-full px-4 py-1.5 hover:bg-red-50 transition-colors font-medium"
              >
                Return
              </button>
            )}
            <button
              onClick={() => router.push('/student/orders/' + order.id)}
              className="text-[12px] font-medium text-gray-700 border border-gray-200 rounded-full px-4 py-1.5 hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              View Details →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
