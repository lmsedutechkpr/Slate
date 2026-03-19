'use client';

import Image from 'next/image';
import { format } from 'date-fns';
import {
  Eye,
  Check,
  X,
  Ban,
  CheckCircle2,
  XCircle,
  Clock,
  MoreHorizontal,
  UserCog,
  Bell,
  Trash2,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface UserProfile {
  id: string;
  full_name: string;
  display_name?: string | null;
  email?: string | null;
  role: string;
  status: string;
  avatar_url?: string | null;
  preferred_language?: string | null;
  registration_source?: string | null;
  created_at: string;
  updated_at?: string | null;
  bio?: string | null;
  phone?: string | null;
}

export interface InstructorData {
  user_id: string;
  headline?: string | null;
  total_students: number;
  total_courses: number;
  avg_rating: number;
  total_earnings: number;
  commission_rate: number;
}

export interface SellerData {
  user_id: string;
  store_name?: string | null;
  store_slug?: string | null;
  total_sales: number;
  total_revenue: number;
  avg_rating: number;
  commission_rate: number;
}

interface UserRowProps {
  user: UserProfile;
  instructorData?: InstructorData | null;
  sellerData?: SellerData | null;
  enrollmentCount?: number;
  onViewDetail: () => void;
  onApprove: () => void;
  onReject: () => void;
  onSuspend: () => void;
  onUnsuspend: () => void;
  onSendNotification?: () => void;
  onChangeRole?: () => void;
  onDelete?: () => void;
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

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function UserRow({
  user,
  instructorData,
  sellerData,
  enrollmentCount = 0,
  onViewDetail,
  onApprove,
  onReject,
  onSuspend,
  onUnsuspend,
  onSendNotification,
  onChangeRole,
  onDelete,
}: UserRowProps) {
  const statusBadge = getStatusBadge(user.status);
  const StatusIcon = statusBadge.icon;
  const isAdmin = user.role === 'admin';

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getLanguageLabel = (lang?: string | null) => {
    if (lang === 'ta') return 'தமிழ்';
    return 'EN';
  };

  return (
    <div
      className="grid cursor-pointer grid-cols-[minmax(180px,2fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(120px,1fr)] items-center gap-4 px-5 py-4 transition-colors hover:bg-[#F5F5F7]"
      onClick={onViewDetail}
    >
      {/* Avatar + Name */}
      <div className="flex items-center gap-3">
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[#F5F5F7]">
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt={user.full_name}
              fill
              className="object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-[DM_Sans] text-[12px] font-semibold text-[#1D1D1F]">
              {getInitials(user.full_name || 'U')}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
            {user.full_name || 'Unnamed User'}
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-[#AEAEB2]">
            {user.id.slice(0, 8)}...
          </p>
        </div>
      </div>

      {/* Role */}
      <div>
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 font-[DM_Sans] text-[10px] font-semibold uppercase ${getRoleBadgeStyles(user.role)}`}
        >
          {user.role}
        </span>
        <p className="mt-0.5 text-[10px] text-[#AEAEB2]">
          {user.role === 'instructor' && instructorData && (
            <>
              {instructorData.total_courses} courses · {instructorData.total_students} students
            </>
          )}
          {user.role === 'seller' && sellerData && sellerData.store_name}
          {user.role === 'student' && `${enrollmentCount} enrolled`}
        </p>
      </div>

      {/* Status */}
      <div>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-[DM_Sans] text-[10px] font-semibold ${statusBadge.bg}`}
        >
          <StatusIcon className="h-[10px] w-[10px]" />
          {statusBadge.label}
        </span>
      </div>

      {/* Joined */}
      <div>
        <p className="font-[DM_Sans] text-[13px] text-[#6E6E73]">
          {format(new Date(user.created_at), 'dd MMM yyyy')}
        </p>
        <span className="mt-1 inline-block w-fit rounded-full bg-[#F5F5F7] px-2 py-0.5 text-[10px] text-[#AEAEB2]">
          {getLanguageLabel(user.preferred_language)}
        </span>
      </div>

      {/* Activity */}
      <div>
        {user.role === 'instructor' && instructorData && (
          <>
            <p className="font-[DM_Sans] text-[12px] font-semibold text-[#1D1D1F]">
              {formatCurrency(instructorData.total_earnings)}
            </p>
            <p className="text-[11px] text-[#AEAEB2]">
              {instructorData.avg_rating.toFixed(1)}★ rating
            </p>
          </>
        )}
        {user.role === 'seller' && sellerData && (
          <>
            <p className="font-[DM_Sans] text-[12px] font-semibold text-[#1D1D1F]">
              {formatCurrency(sellerData.total_revenue)}
            </p>
            <p className="text-[11px] text-[#AEAEB2]">{sellerData.total_sales} sales</p>
          </>
        )}
        {user.role === 'student' && (
          <p className="font-[DM_Sans] text-[12px] text-[#6E6E73]">
            {enrollmentCount} courses
          </p>
        )}
        {user.role === 'admin' && (
          <p className="font-[DM_Sans] text-[12px] text-[#6E6E73]">Admin</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        {/* View */}
        <button
          onClick={onViewDetail}
          className="rounded-lg bg-[#F5F5F7] p-1.5 text-[#AEAEB2] transition-colors hover:text-[#1D1D1F]"
          title="View details"
        >
          <Eye className="h-[15px] w-[15px]" />
        </button>

        {/* Pending actions */}
        {(user.status === 'pending' || user.status === 'pending_approval') && (
          <>
            <button
              onClick={onApprove}
              className="rounded-lg bg-[#EDFAF0] p-1.5 text-[#28C840] transition-colors hover:bg-[#28C840]/20"
              title="Approve"
            >
              <Check className="h-[15px] w-[15px]" />
            </button>
            <button
              onClick={onReject}
              className="rounded-lg bg-[#FFF0EF] p-1.5 text-[#FF5F57] transition-colors hover:bg-[#FF5F57]/20"
              title="Reject"
            >
              <X className="h-[15px] w-[15px]" />
            </button>
          </>
        )}

        {/* Active user actions */}
        {user.status === 'active' && !isAdmin && (
          <button
            onClick={onSuspend}
            className="rounded-lg bg-[#FFF0EF] p-1.5 text-[#FF5F57] transition-colors hover:bg-[#FF5F57]/20"
            title="Suspend"
          >
            <Ban className="h-[15px] w-[15px]" />
          </button>
        )}

        {/* Suspended user actions */}
        {user.status === 'suspended' && !isAdmin && (
          <button
            onClick={onUnsuspend}
            className="rounded-lg bg-[#EDFAF0] p-1.5 text-[#28C840] transition-colors hover:bg-[#28C840]/20"
            title="Restore access"
          >
            <CheckCircle2 className="h-[15px] w-[15px]" />
          </button>
        )}

        {/* More options */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="rounded-lg bg-[#F5F5F7] p-1.5 text-[#AEAEB2] transition-colors hover:text-[#1D1D1F]"
              title="More options"
            >
              <MoreHorizontal className="h-[15px] w-[15px]" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-[180px] overflow-hidden rounded-xl border border-[rgba(0,0,0,0.08)] bg-white p-1 shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
          >
            <button
              onClick={onViewDetail}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] text-[#1D1D1F] transition-colors hover:bg-[#F5F5F7]"
            >
              <Eye className="h-4 w-4 text-[#6E6E73]" />
              View Profile
            </button>
            {onSendNotification && (
              <button
                onClick={onSendNotification}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] text-[#1D1D1F] transition-colors hover:bg-[#F5F5F7]"
              >
                <Bell className="h-4 w-4 text-[#6E6E73]" />
                Send Notification
              </button>
            )}
            {onChangeRole && !isAdmin && (
              <button
                onClick={onChangeRole}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] text-[#1D1D1F] transition-colors hover:bg-[#F5F5F7]"
              >
                <UserCog className="h-4 w-4 text-[#6E6E73]" />
                Change Role
              </button>
            )}
            {onDelete && !isAdmin && (
              <>
                <div className="mx-2 my-1 h-px bg-[rgba(0,0,0,0.05)]" />
                <button
                  onClick={onDelete}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] text-[#FF5F57] transition-colors hover:bg-[#FFF0EF]"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </button>
              </>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
