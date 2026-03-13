'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, Tag, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

import CheckoutSteps from './CheckoutSteps';
import CartReview from './CartReview';
import AddressStep from './AddressStep';
import PaymentStep from './PaymentStep';
import OrderSuccess from './OrderSuccess';

/* ─── Types ─────────────────────────────────────────────────── */
interface CartProduct {
  id: string;
  name: string;
  name_ta?: string;
  slug?: string;
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
  phone?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  is_default?: boolean;
}

interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  max_discount_amount?: number;
  used_count?: number;
}

interface CheckoutClientProps {
  cartItems: CartItem[];
  addresses: Address[];
  profile: { full_name?: string; phone?: string } | null;
  userId: string;
}

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN'); }

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

/* ─── Main Component ─────────────────────────────────────────── */
export default function CheckoutClient({ cartItems: initialItems, addresses, profile, userId }: CheckoutClientProps) {
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [cartItems, setCartItems] = useState<CartItem[]>(initialItems);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    addresses[0]?.id ?? null
  );

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);

  // Success state
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const [successPaymentMethod, setSuccessPaymentMethod] = useState('upi');

  /* ── Calculations ─────────────────────────────────────────── */
  const subtotal = useMemo(() =>
    cartItems.reduce((s, ci) => s + ci.products.price * ci.quantity, 0),
    [cartItems]
  );

  const itemDiscount = useMemo(() =>
    cartItems.reduce((s, ci) => {
      if (!ci.products.discounted_price) return s;
      return s + (ci.products.price - ci.products.discounted_price) * ci.quantity;
    }, 0),
    [cartItems]
  );

  const effectiveSubtotal = subtotal - itemDiscount;
  const totalDiscount = itemDiscount + couponDiscount;
  const finalTotal = Math.max(0, effectiveSubtotal - couponDiscount);
  const totalSavings = totalDiscount;

  /* ── Coupon logic ─────────────────────────────────────────── */
  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError(false);

    try {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('id, code, type, value, max_discount_amount, used_count, max_uses, expires_at')
        .eq('code', couponCode.toUpperCase().trim())
        .eq('is_active', true)
        .maybeSingle();

      if (!coupon) {
        setCouponError(true);
        return;
      }

      // Check expiry
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        setCouponError(true);
        return;
      }

      // Check usage limit
      if (coupon.max_uses != null && (coupon.used_count ?? 0) >= coupon.max_uses) {
        setCouponError(true);
        return;
      }

      // Calculate discount
      let discount = 0;
      if (coupon.type === 'percentage') {
        discount = effectiveSubtotal * (coupon.value / 100);
        if (coupon.max_discount_amount) {
          discount = Math.min(discount, coupon.max_discount_amount);
        }
      } else {
        discount = coupon.value;
      }
      discount = Math.round(Math.min(discount, effectiveSubtotal));

      setAppliedCoupon(coupon as Coupon);
      setCouponDiscount(discount);
      setCouponCode('');
      toast.success(`Coupon applied! You save ${fmt(discount)}`, {
        style: { color: '#28C840' }
      });
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponError(false);
  };

  /* ── Success handler ──────────────────────────────────────── */
  const handleSuccess = (orderId: string, method: string) => {
    setSuccessPaymentMethod(method);
    setSuccessOrderId(orderId);
  };

  if (successOrderId) {
    const addr = addresses.find(a => a.id === selectedAddressId);
    return (
      <OrderSuccess
        orderId={successOrderId}
        total={finalTotal}
        itemCount={cartItems.reduce((s, ci) => s + ci.quantity, 0)}
        selectedAddress={addr as any}
        paymentMethod={successPaymentMethod}
      />
    );
  }

  const displayedItems = showAllItems ? cartItems : cartItems.slice(0, 3);
  const hiddenCount = cartItems.length - 3;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px] text-gray-400 mb-4 flex-wrap">
        <Link href="/student/dashboard" className="hover:text-gray-700 transition-colors">Dashboard</Link>
        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
        <Link href="/student/shop" className="hover:text-gray-700 transition-colors">Shop</Link>
        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="text-gray-700 font-medium">Checkout</span>
      </div>

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-[26px] font-bold text-gray-900">Checkout</h1>
      </div>

      {/* Main layout */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── LEFT: Steps ─────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <CheckoutSteps currentStep={step} />

          {step === 1 && (
            <CartReview
              items={cartItems}
              userId={userId}
              onNext={() => setStep(2)}
              onItemsChange={setCartItems}
            />
          )}

          {step === 2 && (
            <AddressStep
              addresses={addresses}
              userId={userId}
              profile={profile}
              selectedAddressId={selectedAddressId}
              onSelectAddress={setSelectedAddressId}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}

          {step === 3 && (
            <PaymentStep
              cartItems={cartItems}
              selectedAddressId={selectedAddressId!}
              addresses={addresses}
              userId={userId}
              finalTotal={finalTotal}
              appliedCoupon={appliedCoupon}
              totalDiscount={totalDiscount}
              subtotal={effectiveSubtotal}
              onBack={() => setStep(2)}
              onSuccess={(orderId, method) => {
                handleSuccess(orderId, method);
              }}
            />
          )}
        </div>

        {/* ── RIGHT: Order Summary ─────────────────────────────── */}
        <div className="w-full lg:w-[360px] flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden lg:sticky lg:top-6">

            {/* Titlebar */}
            <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex items-center gap-3">
              <TrafficLights size={8} />
              <span className="ml-1 text-[13px] font-semibold text-gray-900 flex-1 text-center">
                Order Summary
              </span>
            </div>

            <div className="p-5">

              {/* Item list (max 3, rest collapsed) */}
              <div className="space-y-3 mb-4">
                {displayedItems.map(item => {
                  const img = item.products.images?.[0];
                  const price = (item.products.discounted_price ?? item.products.price) * item.quantity;
                  return (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100">
                        {img
                          ? <img src={img} alt={item.products.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full bg-gray-200" />}
                      </div>
                      <p className="text-[12px] text-gray-700 flex-1 line-clamp-1 font-medium">{item.products.name}</p>
                      <span className="text-[11px] text-gray-400 mr-1">×{item.quantity}</span>
                      <span className="text-[12px] font-semibold text-gray-900 whitespace-nowrap">{fmt(price)}</span>
                    </div>
                  );
                })}

                {!showAllItems && hiddenCount > 0 && (
                  <button
                    onClick={() => setShowAllItems(true)}
                    className="text-[11px] text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    + {hiddenCount} more item{hiddenCount > 1 ? 's' : ''}
                  </button>
                )}
              </div>

              <div className="h-px bg-gray-100 mb-4" />

              {/* Coupon */}
              {!appliedCoupon ? (
                <div className="mb-4">
                  <div className="flex gap-2">
                    <input
                      value={couponCode}
                      onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(false); }}
                      onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                      placeholder="Coupon code"
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors uppercase"
                    />
                    <button
                      onClick={applyCoupon}
                      disabled={applyingCoupon || !couponCode.trim()}
                      className="bg-gray-900 text-white rounded-xl px-4 py-2 text-[12px] font-semibold hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {applyingCoupon ? '...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-[11px] text-[#FF5F57] mt-1.5">Invalid or expired coupon</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2 mb-4">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-[#28C840]" />
                    <span className="text-[13px] font-semibold text-[#28C840]">{appliedCoupon.code}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-[#28C840]">−{fmt(couponDiscount)}</span>
                    <button onClick={removeCoupon} className="text-gray-400 hover:text-gray-700 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="h-px bg-gray-100 mb-4" />

              {/* Price breakdown */}
              <div className="space-y-2 mb-3">
                <div className="flex justify-between">
                  <span className="text-[13px] text-gray-500">Subtotal</span>
                  <span className="text-[13px] text-gray-900">{fmt(subtotal)}</span>
                </div>

                {itemDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[13px] text-gray-500">Discount on items</span>
                    <span className="text-[13px] text-[#28C840] font-medium">−{fmt(itemDiscount)}</span>
                  </div>
                )}

                {appliedCoupon && couponDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[13px] text-gray-500">Coupon ({appliedCoupon.code})</span>
                    <span className="text-[13px] text-[#28C840] font-medium">−{fmt(couponDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-[13px] text-gray-500">Delivery</span>
                  <span className="text-[13px] text-[#28C840] font-medium">FREE</span>
                </div>
              </div>

              <div className="h-px bg-gray-100 mb-3" />

              {/* Total */}
              <div className="flex justify-between items-end">
                <span className="text-[16px] font-bold text-gray-900">Total</span>
                <span className="text-[22px] font-extrabold text-gray-900">{fmt(finalTotal)}</span>
              </div>

              {totalSavings > 0 && (
                <p className="text-[11px] text-[#28C840] font-medium text-center mt-2">
                  You save {fmt(totalSavings)} on this order
                </p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
