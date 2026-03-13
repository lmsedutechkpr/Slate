'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Loader2, CreditCard, Smartphone, Building2 } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';

interface CartProduct {
  id: string;
  name: string;
  price: number;
  discounted_price?: number;
  images?: string[];
  stock_qty: number;
  seller_id?: string;
}

interface CartItem {
  id: string;
  quantity: number;
  products: CartProduct;
}

interface Address {
  id: string;
  full_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
}

interface PaymentStepProps {
  cartItems: CartItem[];
  selectedAddressId: string;
  addresses: Address[];
  userId: string;
  finalTotal: number;
  appliedCoupon: { id: string; code: string; used_count?: number } | null;
  totalDiscount: number;
  subtotal: number;
  onBack: () => void;
  onSuccess: (orderId: string, method: string) => void;
}

type PaymentMethod = 'upi' | 'card' | 'netbanking';
type PaymentState = 'idle' | 'processing';

function TrafficLights({ size = 8 }: { size?: number }) {
  const s = `${size}px`;
  return (
    <div className="flex items-center gap-1.5">
      <div style={{ width: s, height: s }} className="rounded-full bg-[#FF5F57]" />
      <div style={{ width: s, height: s }} className="rounded-full bg-[#FEBC2E]" />
      <div style={{ width: s, height: s }} className="rounded-full bg-[#28C840]" />
    </div>
  );
}

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN'); }

const BANKS = ['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Yes Bank', 'PNB', 'Bank of Baroda'];

const METHOD_OPTIONS = [
  { id: 'upi' as const, label: 'UPI', sub: 'Google Pay, PhonePe, Paytm', icon: Smartphone },
  { id: 'card' as const, label: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay', icon: CreditCard },
  { id: 'netbanking' as const, label: 'Net Banking', sub: 'All major Indian banks', icon: Building2 },
];

export default function PaymentStep({
  cartItems, selectedAddressId, addresses, userId,
  finalTotal, appliedCoupon, totalDiscount, subtotal, onBack, onSuccess,
}: PaymentStepProps) {
  const supabase = createClient();
  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [payState, setPayState] = useState<PaymentState>('idle');

  // UPI fields
  const [upiId, setUpiId] = useState('');
  const [upiVerified, setUpiVerified] = useState(false);
  // Card fields
  const [cardNum, setCardNum] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  // Net banking
  const [bank, setBank] = useState('');
  // Validation error
  const [validationError, setValidationError] = useState('');

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

  const formatCardNum = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const processPayment = async () => {
    // Validation
    setValidationError('');
    if (method === 'upi') {
      if (!upiId.trim()) { setValidationError('Please enter your UPI ID'); return; }
    } else if (method === 'card') {
      if (!cardNum.trim() || cardNum.replace(/\s/g, '').length < 16) { setValidationError('Please enter a valid 16-digit card number'); return; }
      if (!expiry.trim() || expiry.length < 5) { setValidationError('Please enter a valid expiry date (MM/YY)'); return; }
      if (!cvv.trim() || cvv.length < 3) { setValidationError('Please enter a valid CVV'); return; }
      if (!cardName.trim()) { setValidationError('Please enter the name on card'); return; }
    } else if (method === 'netbanking') {
      if (!bank) { setValidationError('Please select your bank'); return; }
    }
    setPayState('processing');

    try {
      // Simulate 2 second payment delay
      await new Promise(r => setTimeout(r, 2000));

      // 1. Insert order
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          customer_id: userId,
          shipping_address_id: selectedAddressId,
          coupon_id: appliedCoupon?.id ?? null,
          subtotal,
          discount_amount: totalDiscount,
          total_amount: finalTotal,
          currency: 'INR',
          payment_method: method,
          payment_id: 'SIMULATED-' + Date.now(),
          status: 'confirmed',
          notes: 'Simulated payment'
        })
        .select('id')
        .single();

      if (orderErr) throw orderErr;

      // 2. Insert order items with all required fields
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.products.id,
        seller_id: item.products.seller_id ?? null,
        product_name: item.products.name,
        product_image_url: item.products.images?.[0] ?? null,
        quantity: item.quantity,
        unit_price: item.products.discounted_price ?? item.products.price,
        total_price: (item.products.discounted_price ?? item.products.price) * item.quantity,
        fulfillment_status: 'pending',
      }));

      const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
      if (itemsErr) throw new Error('Order items failed: ' + itemsErr.message);

      // 3. Decrement stock quantities for each product ordered
      await Promise.all(
        cartItems.map(async item => {
          // Fetch current stock, then update to prevent going below 0
          const { data: prod } = await supabase
            .from('products')
            .select('stock_qty')
            .eq('id', item.products.id)
            .single();
          const newQty = Math.max(0, (prod?.stock_qty ?? 0) - item.quantity);
          await supabase
            .from('products')
            .update({ stock_qty: newQty })
            .eq('id', item.products.id);
        })
      );

      // 4. Delete cart items
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId);

      // 4. Increment coupon usage if applied
      if (appliedCoupon) {
        await supabase
          .from('coupons')
          .update({ used_count: (appliedCoupon.used_count ?? 0) + 1 })
          .eq('id', appliedCoupon.id);
      }

      // 5. Insert order notification manually (needed because the DB trigger
      //    references the old user_id column; we use customer_id instead)
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'order',
        title: 'Order Confirmed',
        message: `Your order of ${fmt(finalTotal)} has been placed successfully.`,
        action_url: '/student/orders',
        is_read: false,
      });

      // 6. Clear cart store
      useCartStore.getState().setCount(0);

      // 7. Show success
      onSuccess(order.id, method);
    } catch (e: any) {
      toast.error(e.message || 'Payment failed. Please try again.');
      setPayState('idle');
    }
  };

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors bg-white";
  const labelCls = "block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1";

  return (
    <div className="space-y-4">

      {/* Payment method selector */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex items-center gap-3">
          <TrafficLights size={8} />
          <span className="ml-1 text-[13px] font-semibold text-gray-900">Select Payment Method</span>
        </div>
        <div className="p-4 space-y-3">
          {METHOD_OPTIONS.map(opt => {
            const Icon = opt.icon;
            const isSelected = method === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => setMethod(opt.id)}
                className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border ${
                  isSelected ? 'border-gray-900 shadow-sm' : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <TrafficLights size={6} />
                <Icon className="w-5 h-5 text-gray-700 ml-1" />
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-gray-900">{opt.label}</p>
                  <p className="text-[12px] text-gray-400 mt-0.5">{opt.sub}</p>
                </div>
                {/* Radio */}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  isSelected ? 'border-gray-900' : 'border-gray-300'
                }`}>
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* UPI fields */}
      {method === 'upi' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex items-center gap-3">
            <TrafficLights size={6} />
            <span className="ml-1 text-[13px] font-semibold text-gray-900">UPI Details</span>
          </div>
          <div className="p-5">
            <label className={labelCls}>UPI ID</label>
            <div className="flex gap-2">
              <input
                className={inputCls}
                value={upiId}
                onChange={e => { setUpiId(e.target.value); setUpiVerified(false); setValidationError(''); }}
                placeholder="yourname@upi"
              />
              <button
                onClick={() => { if (upiId.trim()) setUpiVerified(true); }}
                className={`font-semibold text-[13px] rounded-xl px-4 py-2.5 transition-colors whitespace-nowrap border ${
                  upiVerified
                    ? 'bg-green-50 text-[#28C840] border-green-200'
                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                }`}
              >
                {upiVerified ? '✓ Verified' : 'Verify'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card fields */}
      {method === 'card' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex items-center gap-3">
            <TrafficLights size={6} />
            <span className="ml-1 text-[13px] font-semibold text-gray-900">Card Details</span>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className={labelCls}>Card Number</label>
              <input
                className={inputCls}
                value={cardNum}
                onChange={e => setCardNum(formatCardNum(e.target.value))}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Expiry</label>
                <input
                  className={inputCls}
                  value={expiry}
                  onChange={e => setExpiry(formatExpiry(e.target.value))}
                  placeholder="MM/YY"
                  maxLength={5}
                />
              </div>
              <div>
                <label className={labelCls}>CVV</label>
                <input
                  className={inputCls}
                  type="password"
                  value={cvv}
                  onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  placeholder="•••"
                  maxLength={3}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Name on Card</label>
              <input
                className={inputCls}
                value={cardName}
                onChange={e => { setCardName(e.target.value); setValidationError(''); }}
                placeholder="As printed on card"
              />
            </div>
          </div>
        </div>
      )}

      {/* Net Banking */}
      {method === 'netbanking' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex items-center gap-3">
            <TrafficLights size={6} />
            <span className="ml-1 text-[13px] font-semibold text-gray-900">Select Bank</span>
          </div>
          <div className="p-5">
            <label className={labelCls}>Bank</label>
            <select
              value={bank}
              onChange={e => setBank(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-gray-900 focus:outline-none focus:border-gray-400 transition-colors bg-white"
            >
              <option value="">Select your bank</option>
              {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <p className="text-[12px] text-gray-400 mt-3">You will be redirected to your bank (simulated)</p>
          </div>
        </div>
      )}

      {/* Order review */}
      {selectedAddress && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex items-center gap-3">
            <TrafficLights size={6} />
            <span className="ml-1 text-[13px] font-semibold text-gray-900">Order Review</span>
          </div>
          <div className="p-4">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold">Delivering to</p>
            <p className="text-[13px] text-gray-900 mt-1 font-medium">{selectedAddress.full_name}</p>
            <p className="text-[13px] text-gray-500 mt-0.5">
              {selectedAddress.address_line1}
              {selectedAddress.address_line2 && `, ${selectedAddress.address_line2}`}
              {`, ${selectedAddress.city}, ${selectedAddress.state} — ${selectedAddress.pincode}`}
            </p>
            <p className="text-[13px] text-gray-500 mt-2">
              {cartItems.reduce((s, ci) => s + ci.quantity, 0)} item(s) · {fmt(finalTotal)}
            </p>
          </div>
        </div>
      )}

      {/* Validation error */}
      {validationError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <span className="text-[13px] text-[#FF5F57] font-medium">{validationError}</span>
        </div>
      )}

      {/* Navigation + Pay */}
      <div className="flex gap-3 pt-2 pb-8">
        <button
          onClick={onBack}
          disabled={payState === 'processing'}
          className="flex items-center gap-1.5 text-[13px] text-gray-500 border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-50 hover:text-gray-800 transition-colors disabled:opacity-40"
        >
          ← Back
        </button>
        <button
          onClick={processPayment}
          disabled={payState === 'processing'}
          className={`flex-1 font-bold text-[15px] rounded-full py-3.5 flex items-center justify-center gap-2.5 transition-all ${
            payState === 'processing'
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm'
          }`}
        >
          {payState === 'processing' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing payment...
            </>
          ) : (
            `Pay ${fmt(finalTotal)} →`
          )}
        </button>
      </div>
    </div>
  );
}
