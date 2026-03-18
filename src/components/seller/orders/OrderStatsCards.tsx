'use client';

import { Clock, Package, Truck, CheckCircle2, IndianRupee } from 'lucide-react';
import TrafficLights from '@/components/auth/TrafficLights';

interface OrderStatsCardsProps {
  stats: {
    pendingOrders: number;
    processingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    totalRevenue: number;
  };
}

export default function OrderStatsCards({ stats }: OrderStatsCardsProps) {
  const cards = [
    {
      icon: Clock,
      value: stats.pendingOrders,
      label: 'Pending',
      highlight: stats.pendingOrders > 0,
      highlightColor: '#FEBC2E',
    },
    {
      icon: Package,
      value: stats.processingOrders,
      label: 'Processing',
      highlight: stats.processingOrders > 0,
      highlightColor: '#FEBC2E',
    },
    {
      icon: Truck,
      value: stats.shippedOrders,
      label: 'Shipped',
      highlight: false,
      highlightColor: '',
    },
    {
      icon: CheckCircle2,
      value: stats.deliveredOrders,
      label: 'Delivered',
      highlight: stats.deliveredOrders > 0,
      highlightColor: '#28C840',
    },
    {
      icon: IndianRupee,
      value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`,
      label: 'Revenue',
      highlight: false,
      highlightColor: '',
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm"
        >
          <div className="flex h-8 items-center border-b border-[rgba(0,0,0,0.04)] bg-[#F5F5F7] px-3">
            <TrafficLights size="xs" />
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F5F5F7]">
                <card.icon className="h-4 w-4 text-[#6E6E73]" />
              </div>
              <div>
                <p
                  className="font-[DM_Sans] text-[20px] font-bold"
                  style={{ color: card.highlight ? card.highlightColor : '#1D1D1F' }}
                >
                  {card.value}
                </p>
                <p className="text-[11px] font-medium text-[#AEAEB2]">{card.label}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
