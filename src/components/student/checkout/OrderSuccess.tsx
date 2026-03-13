'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';

interface Address {
  id: string;
  full_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
}

interface OrderSuccessProps {
  orderId: string;
  total: number;
  itemCount: number;
  selectedAddress: Address | undefined;
  paymentMethod: string;
}

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN'); }

const METHOD_LABELS: Record<string, string> = {
  upi: 'UPI',
  card: 'Credit / Debit Card',
  netbanking: 'Net Banking',
};

function TrafficLights() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full bg-[#FF5F57]" />
      <div className="w-2 h-2 rounded-full bg-[#FEBC2E]" />
      <div className="w-2 h-2 rounded-full bg-[#28C840]" />
    </div>
  );
}

export default function OrderSuccess({ orderId, total, itemCount, selectedAddress, paymentMethod }: OrderSuccessProps) {
  const router = useRouter();
  const shortId = orderId.replace(/-/g, '').slice(0, 8).toUpperCase();

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden w-full max-w-lg">
        {/* Mac titlebar */}
        <div className="bg-gray-50 border-b border-gray-100 px-5 py-3">
          <TrafficLights />
        </div>

        <div className="p-8 text-center">
          {/* Success Icon - animated with CSS */}
          <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-green-50 flex items-center justify-center animate-[scale-in_0.5s_cubic-bezier(.175,.885,.32,1.275)_both]"
            style={{ animation: 'scaleIn 0.5s cubic-bezier(.175,.885,.32,1.275) both' }}>
            <CheckCircle2 className="w-9 h-9 text-[#28C840]" />
          </div>

          <style>{`
            @keyframes scaleIn {
              0% { transform: scale(0); opacity: 0; }
              70% { transform: scale(1.15); }
              100% { transform: scale(1); opacity: 1; }
            }
            .animate-scale-in { animation: scaleIn 0.5s cubic-bezier(.175,.885,.32,1.275) both; }
          `}</style>

          <h2 className="text-[26px] font-bold text-gray-900">Order Placed!</h2>
          <p className="text-[14px] text-gray-500 mt-2 leading-relaxed">
            Your order has been confirmed and will be delivered soon.
          </p>

          {/* Order ID pill */}
          <div className="inline-flex items-center bg-gray-100 rounded-xl px-4 py-2 mt-4 font-mono text-[13px] text-gray-600 border border-gray-200">
            Order #{shortId}
          </div>

          <div className="h-px bg-gray-100 my-6" />

          {/* Summary */}
          <div className="text-left space-y-1.5">
            <p className="text-[13px] text-gray-500">
              <span className="font-medium text-gray-700">{itemCount} item{itemCount !== 1 ? 's' : ''}</span> · {fmt(total)}
            </p>
            {selectedAddress && (
              <p className="text-[13px] text-gray-500">
                <span className="font-medium text-gray-700">Delivering to:</span>{' '}
                {selectedAddress.address_line1}, {selectedAddress.city}, {selectedAddress.state}
              </p>
            )}
            <p className="text-[13px] text-gray-500 mt-1">
              <span className="font-medium text-gray-700">Payment:</span>{' '}
              {METHOD_LABELS[paymentMethod] ?? paymentMethod}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 mt-8">
            <button
              onClick={() => router.push('/student/orders')}
              className="w-full bg-gray-900 text-white font-semibold text-[14px] rounded-xl py-3 hover:bg-gray-800 transition-colors"
            >
              View My Orders →
            </button>
            <button
              onClick={() => router.push('/student/shop')}
              className="w-full border border-gray-200 text-gray-700 font-medium text-[14px] rounded-xl py-3 hover:bg-gray-50 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
