'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import OrderCard from './OrderCard';
import ReturnModal from './ReturnModal';

type TabKey = 'all' | 'active' | 'delivered' | 'cancelled';

const TABS: { key: TabKey; label: string; statuses?: string[] }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active', statuses: ['confirmed', 'processing'] },
  { key: 'delivered', label: 'Delivered', statuses: ['delivered'] },
  { key: 'cancelled', label: 'Cancelled', statuses: ['cancelled', 'refunded'] },
];

interface OrdersPageClientProps {
  orders: any[];
  userId: string;
}

export default function OrdersPageClient({ orders: initialOrders, userId }: OrdersPageClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [orders, setOrders] = useState(initialOrders);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [returnOrder, setReturnOrder] = useState<any | null>(null);

  // Realtime order status updates
  useEffect(() => {
    const channel = supabase
      .channel('student-orders')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'orders',
        filter: `customer_id=eq.${userId}`,
      }, (payload: any) => {
        setOrders(prev => prev.map(o =>
          o.id === payload.new.id ? { ...o, ...payload.new } : o
        ));
        const newStatus = payload.new.status;
        const id = payload.new.id?.replace(/-/g, '').slice(0, 8).toUpperCase();
        toast(`Order #${id} is now ${newStatus}`);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, userId]);

  const filtered = orders.filter(o => {
    const tab = TABS.find(t => t.key === activeTab);
    if (!tab?.statuses) return true;
    return tab.statuses.includes(o.status);
  });

  const tabCount = (tab: typeof TABS[0]) => {
    if (!tab.statuses) return orders.length;
    return orders.filter(o => tab.statuses!.includes(o.status)).length;
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[26px] font-bold text-gray-900">My Orders</h1>
        <p className="text-[14px] text-gray-500 mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map(tab => {
          const count = tabCount(tab);
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900'
              }`}
            >
              {tab.label}
              <span className={`text-[11px] rounded-full px-1.5 py-0.5 ml-0.5 font-semibold ${
                isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden py-20 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-6">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
          </div>
          <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-4" />
          <p className="text-[18px] font-semibold text-gray-800">No orders yet</p>
          <p className="text-[14px] text-gray-400 mt-2">
            {activeTab === 'all'
              ? 'Your orders will appear here once you make a purchase.'
              : `No ${activeTab} orders found.`}
          </p>
          {activeTab === 'all' && (
            <button
              onClick={() => router.push('/student/shop')}
              className="mt-6 bg-gray-900 text-white font-semibold text-[14px] rounded-xl px-6 py-2.5 hover:bg-gray-800 transition-colors"
            >
              Browse Shop
            </button>
          )}
        </div>
      ) : (
        <div>
          {filtered.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onReturn={order.status === 'delivered' ? setReturnOrder : undefined}
            />
          ))}
        </div>
      )}

      {/* Return modal */}
      {returnOrder && (
        <ReturnModal
          open={!!returnOrder}
          onClose={() => setReturnOrder(null)}
          orderId={returnOrder.id}
          userId={userId}
          items={returnOrder.order_items ?? []}
        />
      )}
    </div>
  );
}
