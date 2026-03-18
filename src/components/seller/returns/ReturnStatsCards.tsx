'use client';

import { Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import TrafficLights from '@/components/auth/TrafficLights';

interface ReturnStatsCardsProps {
  stats: {
    total: number;
    requested: number;
    approved: number;
    rejected: number;
    refunded: number;
  };
}

export default function ReturnStatsCards({ stats }: ReturnStatsCardsProps) {
  const cards = [
    {
      icon: Clock,
      value: stats.requested,
      label: 'Pending',
      highlight: stats.requested > 0,
      highlightColor: '#FEBC2E',
    },
    {
      icon: CheckCircle2,
      value: stats.approved,
      label: 'Approved',
      highlight: stats.approved > 0,
      highlightColor: '#28C840',
    },
    {
      icon: XCircle,
      value: stats.rejected,
      label: 'Rejected',
      highlight: false,
      highlightColor: '',
    },
    {
      icon: RefreshCw,
      value: stats.refunded,
      label: 'Refunded',
      highlight: stats.refunded > 0,
      highlightColor: '#007AFF',
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
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
