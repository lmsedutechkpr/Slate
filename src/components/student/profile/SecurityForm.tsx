'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Loader2, Monitor, LogOut } from 'lucide-react';

function TrafficLights() {
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <div className="w-2 h-2 rounded-full bg-[#FF5F57]" />
      <div className="w-2 h-2 rounded-full bg-[#FEBC2E]" />
      <div className="w-2 h-2 rounded-full bg-[#28C840]" />
    </div>
  );
}

export default function SecurityForm({ userId }: { userId: string }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

  const getStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-gray-100' };
    if (pass.length < 6) return { score: 1, label: 'Weak', color: 'bg-[#FF5F57]' };
    if (pass.length < 8 || !/[A-Z]/.test(pass) || !/[0-9]/.test(pass)) return { score: 2, label: 'Fair', color: 'bg-[#FEBC2E]' };
    return { score: 3, label: 'Strong', color: 'bg-[#28C840]' };
  };

  const strength = getStrength(passwords.new);
  const mismatch = passwords.confirm && passwords.new !== passwords.confirm;

  const updatePassword = async () => {
    if (!passwords.current) {
      toast.error('Please enter your current password');
      return;
    }
    if (mismatch) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwords.new.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      // 1. Verify current password by attempting to sign in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('User not found');

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwords.current,
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // 2. If successful, update to the new password
      const { error: updateError } = await supabase.auth.updateUser({ 
        password: passwords.new 
      });
      
      if (updateError) throw updateError;
      
      toast.success('Password updated successfully!');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const signOutOthers = async () => {
    try {
      // Supabase supports signing out of other sessions via the 'others' scope
      const { error } = await supabase.auth.signOut({ scope: 'others' });
      if (error) throw error;
      toast.success('All other sessions signed out successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to sign out other sessions');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Titlebar */}
      <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex items-center">
        <TrafficLights />
        <span className="flex-1 text-center font-semibold text-[13px] text-gray-900 pr-5">Security</span>
      </div>

      <div className="p-6">
        
        {/* Change Password */}
        <section>
          <h3 className="font-semibold text-[14px] text-gray-900 mb-4">Change Password</h3>
          <div className="space-y-4 max-w-sm">
            
            <div>
              <input
                type="password"
                placeholder="Enter current password"
                value={passwords.current}
                onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-gray-900 focus:outline-none focus:border-gray-900"
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="New password (min 8 characters)"
                value={passwords.new}
                onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-gray-900 focus:outline-none focus:border-gray-900"
              />
              {/* Strength Meter */}
              {passwords.new && (
                <div className="mt-2">
                  <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden flex">
                    <div className={`h-full transition-all duration-300 ${strength.color}`} style={{ width: `${(strength.score / 3) * 100}%` }} />
                  </div>
                  <p className={`text-[11px] font-medium mt-1 ${strength.color.replace('bg-', 'text-')}`}>
                    {strength.label}
                  </p>
                </div>
              )}
            </div>

            <div>
              <input
                type="password"
                placeholder="Confirm new password"
                value={passwords.confirm}
                onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                className={`w-full bg-white border rounded-xl px-4 py-2.5 text-[13px] text-gray-900 focus:outline-none transition-shadow ${
                  mismatch ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900'
                }`}
              />
              {mismatch && <p className="text-[11px] text-[#FF5F57] mt-1">Passwords do not match</p>}
            </div>

            <button
              onClick={updatePassword}
              disabled={!passwords.current || !passwords.new || mismatch || loading}
              className="mt-2 flex items-center justify-center gap-2 bg-gray-900 text-white font-semibold text-[13px] rounded-xl w-full py-2.5 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Update Password
            </button>
          </div>
        </section>

        <div className="my-8 h-px bg-gray-100" />

        {/* Login Sessions */}
        <section>
          <h3 className="font-semibold text-[14px] text-gray-900 mb-4">Login Sessions</h3>
          
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center justify-between">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                <Monitor className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-[13px] text-gray-900">Current Session</p>
                <p className="text-[12px] text-gray-500 mt-0.5">Active now · Windows / Chrome</p>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 text-[#28C840] font-semibold text-[11px] rounded-full px-3 py-1 uppercase tracking-wider">
              Active
            </div>
          </div>

          <button
            onClick={signOutOthers}
            className="mt-4 flex items-center gap-2 border border-gray-200 text-gray-600 font-medium text-[13px] rounded-full px-5 py-2.5 hover:bg-gray-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out all other sessions
          </button>
        </section>

      </div>
    </div>
  );
}
