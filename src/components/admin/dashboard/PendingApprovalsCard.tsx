'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Check, X, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import TrafficLights from '@/components/auth/TrafficLights';
import { approveUserAction, rejectUserAction } from '@/app/actions/admin';
import { toast } from 'sonner';

interface PendingApproval {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
  avatar_url: string | null;
  created_at: string;
}

interface PendingApprovalsCardProps {
  approvals: PendingApproval[];
  onUpdate: (id: string) => void;
}

export default function PendingApprovalsCard({ approvals, onUpdate }: PendingApprovalsCardProps) {
  const [processing, setProcessing] = useState<string | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = async (userId: string) => {
    setProcessing(userId);
    try {
      const result = await approveUserAction({ userId });
      if (result.success) {
        toast.success('User approved successfully! 🎉');
        onUpdate(userId);
      } else {
        toast.error(result.error || 'Failed to approve user');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setProcessing(userId);
    try {
      const result = await rejectUserAction({ userId, reason: rejectReason });
      if (result.success) {
        toast.success('User rejected');
        onUpdate(userId);
        setShowRejectDialog(null);
        setRejectReason('');
      } else {
        toast.error(result.error || 'Failed to reject user');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setProcessing(null);
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'instructor') {
      return 'bg-[#EFF6FF] text-[#3B82F6]';
    }
    if (role === 'seller') {
      return 'bg-[#F0FDF4] text-[#28C840]';
    }
    return 'bg-[#F5F5F7] text-[#6E6E73]';
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
      {/* Titlebar */}
      <div className="flex h-[44px] items-center justify-between border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
        <div className="flex items-center gap-3">
          <TrafficLights size="xs" />
          <span className="font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
            Pending Approvals
          </span>
        </div>
        <div className="flex items-center gap-3">
          {approvals.length > 0 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FF5F57] font-[DM_Sans] text-[11px] font-bold text-white">
              {approvals.length}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3 p-4">
        {approvals.length === 0 ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto h-7 w-7 text-[#28C840]" />
            <p className="mt-2 font-[DM_Sans] text-[15px] font-semibold text-[#1D1D1F]">
              All caught up!
            </p>
            <p className="mt-1 text-[13px] text-[#6E6E73]">No pending approvals</p>
          </div>
        ) : (
          approvals.map((approval) => (
            <div key={approval.id} className="relative">
              <div className="flex items-center gap-3 rounded-xl bg-[#F5F5F7] p-3">
                {/* Avatar */}
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white bg-white">
                  {approval.avatar_url ? (
                    <Image
                      src={approval.avatar_url}
                      alt={approval.full_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center font-[DM_Sans] text-[14px] font-semibold text-[#1D1D1F]">
                      {approval.full_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
                    {approval.full_name}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 font-[DM_Sans] text-[10px] font-semibold uppercase ${getRoleBadge(approval.role)}`}
                    >
                      {approval.role}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-[#AEAEB2]">
                    {formatDistanceToNow(new Date(approval.created_at), { addSuffix: true })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleApprove(approval.id)}
                    disabled={processing === approval.id}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#28C840] text-white transition-all hover:bg-[#28C840]/90 disabled:opacity-50"
                  >
                    <Check className="h-[13px] w-[13px]" />
                  </button>
                  <button
                    onClick={() => setShowRejectDialog(approval.id)}
                    disabled={processing === approval.id}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF5F57]/10 text-[#FF5F57] transition-all hover:bg-[#FF5F57]/20 disabled:opacity-50"
                  >
                    <X className="h-[13px] w-[13px]" />
                  </button>
                </div>
              </div>

              {/* Reject Dialog */}
              {showRejectDialog === approval.id && (
                <div className="absolute inset-0 z-10 rounded-xl bg-white p-3 shadow-lg">
                  <p className="font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
                    Reason for rejection:
                  </p>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Please provide a reason..."
                    className="mt-2 w-full rounded-lg border border-[rgba(0,0,0,0.08)] bg-[#F5F5F7] p-2 font-[DM_Sans] text-[12px] outline-none"
                    rows={2}
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleReject(approval.id)}
                      disabled={processing === approval.id}
                      className="flex-1 rounded-lg bg-[#FF5F57] py-1.5 font-[DM_Sans] text-[12px] font-semibold text-white transition-all hover:bg-[#FF5F57]/90 disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        setShowRejectDialog(null);
                        setRejectReason('');
                      }}
                      className="flex-1 rounded-lg bg-[#F5F5F7] py-1.5 font-[DM_Sans] text-[12px] font-semibold text-[#1D1D1F] transition-all hover:bg-[rgba(0,0,0,0.08)]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
