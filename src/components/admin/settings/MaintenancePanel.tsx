'use client';

import { useState, useEffect } from 'react';

export default function MaintenancePanel({
  initial,
  onSave,
}: {
  initial: { enabled: boolean; message: string };
  onSave: (payload: { enabled: boolean; message: string }) => Promise<void>;
}) {
  const [enabled, setEnabled] = useState(Boolean(initial.enabled));
  const [message, setMessage] = useState(initial.message || 'Maintenance mode is active.');
  const [loading, setLoading] = useState(false);

  const [debouncedMessage, setDebouncedMessage] = useState(message);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedMessage(message);
    }, 1000);
    return () => clearTimeout(handler);
  }, [message]);

  useEffect(() => {
    // Only auto-save if something meaningfully changed from initial
    if (enabled !== initial.enabled || debouncedMessage !== initial.message) {
      onSave({ enabled, message: debouncedMessage }).catch(() => {});
    }
  }, [enabled, debouncedMessage]); // auto-save dependencies


  const submit = async () => {
    setLoading(true);
    try {
      await onSave({ enabled, message });
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
        <p className="text-[12px] font-semibold text-[#6E6E73]">Maintenance Mode</p>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium text-[#1D1D1F]">Enable Maintenance Banner</p>
          <button
            type="button"
            onClick={() => setEnabled((v) => !v)}
            className={`relative h-7 w-12 rounded-full transition ${enabled ? 'bg-[#FF9F0A]' : 'bg-[#D1D1D6]'}`}
          >
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${enabled ? 'left-6' : 'left-1'}`} />
          </button>
        </div>
        <label className="grid gap-1">
          <span className="text-[12px] font-semibold text-[#6E6E73]">Banner Message</span>
          <textarea
            rows={3}
            className="rounded-xl border border-[rgba(0,0,0,0.1)] px-3 py-2 text-[13px]"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>
      </div>

      <div className="flex justify-end px-5 pb-5">
        <button
          onClick={submit}
          disabled={loading}
          className="rounded-full bg-[#1D1D1F] px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Maintenance'}
        </button>
      </div>
    </div>
  );
}
