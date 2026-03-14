'use client';

import { useState, useEffect } from 'react';
import { Building2, Smartphone, Globe, X } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  instructorProfile: any;
  onSaved?: (method: string, details: any) => void;
}

const METHODS = [
  { key: 'bank', icon: Building2, label: 'Bank Transfer', desc: 'NEFT/RTGS to your bank account' },
  { key: 'upi', icon: Smartphone, label: 'UPI', desc: 'Instant transfer via UPI ID' },
  { key: 'paypal', icon: Globe, label: 'PayPal', desc: 'For international transfers' },
];

export default function PayoutSettingsForm({ isOpen, onClose, userId, instructorProfile, onSaved }: Props) {
  const supabase = createClient();
  const [method, setMethod] = useState<string>('bank');
  const [upiId, setUpiId] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccount, setConfirmAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountType, setAccountType] = useState<'savings' | 'current'>('savings');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [minThreshold, setMinThreshold] = useState(500);
  const [loading, setLoading] = useState(false);

  // Pre-fill from the DB-sourced instructorProfile on open
  useEffect(() => {
    if (!isOpen) return;
    const m = instructorProfile?.payout_method || 'bank';
    const d = instructorProfile?.payout_details || {};
    setMethod(m);
    setUpiId(d.upi_id || '');
    setAccountName(d.account_holder_name || '');
    // Mask existing account number
    setAccountNumber(d.account_number ? `****${String(d.account_number).slice(-4)}` : '');
    setConfirmAccount('');
    setIfsc(d.ifsc_code || '');
    setBankName(d.bank_name || '');
    setAccountType(d.account_type || 'savings');
    setPaypalEmail(d.paypal_email || '');
    setMinThreshold(d.min_threshold || 500);
  }, [isOpen, instructorProfile]);

  const saveSettings = async () => {
    // Validation
    if (method === 'bank' && accountNumber && confirmAccount &&
        accountNumber !== confirmAccount && !accountNumber.startsWith('****')) {
      toast.error('Account numbers do not match');
      return;
    }

    setLoading(true);
    try {
      const payoutDetails: Record<string, any> = { min_threshold: minThreshold };

      if (method === 'upi') {
        payoutDetails.upi_id = upiId;
      } else if (method === 'bank') {
        payoutDetails.account_holder_name = accountName;
        // Don't overwrite the real number if the user sees the masked version
        if (accountNumber && !accountNumber.startsWith('****')) {
          payoutDetails.account_number = accountNumber;
        } else if (instructorProfile?.payout_details?.account_number) {
          payoutDetails.account_number = instructorProfile.payout_details.account_number;
        }
        payoutDetails.ifsc_code = ifsc.toUpperCase();
        payoutDetails.bank_name = bankName;
        payoutDetails.account_type = accountType;
      } else if (method === 'paypal') {
        payoutDetails.paypal_email = paypalEmail;
      }

      const { error } = await supabase
        .from('instructor_profiles')
        .update({ payout_method: method, payout_details: payoutDetails })
        .eq('user_id', userId);

      if (error) throw error;

      // Mask account number in UI after successful save
      if (method === 'bank' && payoutDetails.account_number && !accountNumber.startsWith('****')) {
        setAccountNumber(`****${String(payoutDetails.account_number).slice(-4)}`);
        setConfirmAccount('');
      }

      // Notify parent to update UI immediately
      onSaved?.(method, payoutDetails);

      toast.success('Payout settings saved!', {
        style: { background: 'rgb(237,250,240)', border: '1px solid rgba(40,200,64,0.2)', color: '#28C840' },
      });
      setTimeout(() => onClose(), 300);
    } catch (err: any) {
      toast.error('Failed to save: ' + (err?.message || 'Please try again'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isSaved = !!(instructorProfile?.payout_method);

  return (
    <>
      {/* OVERLAY */}
      <div className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm" onClick={onClose} />

      {/* PANEL */}
      <div className="fixed right-0 top-0 bottom-0 w-[420px] max-w-full bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="p-6 border-b border-[rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-1.5 mb-3">
            <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
            <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
            <div className="h-2 w-2 rounded-full bg-[#28C840]" />
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-[DM_Sans] font-bold text-[18px] text-[#1D1D1F]">Payout Settings</h2>
              <p className="text-[12px] text-[#6E6E73] mt-1">How you receive your earnings</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-[#F5F5F7] text-[#6E6E73] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          {isSaved && (
            <div className="mt-3 flex items-center gap-2 bg-[#EDFAF0] rounded-xl px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-[#28C840]" />
              <span className="text-[12px] font-medium text-[#28C840]">Settings configured</span>
            </div>
          )}
        </div>

        {/* SCROLL CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* METHOD SELECTOR */}
          <div>
            <p className="text-[11px] text-[#AEAEB2] uppercase tracking-wide mb-3 font-[DM_Sans] font-semibold">
              Select payout method
            </p>
            <div className="space-y-3">
              {METHODS.map(m => (
                <button
                  key={m.key}
                  onClick={() => setMethod(m.key)}
                  className={`w-full text-left rounded-xl p-4 border transition-all ${
                    method === m.key
                      ? 'border-[#1D1D1F] bg-white shadow-sm'
                      : 'border-transparent bg-[#F5F5F7] hover:bg-[rgba(0,0,0,0.04)]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#FF5F57]" />
                    <div className="h-1.5 w-1.5 rounded-full bg-[#FEBC2E]" />
                    <div className="h-1.5 w-1.5 rounded-full bg-[#28C840]" />
                  </div>
                  <div className="flex items-center gap-3">
                    <m.icon className="w-5 h-5 text-[#1D1D1F]" />
                    <div>
                      <div className="font-[DM_Sans] font-semibold text-[13px] text-[#1D1D1F]">{m.label}</div>
                      <div className="text-[11px] text-[#6E6E73] mt-0.5">{m.desc}</div>
                    </div>
                    {method === m.key && (
                      <div className="ml-auto w-4 h-4 rounded-full bg-[#1D1D1F] flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* UPI FIELDS */}
          {method === 'upi' && (
            <div>
              <label className="block text-[12px] font-[DM_Sans] font-medium text-[#1D1D1F] mb-1.5">UPI ID</label>
              <input
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                placeholder="yourname@upi"
                className="w-full border border-[rgba(0,0,0,0.1)] rounded-xl px-4 py-2.5 text-[13px] font-[DM_Sans] text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F] bg-[#F5F5F7]"
              />
              <p className="text-[11px] text-[#AEAEB2] mt-1.5">Payments sent within 24 hours of payout date</p>
            </div>
          )}

          {/* BANK FIELDS */}
          {method === 'bank' && (
            <div className="space-y-4">
              {[
                { label: 'Account Holder Name', val: accountName, set: setAccountName, ph: 'Full name as on bank account' },
                { label: 'Account Number', val: accountNumber, set: setAccountNumber, ph: 'Enter account number' },
                { label: 'Confirm Account Number', val: confirmAccount, set: setConfirmAccount, ph: 'Re-enter account number' },
                { label: 'IFSC Code', val: ifsc, set: (v: string) => setIfsc(v.toUpperCase()), ph: 'SBIN0001234' },
                { label: 'Bank Name', val: bankName, set: setBankName, ph: 'e.g. State Bank of India' },
              ].map(({ label, val, set, ph }) => (
                <div key={label}>
                  <label className="block text-[12px] font-[DM_Sans] font-medium text-[#1D1D1F] mb-1.5">{label}</label>
                  <input
                    value={val}
                    onChange={e => (set as any)(e.target.value)}
                    placeholder={ph}
                    className="w-full border border-[rgba(0,0,0,0.1)] rounded-xl px-4 py-2.5 text-[13px] font-[DM_Sans] text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F] bg-[#F5F5F7]"
                  />
                  {label === 'Confirm Account Number' && accountNumber && confirmAccount &&
                    accountNumber !== confirmAccount && !accountNumber.startsWith('****') && (
                    <p className="text-[11px] text-[#FF5F57] mt-1">Account numbers do not match</p>
                  )}
                </div>
              ))}
              <div>
                <label className="block text-[12px] font-[DM_Sans] font-medium text-[#1D1D1F] mb-1.5">Account Type</label>
                <div className="flex gap-2">
                  {(['savings', 'current'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setAccountType(t)}
                      className={`px-4 py-2 rounded-full text-[12px] font-[DM_Sans] font-medium transition-all capitalize ${
                        accountType === t ? 'bg-[#1D1D1F] text-white' : 'bg-[#F5F5F7] text-[#6E6E73] hover:bg-[rgba(0,0,0,0.07)]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PAYPAL FIELDS */}
          {method === 'paypal' && (
            <div>
              <label className="block text-[12px] font-[DM_Sans] font-medium text-[#1D1D1F] mb-1.5">PayPal Email</label>
              <input
                type="email"
                value={paypalEmail}
                onChange={e => setPaypalEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-[rgba(0,0,0,0.1)] rounded-xl px-4 py-2.5 text-[13px] font-[DM_Sans] text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F] bg-[#F5F5F7]"
              />
            </div>
          )}

          {/* MINIMUM THRESHOLD */}
          <div>
            <label className="block text-[12px] font-[DM_Sans] font-medium text-[#1D1D1F] mb-1.5">
              Minimum Payout Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] text-[#6E6E73]">₹</span>
              <input
                type="number"
                min={100}
                value={minThreshold}
                onChange={e => setMinThreshold(Number(e.target.value))}
                className="w-full border border-[rgba(0,0,0,0.1)] rounded-xl pl-8 pr-4 py-2.5 text-[13px] font-[DM_Sans] text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F] bg-[#F5F5F7]"
              />
            </div>
            <p className="text-[11px] text-[#AEAEB2] mt-1.5">
              Earnings below this amount roll over to next month
            </p>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div className="p-6 border-t border-[rgba(0,0,0,0.08)]">
          <button
            onClick={saveSettings}
            disabled={loading}
            className="w-full bg-[#1D1D1F] text-white rounded-full py-3 font-[DM_Sans] font-bold text-[14px] hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Saving...
              </>
            ) : 'Save Payout Settings'}
          </button>
        </div>
      </div>
    </>
  );
}
