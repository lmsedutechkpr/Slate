'use client';

import Image from 'next/image';
import { format } from 'date-fns';
import {
  Ban,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  Phone,
  User,
  X,
  XCircle,
} from 'lucide-react';
import TrafficLights from '@/components/auth/TrafficLights';
import { Dialog, DialogClose, DialogOverlay, DialogPortal } from '@/components/ui/dialog';
import type { InstructorData, SellerData, UserProfile } from './UserRow';

interface UserDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
  loading?: boolean;
  instructorData?: InstructorData | null;
  sellerData?: SellerData | null;
  enrollmentCount?: number;
  onViewDetail: () => void;
  onApprove: () => void;
  onReject: () => void;
  onSuspend: () => void;
  onUnsuspend: () => void;
}

function getRoleBadgeStyles(role: string) {
  switch (role) {
    case 'instructor':
      return 'bg-[#EFF6FF] text-[#3B82F6] border-[#3B82F6]/20';
    case 'seller':
      return 'bg-[#EDFAF0] text-[#28C840] border-[#28C840]/20';
    case 'admin':
      return 'bg-[#FF5F57]/10 text-[#FF5F57] border-[#FF5F57]/20';
    default:
      return 'bg-[#F5F5F7] text-[#6E6E73] border-[rgba(0,0,0,0.08)]';
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return {
        bg: 'bg-[#EDFAF0] text-[#28C840] border-[#28C840]/20',
        icon: CheckCircle2,
        label: 'Active',
      };
    case 'pending':
    case 'pending_approval':
      return {
        bg: 'bg-[#FFF8EC] text-[#FEBC2E] border-[#FEBC2E]/20',
        icon: Clock,
        label: 'Pending',
      };
    case 'suspended':
      return {
        bg: 'bg-[#FFF0EF] text-[#FF5F57] border-[#FF5F57]/20',
        icon: Ban,
        label: 'Suspended',
      };
    case 'rejected':
      return {
        bg: 'bg-[#F5F5F7] text-[#AEAEB2] border-[rgba(0,0,0,0.08)]',
        icon: XCircle,
        label: 'Rejected',
      };
    default:
      return {
        bg: 'bg-[#F5F5F7] text-[#6E6E73] border-[rgba(0,0,0,0.08)]',
        icon: Clock,
        label: status,
      };
  }
}

export default function UserDetailDrawer({
  open,
  onOpenChange,
  user,
  loading = false,
  instructorData,
  sellerData,
  enrollmentCount = 0,
  onViewDetail,
  onApprove,
  onReject,
  onSuspend,
  onUnsuspend,
}: UserDetailDrawerProps) {
  if (!user) return null;

  const statusBadge = getStatusBadge(user.status);
  const StatusIcon = statusBadge.icon;
  const isAdmin = user.role === 'admin';

  const initials = (user.full_name || 'User')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/15" />
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-hidden border-l border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
          <div className="flex h-[44px] items-center justify-between border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
            <div className="flex items-center gap-3">
              <TrafficLights size="xs" />
              <span className="font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
                Quick User Detail
              </span>
            </div>
            <DialogClose asChild>
              <button className="rounded-lg p-1 text-[#AEAEB2] transition-colors hover:bg-white hover:text-[#1D1D1F]">
                <X className="h-4 w-4" />
              </button>
            </DialogClose>
          </div>

          <div className="h-[calc(100vh-44px)] overflow-y-auto p-5">
            <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-[#F5F5F7] p-4">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-full bg-white">
                  {user.avatar_url ? (
                    <Image src={user.avatar_url} alt={user.full_name} fill className="object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center font-[DM_Sans] text-[14px] font-bold text-[#1D1D1F]">
                      {initials}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-[DM_Sans] text-[15px] font-bold text-[#1D1D1F]">{user.full_name}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-[#AEAEB2]">{user.id.slice(0, 12)}...</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`inline-flex rounded-full border px-2.5 py-1 font-[DM_Sans] text-[10px] font-semibold uppercase ${getRoleBadgeStyles(user.role)}`}>
                  {user.role}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-[DM_Sans] text-[10px] font-semibold ${statusBadge.bg}`}>
                  <StatusIcon className="h-[10px] w-[10px]" />
                  {statusBadge.label}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-[13px] text-[#6E6E73]">
              <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-[#AEAEB2]" />{loading ? 'Loading email...' : user.email || 'No email'}</p>
              <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-[#AEAEB2]" />{loading ? 'Loading phone...' : user.phone || 'No phone'}</p>
              <p className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-[#AEAEB2]" />Joined {format(new Date(user.created_at), 'dd MMM yyyy')}</p>
              <p className="text-[12px] text-[#6E6E73]">
                {loading
                  ? 'Loading profile details...'
                  : user.bio || 'No bio available'}
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-4">
              <p className="font-[DM_Sans] text-[12px] uppercase tracking-wide text-[#AEAEB2]">Activity</p>
              <p className="mt-2 font-[DM_Sans] text-[13px] text-[#1D1D1F]">
                {user.role === 'instructor' && instructorData
                  ? `${instructorData.total_courses} courses · ${instructorData.total_students} students`
                  : user.role === 'seller' && sellerData
                    ? `${sellerData.total_sales} sales · ₹${sellerData.total_revenue.toLocaleString('en-IN')}`
                    : user.role === 'student'
                      ? `${enrollmentCount} enrolled courses`
                      : 'Administrative account'}
              </p>
            </div>

            <div className="mt-5 space-y-2">
              {(user.status === 'pending' || user.status === 'pending_approval') && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={onApprove}
                    className="flex items-center justify-center gap-2 rounded-full bg-[#28C840] py-2.5 font-[DM_Sans] text-[12px] font-semibold text-white"
                  >
                    <Check className="h-4 w-4" />Approve
                  </button>
                  <button
                    onClick={onReject}
                    className="flex items-center justify-center gap-2 rounded-full border border-[#FF5F57]/30 py-2.5 font-[DM_Sans] text-[12px] font-semibold text-[#FF5F57]"
                  >
                    <XCircle className="h-4 w-4" />Reject
                  </button>
                </div>
              )}

              {user.status === 'active' && !isAdmin && (
                <button
                  onClick={onSuspend}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-[#FF5F57]/30 py-2.5 font-[DM_Sans] text-[12px] font-semibold text-[#FF5F57]"
                >
                  <Ban className="h-4 w-4" />Suspend Account
                </button>
              )}

              {user.status === 'suspended' && !isAdmin && (
                <button
                  onClick={onUnsuspend}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#28C840] py-2.5 font-[DM_Sans] text-[12px] font-semibold text-white"
                >
                  <CheckCircle2 className="h-4 w-4" />Restore Access
                </button>
              )}

              <button
                onClick={onViewDetail}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-[rgba(0,0,0,0.1)] py-2.5 font-[DM_Sans] text-[12px] font-medium text-[#1D1D1F]"
              >
                <ExternalLink className="h-4 w-4" />Open Full Profile
              </button>
            </div>
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  );
}
