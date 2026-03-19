'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Ban, CheckCircle2, X, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogClose,
} from '@/components/ui/dialog';
import TrafficLights from '@/components/auth/TrafficLights';
import { suspendUserAction, unsuspendUserAction } from '@/app/actions/admin';
import { toast } from 'sonner';
import type { UserProfile } from './UserRow';

interface SuspendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile;
  mode: 'suspend' | 'unsuspend';
  onSuccess: () => void;
  onUserStatusChange?: (userId: string, status: string) => void;
}

const SUSPENSION_REASONS = [
  'Policy violation',
  'Fraudulent activity',
  'Spam or abuse',
  'Payment dispute',
  'User request',
  'Other',
];

const DURATION_OPTIONS = [
  { label: '24 hours', value: 24 * 60 * 60 * 1000 },
  { label: '7 days', value: 7 * 24 * 60 * 60 * 1000 },
  { label: '30 days', value: 30 * 24 * 60 * 60 * 1000 },
  { label: 'Permanent', value: null },
];

function getRoleBadgeStyles(role: string) {
  switch (role) {
    case 'instructor':
      return 'bg-[#EFF6FF] text-[#3B82F6]';
    case 'seller':
      return 'bg-[#EDFAF0] text-[#28C840]';
    case 'admin':
      return 'bg-[#FF5F57]/10 text-[#FF5F57]';
    default:
      return 'bg-[#F5F5F7] text-[#6E6E73]';
  }
}

export default function SuspendModal({
  open,
  onOpenChange,
  user,
  mode,
  onSuccess,
  onUserStatusChange,
}: SuspendModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [duration, setDuration] = useState<number | null>(null); // null = permanent

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSuspend = async () => {
    const reason = selectedReason === 'Other' ? customReason : selectedReason;
    if (!reason.trim()) {
      toast.error('Please provide a reason for suspension');
      return;
    }

    setLoading(true);
    try {
      onUserStatusChange?.(user.id, 'suspended');
      const result = await suspendUserAction({
        userId: user.id,
        reason,
        durationMs: duration,
      });

      if (!result.success) {
        onUserStatusChange?.(user.id, user.status);
        throw new Error(result.error || 'Failed to suspend user');
      }

      toast.success(`${user.full_name} suspended`, {
        style: { color: '#FF5F57' },
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error('Failed to suspend user');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsuspend = async () => {
    setLoading(true);
    try {
      onUserStatusChange?.(user.id, 'active');
      const result = await unsuspendUserAction({ userId: user.id });
      if (!result.success) {
        onUserStatusChange?.(user.id, user.status);
        throw new Error(result.error || 'Failed to restore account');
      }

      toast.success(`${user.full_name} access restored`, {
        style: { color: '#28C840' },
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error restoring user access:', error);
      toast.error('Failed to restore user access');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
        showCloseButton={false}
      >
        <div className="p-6">
          {/* Traffic lights */}
          <div className="mb-4 flex items-center justify-between">
            <TrafficLights size="xs" />
            <DialogClose asChild>
              <button className="rounded-lg p-1 text-[#AEAEB2] transition-colors hover:bg-[#F5F5F7] hover:text-[#1D1D1F]">
                <X className="h-5 w-5" />
              </button>
            </DialogClose>
          </div>

          {/* Header */}
          <div className="flex items-center gap-3">
            {mode === 'suspend' ? (
              <Ban className="h-6 w-6 text-[#FF5F57]" />
            ) : (
              <CheckCircle2 className="h-6 w-6 text-[#28C840]" />
            )}
            <h2 className="font-[DM_Sans] text-[18px] font-bold text-[#1D1D1F]">
              {mode === 'suspend' ? 'Suspend Account' : 'Restore Account Access'}
            </h2>
          </div>

          {/* User Summary */}
          <div className="mt-5 rounded-xl bg-[#F5F5F7] p-4">
            <div className="mb-3">
              <TrafficLights size="xs" />
            </div>
            <div className="flex items-center gap-3">
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-white bg-white">
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.full_name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center font-[DM_Sans] text-[14px] font-semibold text-[#1D1D1F]">
                    {getInitials(user.full_name || 'U')}
                  </span>
                )}
              </div>
              <div>
                <p className="font-[DM_Sans] text-[15px] font-bold text-[#1D1D1F]">
                  {user.full_name}
                </p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 font-[DM_Sans] text-[10px] font-semibold uppercase ${getRoleBadgeStyles(user.role)}`}
                >
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          {/* Suspend mode content */}
          {mode === 'suspend' && (
            <>
              {/* Suspension Reason */}
              <div className="mt-5">
                <label className="mb-2 block font-[DM_Sans] text-[12px] uppercase tracking-wide text-[#AEAEB2]">
                  Reason for suspension:
                </label>
                <div className="mb-3 flex flex-wrap gap-2">
                  {SUSPENSION_REASONS.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => setSelectedReason(selectedReason === reason ? '' : reason)}
                      className={`rounded-full px-3 py-1.5 font-[DM_Sans] text-[12px] font-medium transition-colors ${
                        selectedReason === reason
                          ? 'bg-[#FF5F57] text-white'
                          : 'bg-[#F5F5F7] text-[#6E6E73] hover:bg-[rgba(0,0,0,0.08)]'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>

                {selectedReason === 'Other' && (
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Describe the reason..."
                    rows={3}
                    className="w-full resize-none rounded-xl bg-[#F5F5F7] px-4 py-3 font-[DM_Sans] text-[13px] text-[#1D1D1F] outline-none placeholder:text-[#AEAEB2] focus:ring-2 focus:ring-[#1D1D1F]/20"
                  />
                )}
              </div>

              {/* Duration */}
              <div className="mt-5">
                <label className="mb-2 block font-[DM_Sans] text-[12px] uppercase tracking-wide text-[#AEAEB2]">
                  Suspension duration:
                </label>
                <div className="flex flex-wrap gap-2">
                  {DURATION_OPTIONS.map((option) => (
                    <button
                      key={option.label}
                      onClick={() => setDuration(option.value)}
                      className={`rounded-full px-3 py-1.5 font-[DM_Sans] text-[12px] font-medium transition-colors ${
                        duration === option.value
                          ? 'bg-[#1D1D1F] text-white'
                          : 'bg-[#F5F5F7] text-[#6E6E73] hover:bg-[rgba(0,0,0,0.08)]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Warning */}
              <div className="mt-4 flex items-start gap-3 rounded-xl bg-[#FFF0EF] p-4">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#FF5F57]" />
                <p className="font-[DM_Sans] text-[12px] leading-relaxed text-[#FF5F57]">
                  This will immediately log out the user and block all access.
                </p>
              </div>
            </>
          )}

          {/* Unsuspend mode content */}
          {mode === 'unsuspend' && (
            <div className="mt-5 flex items-start gap-3 rounded-xl bg-[#EDFAF0] p-4">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#28C840]" />
              <p className="font-[DM_Sans] text-[13px] leading-relaxed text-[#28C840]">
                Restoring access will allow {user.full_name} to log in and use the platform
                again.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-6 py-4">
          <DialogClose asChild>
            <button className="rounded-full px-4 py-2 font-[DM_Sans] text-[13px] font-medium text-[#6E6E73] transition-colors hover:bg-[rgba(0,0,0,0.05)]">
              Cancel
            </button>
          </DialogClose>
          <button
            onClick={mode === 'suspend' ? handleSuspend : handleUnsuspend}
            disabled={loading}
            className={`rounded-full px-5 py-2 font-[DM_Sans] text-[13px] font-semibold text-white transition-colors disabled:opacity-50 ${
              mode === 'suspend'
                ? 'bg-[#FF5F57] hover:bg-[#FF5F57]/90'
                : 'bg-[#28C840] hover:bg-[#28C840]/90'
            }`}
          >
            {loading
              ? 'Processing...'
              : mode === 'suspend'
                ? 'Suspend Account'
                : 'Restore Access'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
