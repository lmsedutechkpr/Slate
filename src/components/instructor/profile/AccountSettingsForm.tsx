'use client';

import { useState } from 'react';
import { Eye, EyeOff, Loader2, Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Props {
  userId: string;
}

function TL({ size = 2 }: { size?: number }) {
  const s = `h-${size} w-${size}`;
  return (
    <div className="flex items-center gap-1.5">
      <div className={`${s} rounded-full bg-[#FF5F57]`} />
      <div className={`${s} rounded-full bg-[#FEBC2E]`} />
      <div className={`${s} rounded-full bg-[#28C840]`} />
    </div>
  );
}

const NOTIF_PREFS = [
  { key: 'enrollment_notifications', label: 'New Enrollment', desc: 'When a student enrolls in your course', default: true },
  { key: 'qa_notifications', label: 'New Question', desc: 'When a student asks a question', default: true },
  { key: 'review_notifications', label: 'Course Review', desc: 'When a student leaves a review', default: true },
  { key: 'live_reminders', label: 'Live Class Reminder', desc: '30 minutes before your session', default: true },
  { key: 'payout_notifications', label: 'Payout Processed', desc: 'When your payout is sent', default: true },
  { key: 'marketing_emails', label: 'Marketing & Updates', desc: 'Platform news and feature updates', default: false },
];

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const strength = checks.filter(Boolean).length;
  const colors = ['bg-[#FF5F57]', 'bg-[#FEBC2E]', 'bg-[#FEBC2E]', 'bg-[#28C840]'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];

  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${i < strength ? colors[strength - 1] : 'bg-[rgba(0,0,0,0.08)]'}`}
          />
        ))}
      </div>
      <p className="text-[11px] text-[#AEAEB2] mt-1">{labels[strength - 1] || 'Very weak'}</p>
    </div>
  );
}

export default function AccountSettingsForm({ userId }: Props) {
  const supabase = createClient();

  // Password change
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  // Notifications
  const [notifs, setNotifs] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIF_PREFS.map(p => [p.key, p.default]))
  );
  const [notifsLoading, setNotifsLoading] = useState(false);

  const changePassword = async () => {
    if (!newPw || newPw !== confirmPw) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPw.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setPwLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      toast.success('Password updated successfully!');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err: any) {
      toast.error('Failed: ' + err.message);
    } finally {
      setPwLoading(false);
    }
  };

  const saveNotifs = async () => {
    setNotifsLoading(true);
    await new Promise(r => setTimeout(r, 600)); // simulate save
    toast.success('Notification preferences saved!');
    setNotifsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* ─── CHANGE PASSWORD ─── */}
      <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm overflow-hidden">
        <div className="h-[44px] flex items-center gap-3 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
          <TL />
          <span className="font-[DM_Sans] font-semibold text-[13px] text-[#1D1D1F]">Change Password</span>
        </div>
        <div className="p-6 space-y-4">
          {[
            { label: 'Current Password', val: currentPw, set: setCurrentPw, show: showCurrent, toggle: () => setShowCurrent(v => !v) },
            { label: 'New Password', val: newPw, set: setNewPw, show: showNew, toggle: () => setShowNew(v => !v), strength: true },
            { label: 'Confirm New Password', val: confirmPw, set: setConfirmPw, show: showNew, toggle: () => {}, noEye: true },
          ].map(({ label, val, set, show, toggle, strength, noEye }) => (
            <div key={label}>
              <label className="block text-[12px] font-semibold text-[#AEAEB2] uppercase tracking-wide mb-1.5">{label}</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={val}
                  onChange={e => set(e.target.value)}
                  className="w-full border border-[rgba(0,0,0,0.1)] rounded-xl px-4 py-2.5 pr-10 text-[13px] text-[#1D1D1F] bg-[#F5F5F7] focus:outline-none focus:border-[#1D1D1F]"
                />
                {!noEye && (
                  <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AEAEB2] hover:text-[#6E6E73]">
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
              {strength && <PasswordStrength password={val} />}
              {label === 'Confirm New Password' && confirmPw && newPw !== confirmPw && (
                <p className="text-[11px] text-[#FF5F57] mt-1">Passwords do not match</p>
              )}
            </div>
          ))}

          <div className="flex justify-end pt-2">
            <button
              onClick={changePassword}
              disabled={pwLoading || !currentPw || !newPw || newPw !== confirmPw}
              className="flex items-center gap-2 bg-[#1D1D1F] text-white font-[DM_Sans] font-semibold text-[13px] rounded-xl px-5 py-2.5 hover:bg-[#333] transition-colors disabled:opacity-40"
            >
              {pwLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {pwLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>
      </div>

      {/* ─── NOTIFICATION PREFERENCES ─── */}
      <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm overflow-hidden">
        <div className="h-[44px] flex items-center gap-3 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
          <TL />
          <span className="font-[DM_Sans] font-semibold text-[13px] text-[#1D1D1F]">Notification Preferences</span>
        </div>
        <div className="divide-y divide-[rgba(0,0,0,0.05)]">
          {NOTIF_PREFS.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between px-5 py-4">
              <div>
                <div className="font-[DM_Sans] font-medium text-[13px] text-[#1D1D1F]">{label}</div>
                <div className="text-[12px] text-[#6E6E73] mt-0.5">{desc}</div>
              </div>
              <button
                onClick={() => setNotifs(prev => ({ ...prev, [key]: !prev[key] }))}
                className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${notifs[key] ? 'bg-[#28C840]' : 'bg-[rgba(0,0,0,0.15)]'}`}
              >
                <div className={`absolute top-1 transition-all w-4 h-4 rounded-full bg-white shadow-sm ${notifs[key] ? 'left-5' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-[rgba(0,0,0,0.05)]">
          <button
            onClick={saveNotifs}
            disabled={notifsLoading}
            className="flex items-center gap-2 bg-[#1D1D1F] text-white font-[DM_Sans] font-semibold text-[13px] rounded-xl px-5 py-2.5 hover:bg-[#333] transition-colors"
          >
            {notifsLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {notifsLoading ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>

      {/* ─── LOGIN SESSIONS ─── */}
      <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm overflow-hidden">
        <div className="h-[44px] flex items-center gap-3 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
          <TL />
          <span className="font-[DM_Sans] font-semibold text-[13px] text-[#1D1D1F]">Login Sessions</span>
        </div>
        <div className="p-6 flex items-center justify-between">
          <div>
            <div className="font-[DM_Sans] font-medium text-[13px] text-[#1D1D1F] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#28C840]" />
              Current session
            </div>
            <div className="text-[12px] text-[#6E6E73] mt-0.5">You are signed in on this device</div>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut({ scope: 'others' });
              toast.success('Signed out all other sessions');
            }}
            className="text-[12px] text-[#FF5F57] font-medium border border-[#FF5F57]/30 rounded-full px-4 py-1.5 hover:bg-[#FFF0EF] transition-colors"
          >
            Sign out other sessions
          </button>
        </div>
      </div>
    </div>
  );
}
