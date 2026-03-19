'use client';

import { useState, useEffect } from 'react';

export default function CommissionSettingsForm({
  initial,
  onSave,
}: {
  initial: { platformFeePercent: number; taxRatePercent: number };
  onSave: (payload: { platformFeePercent: number; taxRatePercent: number }) => Promise<void>;
}) {
  const [platformFeePercent, setPlatformFeePercent] = useState(Number(initial.platformFeePercent || 10));
  const [taxRatePercent, setTaxRatePercent] = useState(Number(initial.taxRatePercent || 18));
  const [loading, setLoading] = useState(false);

  const [debouncedPlatformFee, setDebouncedPlatformFee] = useState(platformFeePercent);
  const [debouncedTaxRate, setDebouncedTaxRate] = useState(taxRatePercent);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedPlatformFee(platformFeePercent);
      setDebouncedTaxRate(taxRatePercent);
    }, 1000);
    return () => clearTimeout(handler);
  }, [platformFeePercent, taxRatePercent]);

  useEffect(() => {
    if (debouncedPlatformFee !== initial.platformFeePercent || 
        debouncedTaxRate !== initial.taxRatePercent) {
      onSave({ platformFeePercent: debouncedPlatformFee, taxRatePercent: debouncedTaxRate }).catch(() => {});
    }
  }, [debouncedPlatformFee, debouncedTaxRate]);


  const submit = async () => {
    setLoading(true);
    try {
      await onSave({ platformFeePercent, taxRatePercent });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
      <div className="flex h-11 items-center gap-3 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-4">
        <div className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
          <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
          <span className="h-2 w-2 rounded-full bg-[#28C840]" />
        </div>
        <p className="text-[12px] font-semibold text-[#6E6E73]">Commission Settings</p>
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-[12px] font-semibold text-[#6E6E73]">Platform Fee (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            className="h-10 rounded-xl border border-[rgba(0,0,0,0.1)] px-3 text-[13px]"
            value={platformFeePercent}
            onChange={(e) => setPlatformFeePercent(Number(e.target.value))}
          />
        </label>
        <label className="grid gap-1">
          <span className="text-[12px] font-semibold text-[#6E6E73]">Tax Rate (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            className="h-10 rounded-xl border border-[rgba(0,0,0,0.1)] px-3 text-[13px]"
            value={taxRatePercent}
            onChange={(e) => setTaxRatePercent(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="flex justify-end px-5 pb-5">
        <button
          onClick={submit}
          disabled={loading}
          className="rounded-full bg-[#1D1D1F] px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Commission'}
        </button>
      </div>
    </div>
  );
}
