'use client';

import { useState, useEffect } from 'react';

export default function GeneralSettingsForm({
  initial,
  onSave,
}: {
  initial: {
    siteName: string;
    supportEmail: string;
    timezone: string;
  };
  onSave: (payload: { siteName: string; supportEmail: string; timezone: string }) => Promise<void>;
}) {
  const [siteName, setSiteName] = useState(initial.siteName || 'Slate LMS');
  const [supportEmail, setSupportEmail] = useState(initial.supportEmail || 'support@example.com');
  const [timezone, setTimezone] = useState(initial.timezone || 'Asia/Kolkata');
  const [loading, setLoading] = useState(false);

  const [debouncedSiteName, setDebouncedSiteName] = useState(siteName);
  const [debouncedSupportEmail, setDebouncedSupportEmail] = useState(supportEmail);
  const [debouncedTimezone, setDebouncedTimezone] = useState(timezone);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSiteName(siteName);
      setDebouncedSupportEmail(supportEmail);
      setDebouncedTimezone(timezone);
    }, 1000);
    return () => clearTimeout(handler);
  }, [siteName, supportEmail, timezone]);

  useEffect(() => {
    if (debouncedSiteName !== initial.siteName || 
        debouncedSupportEmail !== initial.supportEmail || 
        debouncedTimezone !== initial.timezone) {
      onSave({ siteName: debouncedSiteName, supportEmail: debouncedSupportEmail, timezone: debouncedTimezone }).catch(() => {});
    }
  }, [debouncedSiteName, debouncedSupportEmail, debouncedTimezone]);


  const submit = async () => {
    setLoading(true);
    try {
      await onSave({ siteName, supportEmail, timezone });
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
        <p className="text-[12px] font-semibold text-[#6E6E73]">General Settings</p>
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-3">
        <label className="grid gap-1">
          <span className="text-[12px] font-semibold text-[#6E6E73]">Site Name</span>
          <input
            className="h-10 rounded-xl border border-[rgba(0,0,0,0.1)] px-3 text-[13px]"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
          />
        </label>
        <label className="grid gap-1">
          <span className="text-[12px] font-semibold text-[#6E6E73]">Support Email</span>
          <input
            className="h-10 rounded-xl border border-[rgba(0,0,0,0.1)] px-3 text-[13px]"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
          />
        </label>
        <label className="grid gap-1">
          <span className="text-[12px] font-semibold text-[#6E6E73]">Timezone</span>
          <input
            className="h-10 rounded-xl border border-[rgba(0,0,0,0.1)] px-3 text-[13px]"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          />
        </label>
      </div>

      <div className="flex justify-end px-5 pb-5">
        <button
          onClick={submit}
          disabled={loading}
          className="rounded-full bg-[#1D1D1F] px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save General'}
        </button>
      </div>
    </div>
  );
}
