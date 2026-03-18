'use client';

import { CheckCircle2 } from 'lucide-react';
import TrafficLights from '@/components/auth/TrafficLights';

interface OrderTimelineProps {
  status: string;
  createdAt: string;
  updatedAt?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

const STEPS = [
  { key: 'pending', label: 'Order Received', icon: '📦' },
  { key: 'processing', label: 'Processing', icon: '⚙️' },
  { key: 'shipped', label: 'Shipped', icon: '🚚' },
  { key: 'delivered', label: 'Delivered', icon: '✅' },
];

const STATUS_ORDER: Record<string, number> = {
  pending: 0,
  confirmed: 0,
  processing: 1,
  shipped: 2,
  delivered: 3,
};

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function OrderTimeline({ status, createdAt, updatedAt, trackingNumber, trackingUrl }: OrderTimelineProps) {
  const isCancelled = status === 'cancelled';
  const currentIndex = STATUS_ORDER[status] ?? -1;

  if (isCancelled) {
    return (
      <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
        <div className="flex h-10 items-center border-b border-[rgba(0,0,0,0.04)] bg-[#F5F5F7] px-4">
          <TrafficLights size="sm" />
          <span className="ml-3 font-[DM_Sans] text-[12px] font-bold uppercase tracking-wider text-[#6E6E73]">
            Timeline
          </span>
        </div>
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF0EF]">
              <span className="text-[12px]">❌</span>
            </div>
            <div>
              <p className="font-[DM_Sans] text-[13px] font-semibold text-[#FF5F57]">Order Cancelled</p>
              <p className="mt-0.5 text-[11px] text-[#AEAEB2]">{updatedAt ? formatDate(updatedAt) : formatDate(createdAt)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
      <div className="flex h-10 items-center border-b border-[rgba(0,0,0,0.04)] bg-[#F5F5F7] px-4">
        <TrafficLights size="sm" />
        <span className="ml-3 font-[DM_Sans] text-[12px] font-bold uppercase tracking-wider text-[#6E6E73]">
          Timeline
        </span>
      </div>
      <div className="p-5">
        <div className="relative space-y-0">
          {STEPS.map((step, i) => {
            const isDone = i <= currentIndex;
            const isCurrent = i === currentIndex;
            const isLast = i === STEPS.length - 1;

            return (
              <div key={step.key} className="flex items-start gap-3">
                {/* Vertical line + dot */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full ${
                      isDone ? 'bg-[#1D1D1F]' : 'border-2 border-[rgba(0,0,0,0.1)] bg-white'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-[#AEAEB2]" />
                    )}
                  </div>
                  {!isLast && (
                    <div
                      className={`w-0.5 ${isDone && i < currentIndex ? 'bg-[#1D1D1F]' : 'bg-[rgba(0,0,0,0.08)]'}`}
                      style={{ height: '32px' }}
                    />
                  )}
                </div>

                {/* Content */}
                <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
                  <p
                    className={`font-[DM_Sans] text-[13px] font-semibold ${
                      isDone ? 'text-[#1D1D1F]' : 'text-[#AEAEB2]'
                    } ${isCurrent ? 'text-[#1D1D1F]' : ''}`}
                  >
                    {step.label}
                  </p>
                  {isDone && (
                    <p className="mt-0.5 text-[11px] text-[#AEAEB2]">
                      {i === 0 && createdAt ? formatDate(createdAt) : i === currentIndex && updatedAt ? formatDate(updatedAt) : ''}
                    </p>
                  )}
                  {step.key === 'shipped' && isDone && trackingNumber && (
                    <div className="mt-1.5">
                      <p className="font-mono text-[11px] text-[#6E6E73]">Tracking: {trackingNumber}</p>
                      {trackingUrl && (
                        <a
                          href={trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 inline-block font-[DM_Sans] text-[11px] font-medium text-[#3B82F6] hover:underline"
                        >
                          Track Package →
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
