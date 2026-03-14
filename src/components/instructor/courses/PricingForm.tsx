'use client';

import { useState } from 'react';
import { CheckCircle, DollarSign } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import TrafficLights from '@/components/auth/TrafficLights';
import { cn } from '@/lib/utils';

interface Props {
  course: any; commissionRate: number;
  onUpdate: (d: any) => void;
  setSaveStatus: (s: 'idle' | 'saving' | 'saved' | 'error') => void;
  setLastSaved: (d: Date) => void;
}

const inputCls = 'w-full rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#F5F5F7] px-4 py-2.5 text-[14px] text-[#1D1D1F] placeholder:text-[#AEAEB2] focus:outline-none focus:border-[rgba(0,0,0,0.2)]';

export function PricingForm({ course, commissionRate, onUpdate, setSaveStatus, setLastSaved }: Props) {
  const supabase = createClient();
  const [isFree, setIsFree] = useState(course.is_free ?? false);
  const [price, setPrice] = useState<number>(course.price ?? 0);
  const [discountedPrice, setDiscountedPrice] = useState<number | ''>(course.discounted_price ?? '');
  const [certificate, setCertificate] = useState(course.certificate_enabled ?? false);

  const save = async (updates: Record<string, unknown>) => {
    setSaveStatus('saving');
    onUpdate(updates);
    const { error } = await supabase.from('courses').update(updates).eq('id', course.id);
    if (error) { setSaveStatus('error'); return; }
    setSaveStatus('saved');
    setLastSaved(new Date());
  };

  const toggleFree = async (val: boolean) => {
    setIsFree(val);
    await save({ is_free: val, ...(val ? { price: 0, discounted_price: null } : {}) });
  };

  const earnings = Math.round(price * (commissionRate / 100));
  const fee = price - earnings;
  const saleEarnings = typeof discountedPrice === 'number' ? Math.round(discountedPrice * (commissionRate / 100)) : 0;
  const discountPct = typeof discountedPrice === 'number' && price > 0
    ? Math.round(((price - discountedPrice) / price) * 100) : 0;
  const priceError = typeof discountedPrice === 'number' && discountedPrice >= price;

  return (
    <div>
      <h2 className="mb-6 font-sans text-[22px] font-bold text-[#1D1D1F]">Pricing</h2>

      {/* Free Toggle */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
        <div className="flex h-11 items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
          <TrafficLights size="sm" />
          <span className="ml-3 text-[13px] font-semibold text-[#1D1D1F]">Course Type</span>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between rounded-xl bg-[#F5F5F7] p-4">
            <div>
              <p className="text-[14px] font-semibold text-[#1D1D1F]">Free Course</p>
              <p className="mt-0.5 text-[12px] text-[#6E6E73]">Students can enroll at no cost</p>
            </div>
            <button
              onClick={() => toggleFree(!isFree)}
              className={cn('h-6 w-11 rounded-full transition-colors', isFree ? 'bg-[#28C840]' : 'bg-[rgba(0,0,0,0.12)]')}
            >
              <div className={cn('h-5 w-5 rounded-full bg-white shadow transition-transform mx-0.5', isFree ? 'translate-x-5' : 'translate-x-0')} />
            </button>
          </div>
          {isFree && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#EDFAF0] p-4">
              <CheckCircle className="h-4 w-4 shrink-0 text-[#28C840]" />
              <p className="text-[13px] text-[#28C840]">This course will be available for free. Great for building your audience!</p>
            </div>
          )}
        </div>
      </div>

      {/* Price fields (only if not free) */}
      {!isFree && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
          <div className="flex h-11 items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
            <TrafficLights size="sm" />
            <span className="ml-3 text-[13px] font-semibold text-[#1D1D1F]">Pricing Details</span>
          </div>
          <div className="space-y-5 p-6">
            {/* Original Price */}
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#1D1D1F]">Course Price (₹) *</label>
              <input
                className={inputCls}
                type="number" min={0} step={1}
                value={price === 0 && !course.price ? '' : price}
                placeholder="e.g. 1999"
                onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                onBlur={() => {
                  if (price !== (course.price || 0)) save({ price });
                }}
              />
              <p className="mt-1 text-[12px] text-[#6E6E73]">Set the full price before any discount</p>
            </div>

            {/* Sale Price */}
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#1D1D1F]">Sale Price (₹) — Optional</label>
              <input
                className={cn(inputCls, priceError && 'border-[#FF5F57]')}
                type="number" min={0} step={1}
                value={discountedPrice}
                placeholder="Leave empty for no discount"
                onChange={(e) => setDiscountedPrice(e.target.value ? parseInt(e.target.value) : '')}
                onBlur={() => {
                  const dp = discountedPrice || null;
                  if (dp !== (course.discounted_price || null)) save({ discounted_price: dp });
                }}
              />
              {priceError && (
                <p className="mt-1 text-[11px] text-[#FF5F57]">Sale price must be less than original price</p>
              )}
              {!priceError && typeof discountedPrice === 'number' && discountedPrice > 0 && (
                <div className="mt-2 rounded-xl bg-[#FFF0EF] p-3">
                  <p className="text-[13px] text-[#FF5F57]">
                    Students save {discountPct}% (₹{(price - discountedPrice).toLocaleString('en-IN')})
                  </p>
                </div>
              )}
            </div>

            {/* Revenue breakdown */}
            {price > 0 && (
              <div className="overflow-hidden rounded-xl bg-[#F5F5F7]">
                <div className="flex h-9 items-center bg-[rgba(0,0,0,0.03)] px-4">
                  <TrafficLights size="xs" />
                  <span className="ml-2 text-[12px] font-semibold text-[#1D1D1F]">Your Earnings per Sale</span>
                </div>
                <div className="space-y-2 p-4">
                  {[
                    { label: 'Course price', value: `₹${price.toLocaleString('en-IN')}`, color: '' },
                    { label: `Platform fee (${100 - commissionRate}%)`, value: `-₹${fee.toLocaleString('en-IN')}`, color: 'text-[#FF5F57]' },
                    { label: `Your earnings (${commissionRate}%)`, value: `₹${earnings.toLocaleString('en-IN')}`, color: 'text-[#28C840] font-bold' },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between text-[13px]">
                      <span className="text-[#6E6E73]">{row.label}</span>
                      <span className={cn('font-medium text-[#1D1D1F]', row.color)}>{row.value}</span>
                    </div>
                  ))}
                  {saleEarnings > 0 && (
                    <div className="flex items-center justify-between border-t border-[rgba(0,0,0,0.06)] pt-2 text-[13px]">
                      <span className="text-[#6E6E73]">With sale price applied</span>
                      <span className="text-[#6E6E73]">₹{saleEarnings.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Certificate */}
      <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
        <div className="flex h-11 items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
          <TrafficLights size="sm" />
          <span className="ml-3 text-[13px] font-semibold text-[#1D1D1F]">Certificate of Completion</span>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-medium text-[#1D1D1F]">Enable Certificate</p>
              <p className="mt-0.5 text-[12px] text-[#6E6E73]">Award certificates to students who complete this course</p>
            </div>
            <button
              onClick={() => { setCertificate(!certificate); save({ certificate_enabled: !certificate }); }}
              className={cn('h-6 w-11 rounded-full transition-colors', certificate ? 'bg-[#28C840]' : 'bg-[rgba(0,0,0,0.12)]')}
            >
              <div className={cn('h-5 w-5 rounded-full bg-white shadow transition-transform mx-0.5', certificate ? 'translate-x-5' : 'translate-x-0')} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
