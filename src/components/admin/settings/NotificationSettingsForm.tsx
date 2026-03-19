'use client';

import { useState, useEffect } from 'react';

export default function NotificationSettingsForm({
  initial,
  onSave,
}: {
  initial: { emailNotifications: boolean; purchaseAlerts: boolean; payoutAlerts: boolean };
  onSave: (payload: { emailNotifications: boolean; purchaseAlerts: boolean; payoutAlerts: boolean }) => Promise<void>;
}) {
  const [emailNotifications, setEmailNotifications] = useState(Boolean(initial.emailNotifications));
  const [purchaseAlerts, setPurchaseAlerts] = useState(Boolean(initial.purchaseAlerts));
  const [payoutAlerts, setPayoutAlerts] = useState(Boolean(initial.payoutAlerts));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (emailNotifications !== initial.emailNotifications || 
        purchaseAlerts !== initial.purchaseAlerts || 
        payoutAlerts !== initial.payoutAlerts) {
      onSave({ emailNotifications, purchaseAlerts, payoutAlerts }).catch(() => {});
    }
  }, [emailNotifications, purchaseAlerts, payoutAlerts]);


  const submit = async () => {
    setLoading(true);
    try {
      await onSave({ emailNotifications, purchaseAlerts, payoutAlerts });
    } finally {
      setLoading(false);
    }
  };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 rounded-full transition ${checked ? 'bg-[#34C759]' : 'bg-[#D1D1D6]'}`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${checked ? 'left-6' : 'left-1'}`}
      />
    </button>
  );

  return (
    <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
      <div className="flex h-11 items-center gap-3 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-4">
        <div className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
          <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
          <span className="h-2 w-2 rounded-full bg-[#28C840]" />
        </div>
        <p className="text-[12px] font-semibold text-[#6E6E73]">Notification Settings</p>
      </div>

      <div className="space-y-4 p-5 text-[13px] text-[#1D1D1F]">
        <div className="flex items-center justify-between">
          <p>Email Notifications</p>
          <Toggle checked={emailNotifications} onChange={setEmailNotifications} />
        </div>
        <div className="flex items-center justify-between">
          <p>New Purchase Alerts</p>
          <Toggle checked={purchaseAlerts} onChange={setPurchaseAlerts} />
        </div>
        <div className="flex items-center justify-between">
          <p>Payout Alerts</p>
          <Toggle checked={payoutAlerts} onChange={setPayoutAlerts} />
        </div>
      </div>

      <div className="flex justify-end px-5 pb-5">
        <button
          onClick={submit}
          disabled={loading}
          className="rounded-full bg-[#1D1D1F] px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Notifications'}
        </button>
      </div>
    </div>
  );
}
