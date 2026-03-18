'use client';

import { Check, Package, Clock, CheckCircle2, XCircle, Truck } from 'lucide-react';

interface TimelineProps {
  status: string;
  createdAt: string;
  updatedAt?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

// Ordered list matching full order lifecycle
const STATUS_ORDER = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

const STEPS = [
  { key: 'pending',    label: 'Order Placed' },
  { key: 'confirmed',  label: 'Order Confirmed' },
  { key: 'processing', label: 'Being Prepared' },
  { key: 'shipped',    label: 'Shipped' },
  { key: 'delivered',  label: 'Delivered' },
];

function fmtDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function TrafficLights() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full bg-[#FF5F57]" />
      <div className="w-2 h-2 rounded-full bg-[#FEBC2E]" />
      <div className="w-2 h-2 rounded-full bg-[#28C840]" />
    </div>
  );
}

export default function OrderTimeline({
  status, createdAt, updatedAt, trackingNumber, trackingUrl,
}: TimelineProps) {
  const isCancelled = status === 'cancelled' || status === 'refunded';
  const currentIdx = STATUS_ORDER.indexOf(status);

  const steps = isCancelled
    ? [
        { key: 'pending', label: 'Order Placed' },
        { key: 'cancelled', label: status === 'refunded' ? 'Refunded' : 'Cancelled' },
      ]
    : STEPS;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-5">
      <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex items-center gap-3">
        <TrafficLights />
        <span className="ml-1 text-[13px] font-semibold text-gray-900">Order Progress</span>
      </div>

      <div className="p-5">
        {steps.map((step, i) => {
          const isCancelledStep = step.key === 'cancelled' || step.key === 'refunded';
          const stepIdx = STATUS_ORDER.indexOf(step.key);
          const isDone = isCancelled
            ? i === 0
            : stepIdx !== -1 && currentIdx >= stepIdx;
          const isActive = !isCancelled && stepIdx !== -1 && stepIdx === currentIdx;
          const isLast = i === steps.length - 1;

          return (
            <div key={step.key + i} className="flex gap-4">
              {/* Icon */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isCancelledStep
                    ? 'bg-red-50 border border-red-200'
                    : isDone
                    ? 'bg-gray-900'
                    : 'bg-gray-100 border border-gray-200'
                }`}>
                  {isCancelledStep ? (
                    <XCircle className="w-4 h-4 text-[#FF5F57]" />
                  ) : isDone ? (
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                  )}
                </div>
                {!isLast && (
                  <div className={`w-px flex-1 min-h-[28px] mt-1 ${
                    isDone && !isCancelled ? 'bg-gray-900' : 'bg-gray-200'
                  }`} />
                )}
              </div>

              {/* Text */}
              <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
                <p className={`text-[13px] font-semibold ${
                  isCancelledStep
                    ? 'text-[#FF5F57]'
                    : isDone
                    ? 'text-gray-900'
                    : 'text-gray-400'
                }`}>
                  {step.label}
                </p>
                {isDone && !isCancelledStep && (
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {i === 0 && createdAt ? fmtDate(createdAt) : isActive && updatedAt ? fmtDate(updatedAt) : ''}
                  </p>
                )}
                {step.key === 'shipped' && isDone && trackingNumber && (
                  <div className="mt-1.5">
                    <p className="text-[11px] text-gray-500">Tracking: {trackingNumber}</p>
                    {trackingUrl && (
                      <a href={trackingUrl} target="_blank" rel="noopener noreferrer"
                        className="text-[11px] text-gray-900 underline">
                        Track package →
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
  );
}
