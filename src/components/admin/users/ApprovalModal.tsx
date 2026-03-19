'use client';

import { useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogClose,
} from '@/components/ui/dialog';
import TrafficLights from '@/components/auth/TrafficLights';
import { approveUserWithDetailsAction, rejectUserAction } from '@/app/actions/admin';
import { toast } from 'sonner';
import type { UserProfile, InstructorData, SellerData } from './UserRow';

interface ApprovalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile;
  mode: 'approve' | 'reject';
  instructorData?: InstructorData | null;
  sellerData?: SellerData | null;
  onSuccess: () => void;
  onUserStatusChange?: (userId: string, status: string) => void;
}

const REJECTION_REASONS = [
  'Incomplete application',
  'Does not meet requirements',
  'Duplicate account',
  'Inappropriate content',
  'Not accepting at this time',
];

function getRoleBadgeStyles(role: string) {
  switch (role) {
    case 'instructor':
      return 'bg-[#EFF6FF] text-[#3B82F6]';
    case 'seller':
      return 'bg-[#EDFAF0] text-[#28C840]';
    default:
      return 'bg-[#F5F5F7] text-[#6E6E73]';
  }
}

export default function ApprovalModal({
  open,
  onOpenChange,
  user,
  mode,
  instructorData,
  sellerData,
  onSuccess,
  onUserStatusChange,
}: ApprovalModalProps) {
  const [loading, setLoading] = useState(false);
  const [commissionRate, setCommissionRate] = useState(
    user.role === 'instructor' ? 70 : user.role === 'seller' ? 85 : 70
  );
  const [welcomeMessage, setWelcomeMessage] = useState(
    user.role === 'instructor'
      ? 'Welcome to Slate! Your instructor account is now active. Start creating your first course.'
      : user.role === 'seller'
        ? 'Welcome to Slate! Your seller account is now active. List your first product.'
        : 'Welcome to Slate! Your account is now active.'
  );
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      onUserStatusChange?.(user.id, 'active');
      const result = await approveUserWithDetailsAction({
        userId: user.id,
        role: user.role,
        commissionRate: user.role === 'instructor' || user.role === 'seller' ? commissionRate : undefined,
        welcomeMessage,
      });

      if (!result.success) {
        onUserStatusChange?.(user.id, user.status);
        throw new Error(result.error || 'Failed to approve user');
      }

      toast.success(`${user.full_name} approved!`, {
        style: { color: '#28C840' },
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error approving user:', error);
      const message = error instanceof Error ? error.message : 'Failed to approve user';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = selectedReason || customReason;
    if (!reason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    try {
      onUserStatusChange?.(user.id, 'rejected');
      const result = await rejectUserAction({ userId: user.id, reason });
      if (!result.success) {
        onUserStatusChange?.(user.id, user.status);
        throw new Error(result.error || 'Failed to reject user');
      }

      toast.success(`${user.full_name} rejected`, {
        style: { color: '#FF5F57' },
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error rejecting user:', error);
      const message = error instanceof Error ? error.message : 'Failed to reject user';
      toast.error(message);
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
            {mode === 'approve' ? (
              <CheckCircle2 className="h-6 w-6 text-[#28C840]" />
            ) : (
              <XCircle className="h-6 w-6 text-[#FF5F57]" />
            )}
            <h2 className="font-[DM_Sans] text-[18px] font-bold text-[#1D1D1F]">
              {mode === 'approve'
                ? `Approve ${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Application`
                : 'Reject Application'}
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
                <p className="mt-1 text-[12px] text-[#AEAEB2]">
                  Joined {format(new Date(user.created_at), 'dd MMM yyyy')}
                </p>
              </div>
            </div>

            {/* Role-specific info */}
            {user.role === 'instructor' && instructorData?.headline && (
              <p className="mt-3 text-[13px] text-[#6E6E73]">{instructorData.headline}</p>
            )}
            {user.role === 'seller' && sellerData?.store_name && (
              <p className="mt-3 text-[13px] text-[#6E6E73]">
                Store: {sellerData.store_name}
              </p>
            )}
          </div>

          {/* Approve mode content */}
          {mode === 'approve' && (user.role === 'instructor' || user.role === 'seller') && (
            <>
              {/* Commission Rate */}
              <div className="mt-5">
                <label className="mb-2 block font-[DM_Sans] text-[12px] uppercase tracking-wide text-[#AEAEB2]">
                  Commission Rate:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={commissionRate}
                    onChange={(e) =>
                      setCommissionRate(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))
                    }
                    className="w-24 rounded-xl bg-[#F5F5F7] px-4 py-2.5 text-center font-[DM_Sans] text-[16px] font-bold text-[#1D1D1F] outline-none focus:ring-2 focus:ring-[#1D1D1F]/20"
                  />
                  <span className="font-[DM_Sans] text-[16px] font-bold text-[#1D1D1F]">%</span>
                  <span className="text-[11px] text-[#AEAEB2]">
                    They keep this % of revenue
                  </span>
                </div>
              </div>

              {/* Welcome Message */}
              <div className="mt-5">
                <label className="mb-2 block font-[DM_Sans] text-[12px] uppercase tracking-wide text-[#AEAEB2]">
                  Welcome Message:
                </label>
                <textarea
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder={`Welcome message to the new ${user.role}...`}
                  rows={3}
                  className="w-full resize-none rounded-xl bg-[#F5F5F7] px-4 py-3 font-[DM_Sans] text-[13px] text-[#1D1D1F] outline-none placeholder:text-[#AEAEB2] focus:ring-2 focus:ring-[#1D1D1F]/20"
                />
              </div>
            </>
          )}

          {/* Reject mode content */}
          {mode === 'reject' && (
            <div className="mt-5">
              <label className="mb-2 block font-[DM_Sans] text-[12px] uppercase tracking-wide text-[#AEAEB2]">
                Reason (sent to applicant):
              </label>

              {/* Reason pills */}
              <div className="mb-3 flex flex-wrap gap-2">
                {REJECTION_REASONS.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => {
                      setSelectedReason(selectedReason === reason ? '' : reason);
                      if (selectedReason !== reason) setCustomReason('');
                    }}
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

              {/* Custom message */}
              <textarea
                value={customReason}
                onChange={(e) => {
                  setCustomReason(e.target.value);
                  if (e.target.value) setSelectedReason('');
                }}
                placeholder="Additional details..."
                rows={3}
                className="w-full resize-none rounded-xl bg-[#F5F5F7] px-4 py-3 font-[DM_Sans] text-[13px] text-[#1D1D1F] outline-none placeholder:text-[#AEAEB2] focus:ring-2 focus:ring-[#1D1D1F]/20"
              />
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
            onClick={mode === 'approve' ? handleApprove : handleReject}
            disabled={loading}
            className={`rounded-full px-5 py-2 font-[DM_Sans] text-[13px] font-semibold text-white transition-colors disabled:opacity-50 ${
              mode === 'approve'
                ? 'bg-[#28C840] hover:bg-[#28C840]/90'
                : 'bg-[#FF5F57] hover:bg-[#FF5F57]/90'
            }`}
          >
            {loading
              ? 'Processing...'
              : mode === 'approve'
                ? 'Approve & Send Welcome Email'
                : 'Reject & Notify Applicant'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
