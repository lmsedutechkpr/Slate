'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  ShieldCheck,
  Bell,
  UserCog,
  Trash2,
  AlertTriangle,
  X,
} from 'lucide-react';
import {
  changeUserRoleAction,
  deleteUserAccountAction,
  sendUserNotificationAction,
} from '@/app/actions/admin';
import { toast } from 'sonner';
import TrafficLights from '@/components/auth/TrafficLights';
import {
  Dialog,
  DialogContent,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import ApprovalModal from './ApprovalModal';
import SuspendModal from './SuspendModal';
import type { UserProfile, InstructorData, SellerData } from './UserRow';

interface Course {
  id: string;
  title: string;
  thumbnail_url: string | null;
  status: string;
  total_enrolled: number;
}

interface Product {
  id: string;
  name: string;
  image_url: string | null;
  status: string;
  total_sold: number;
}

interface Enrollment {
  id: string;
  course: {
    id: string;
    title: string;
    thumbnail_url: string | null;
  };
  progress_percentage: number;
}

interface RecentNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface UserDetailClientProps {
  user: UserProfile;
  instructorData: InstructorData | null;
  sellerData: SellerData | null;
  enrollmentCount: number;
  courses?: Course[];
  products?: Product[];
  enrollments?: Enrollment[];
  certificatesCount?: number;
  ordersCount?: number;
  emailVerified?: boolean;
  authProvider?: string;
  lastSignInAt?: string | null;
  recentNotifications?: RecentNotification[];
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

export default function UserDetailClient({
  user,
  instructorData,
  sellerData,
  enrollmentCount,
  courses = [],
  products = [],
  enrollments = [],
  certificatesCount = 0,
  ordersCount = 0,
  emailVerified = false,
  authProvider = 'email',
  lastSignInAt = null,
  recentNotifications = [],
}: UserDetailClientProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(user.status);
  const [currentRole, setCurrentRole] = useState(user.role);
  const statusBadge = getStatusBadge(currentStatus);
  const StatusIcon = statusBadge.icon;
  const isAdmin = currentRole === 'admin';

  // Modal states
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [approvalMode, setApprovalMode] = useState<'approve' | 'reject'>('approve');
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendMode, setSuspendMode] = useState<'suspend' | 'unsuspend'>('suspend');
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [changeRoleModalOpen, setChangeRoleModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Notification state
  const [notifyType, setNotifyType] = useState<'info' | 'warning' | 'success'>('info');
  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyBody, setNotifyBody] = useState('');
  const [notifySending, setNotifySending] = useState(false);

  // Change role state
  const [newRole, setNewRole] = useState(user.role);
  const [changingRole, setChangingRole] = useState(false);

  // Delete state
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleting, setDeleting] = useState(false);

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

  // Send notification
  const sendNotification = async () => {
    if (!notifyTitle.trim() || !notifyBody.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setNotifySending(true);
    try {
      const result = await sendUserNotificationAction({
        userId: user.id,
        type: notifyType,
        title: notifyTitle,
        message: notifyBody,
      });

      if (!result.success) throw new Error(result.error || 'Failed to send notification');

      toast.success('Notification sent!');
      setNotifyModalOpen(false);
      setNotifyTitle('');
      setNotifyBody('');
    } catch (error) {
      console.error('Error sending notification:', error);
      const message = error instanceof Error ? error.message : 'Failed to send notification';
      toast.error(message);
    } finally {
      setNotifySending(false);
    }
  };

  // Change role
  const changeRole = async () => {
    if (newRole === user.role) {
      toast.error('Please select a different role');
      return;
    }

    setChangingRole(true);
    try {
      const result = await changeUserRoleAction({ userId: user.id, role: newRole });
      if (!result.success) throw new Error(result.error || 'Failed to change role');

      toast.success(`Role changed to ${newRole}`);
      setCurrentRole(newRole);
      setChangeRoleModalOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error changing role:', error);
      const message = error instanceof Error ? error.message : 'Failed to change role';
      toast.error(message);
    } finally {
      setChangingRole(false);
    }
  };

  // Delete account
  const deleteAccount = async () => {
    if (deleteConfirmName !== user.full_name) {
      toast.error('Please type the exact name to confirm');
      return;
    }

    setDeleting(true);
    try {
      const result = await deleteUserAccountAction({ userId: user.id });
      if (!result.success) throw new Error(result.error || 'Failed to delete account');

      toast.success('Account deleted');
      router.push('/admin/users');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  const handleActionSuccess = () => {
    router.refresh();
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 font-[DM_Sans] text-[13px] text-[#6E6E73] transition-colors hover:text-[#1D1D1F]"
        >
          <ArrowLeft className="h-4 w-4" />
          Users
        </Link>

        <div className="mt-3 flex items-center gap-3">
          <h1 className="font-[DM_Sans] text-[26px] font-bold text-[#1D1D1F]">
            {user.full_name}
          </h1>
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 font-[DM_Sans] text-[10px] font-semibold uppercase ${getRoleBadgeStyles(currentRole)}`}
          >
            {currentRole}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-[DM_Sans] text-[10px] font-semibold ${statusBadge.bg}`}
          >
            <StatusIcon className="h-[10px] w-[10px]" />
            {statusBadge.label}
          </span>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left Column */}
        <div className="flex-1 space-y-5">
          {/* Profile Info Card */}
          <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
            <div className="flex h-[44px] items-center gap-3 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
              <TrafficLights size="xs" />
              <span className="font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
                Profile Information
              </span>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-5">
                <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full border-2 border-[rgba(0,0,0,0.08)] bg-[#F5F5F7]">
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt={user.full_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center font-[DM_Sans] text-[24px] font-bold text-[#1D1D1F]">
                      {getInitials(user.full_name || 'U')}
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  <h2 className="font-[DM_Sans] text-[22px] font-bold text-[#1D1D1F]">
                    {user.full_name}
                  </h2>
                  {user.display_name && (
                    <p className="mt-0.5 font-[DM_Sans] text-[13px] text-[#6E6E73]">
                      @{user.display_name}
                    </p>
                  )}
                  {user.email && (
                    <p className="mt-1 flex items-center gap-1.5 font-[DM_Sans] text-[13px] text-[#6E6E73]">
                      {user.email}
                      <ShieldCheck className="h-3.5 w-3.5 text-[#28C840]" />
                    </p>
                  )}
                  {user.phone && (
                    <p className="mt-0.5 font-[DM_Sans] text-[13px] text-[#6E6E73]">
                      {user.phone}
                    </p>
                  )}
                  {user.bio && (
                    <p className="mt-3 line-clamp-3 font-[DM_Sans] text-[13px] leading-relaxed text-[#1D1D1F]">
                      {user.bio}
                    </p>
                  )}
                </div>
              </div>

              {/* Details Grid */}
              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-[#F5F5F7] p-3">
                  <p className="font-[DM_Sans] text-[10px] uppercase tracking-wide text-[#AEAEB2]">
                    User ID
                  </p>
                  <p className="mt-1 truncate font-mono text-[11px] text-[#1D1D1F]">
                    {user.id}
                  </p>
                </div>
                <div className="rounded-xl bg-[#F5F5F7] p-3">
                  <p className="font-[DM_Sans] text-[10px] uppercase tracking-wide text-[#AEAEB2]">
                    Joined
                  </p>
                  <p className="mt-1 font-[DM_Sans] text-[13px] font-medium text-[#1D1D1F]">
                    {format(new Date(user.created_at), 'dd MMM yyyy')}
                  </p>
                </div>
                <div className="rounded-xl bg-[#F5F5F7] p-3">
                  <p className="font-[DM_Sans] text-[10px] uppercase tracking-wide text-[#AEAEB2]">
                    Language
                  </p>
                  <p className="mt-1 font-[DM_Sans] text-[13px] font-medium text-[#1D1D1F]">
                    {getLanguageLabel(user.preferred_language)}
                  </p>
                </div>
                <div className="rounded-xl bg-[#F5F5F7] p-3">
                  <p className="font-[DM_Sans] text-[10px] uppercase tracking-wide text-[#AEAEB2]">
                    Source
                  </p>
                  <p className="mt-1 font-[DM_Sans] text-[13px] font-medium capitalize text-[#1D1D1F]">
                    {user.registration_source || 'Website'}
                  </p>
                </div>
                <div className="rounded-xl bg-[#F5F5F7] p-3">
                  <p className="font-[DM_Sans] text-[10px] uppercase tracking-wide text-[#AEAEB2]">
                    Last Updated
                  </p>
                  <p className="mt-1 font-[DM_Sans] text-[13px] font-medium text-[#1D1D1F]">
                    {user.updated_at
                      ? format(new Date(user.updated_at), 'dd MMM yyyy')
                      : 'Never'}
                  </p>
                </div>
                <div className="rounded-xl bg-[#F5F5F7] p-3">
                  <p className="font-[DM_Sans] text-[10px] uppercase tracking-wide text-[#AEAEB2]">
                    Role
                  </p>
                  <span
                    className={`mt-1 inline-flex rounded-full border px-2 py-0.5 font-[DM_Sans] text-[10px] font-semibold uppercase ${getRoleBadgeStyles(currentRole)}`}
                  >
                    {currentRole}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Role-Specific Data Card */}
          {currentRole === 'instructor' && instructorData && (
            <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
              <div className="flex h-[44px] items-center gap-3 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
                <TrafficLights size="xs" />
                <span className="font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
                  Instructor Profile
                </span>
              </div>
              <div className="p-5">
                {instructorData.headline && (
                  <p className="mb-4 font-[DM_Sans] text-[14px] text-[#6E6E73]">
                    {instructorData.headline}
                  </p>
                )}

                <div className="grid grid-cols-5 gap-3">
                  <div className="rounded-xl bg-[#F5F5F7] p-3 text-center">
                    <p className="font-[DM_Sans] text-[18px] font-bold text-[#1D1D1F]">
                      {instructorData.total_courses}
                    </p>
                    <p className="text-[10px] text-[#AEAEB2]">Courses</p>
                  </div>
                  <div className="rounded-xl bg-[#F5F5F7] p-3 text-center">
                    <p className="font-[DM_Sans] text-[18px] font-bold text-[#1D1D1F]">
                      {instructorData.total_students}
                    </p>
                    <p className="text-[10px] text-[#AEAEB2]">Students</p>
                  </div>
                  <div className="rounded-xl bg-[#F5F5F7] p-3 text-center">
                    <p className="font-[DM_Sans] text-[18px] font-bold text-[#1D1D1F]">
                      {instructorData.avg_rating.toFixed(1)}★
                    </p>
                    <p className="text-[10px] text-[#AEAEB2]">Rating</p>
                  </div>
                  <div className="rounded-xl bg-[#F5F5F7] p-3 text-center">
                    <p className="font-[DM_Sans] text-[18px] font-bold text-[#1D1D1F]">
                      {formatCurrency(instructorData.total_earnings)}
                    </p>
                    <p className="text-[10px] text-[#AEAEB2]">Earnings</p>
                  </div>
                  <div className="rounded-xl bg-[#F5F5F7] p-3 text-center">
                    <p className="font-[DM_Sans] text-[18px] font-bold text-[#1D1D1F]">
                      {instructorData.commission_rate}%
                    </p>
                    <p className="text-[10px] text-[#AEAEB2]">Commission</p>
                  </div>
                </div>

                {courses.length > 0 && (
                  <div className="mt-5">
                    <h4 className="mb-3 font-[DM_Sans] text-[12px] uppercase tracking-wide text-[#AEAEB2]">
                      Courses ({courses.length})
                    </h4>
                    <div className="space-y-2">
                      {courses.slice(0, 5).map((course) => (
                        <div
                          key={course.id}
                          className="flex items-center gap-3 rounded-lg bg-[#F5F5F7] p-2"
                        >
                          <div className="h-10 w-14 shrink-0 overflow-hidden rounded bg-[rgba(0,0,0,0.05)]">
                            {course.thumbnail_url && (
                              <Image
                                src={course.thumbnail_url}
                                alt={course.title}
                                width={56}
                                height={40}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate font-[DM_Sans] text-[13px] font-medium text-[#1D1D1F]">
                              {course.title}
                            </p>
                            <p className="text-[11px] text-[#AEAEB2]">
                              {course.total_enrolled} enrolled
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-medium capitalize text-[#6E6E73]">
                            {course.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentRole === 'seller' && sellerData && (
            <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
              <div className="flex h-[44px] items-center gap-3 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
                <TrafficLights size="xs" />
                <span className="font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
                  Seller Profile
                </span>
              </div>
              <div className="p-5">
                <div className="mb-4">
                  <p className="font-[DM_Sans] text-[15px] font-semibold text-[#1D1D1F]">
                    {sellerData.store_name || 'Unnamed Store'}
                  </p>
                  {sellerData.store_slug && (
                    <p className="text-[12px] text-[#AEAEB2]">@{sellerData.store_slug}</p>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="rounded-xl bg-[#F5F5F7] p-3 text-center">
                    <p className="font-[DM_Sans] text-[18px] font-bold text-[#1D1D1F]">
                      {products.length}
                    </p>
                    <p className="text-[10px] text-[#AEAEB2]">Products</p>
                  </div>
                  <div className="rounded-xl bg-[#F5F5F7] p-3 text-center">
                    <p className="font-[DM_Sans] text-[18px] font-bold text-[#1D1D1F]">
                      {sellerData.total_sales}
                    </p>
                    <p className="text-[10px] text-[#AEAEB2]">Sales</p>
                  </div>
                  <div className="rounded-xl bg-[#F5F5F7] p-3 text-center">
                    <p className="font-[DM_Sans] text-[18px] font-bold text-[#1D1D1F]">
                      {formatCurrency(sellerData.total_revenue)}
                    </p>
                    <p className="text-[10px] text-[#AEAEB2]">Revenue</p>
                  </div>
                  <div className="rounded-xl bg-[#F5F5F7] p-3 text-center">
                    <p className="font-[DM_Sans] text-[18px] font-bold text-[#1D1D1F]">
                      {sellerData.commission_rate}%
                    </p>
                    <p className="text-[10px] text-[#AEAEB2]">Commission</p>
                  </div>
                </div>

                {products.length > 0 && (
                  <div className="mt-5">
                    <h4 className="mb-3 font-[DM_Sans] text-[12px] uppercase tracking-wide text-[#AEAEB2]">
                      Products ({products.length})
                    </h4>
                    <div className="space-y-2">
                      {products.slice(0, 5).map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-3 rounded-lg bg-[#F5F5F7] p-2"
                        >
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-[rgba(0,0,0,0.05)]">
                            {product.image_url && (
                              <Image
                                src={product.image_url}
                                alt={product.name}
                                width={40}
                                height={40}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate font-[DM_Sans] text-[13px] font-medium text-[#1D1D1F]">
                              {product.name}
                            </p>
                            <p className="text-[11px] text-[#AEAEB2]">
                              {product.total_sold} sold
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-medium capitalize text-[#6E6E73]">
                            {product.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentRole === 'student' && (
            <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
              <div className="flex h-[44px] items-center gap-3 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
                <TrafficLights size="xs" />
                <span className="font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
                  Learning Activity
                </span>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-4 gap-3">
                  <div className="rounded-xl bg-[#F5F5F7] p-3 text-center">
                    <p className="font-[DM_Sans] text-[18px] font-bold text-[#1D1D1F]">
                      {enrollmentCount}
                    </p>
                    <p className="text-[10px] text-[#AEAEB2]">Enrolled</p>
                  </div>
                  <div className="rounded-xl bg-[#F5F5F7] p-3 text-center">
                    <p className="font-[DM_Sans] text-[18px] font-bold text-[#1D1D1F]">
                      {enrollments.filter((e) => e.progress_percentage === 100).length}
                    </p>
                    <p className="text-[10px] text-[#AEAEB2]">Completed</p>
                  </div>
                  <div className="rounded-xl bg-[#F5F5F7] p-3 text-center">
                    <p className="font-[DM_Sans] text-[18px] font-bold text-[#1D1D1F]">
                      {certificatesCount}
                    </p>
                    <p className="text-[10px] text-[#AEAEB2]">Certificates</p>
                  </div>
                  <div className="rounded-xl bg-[#F5F5F7] p-3 text-center">
                    <p className="font-[DM_Sans] text-[18px] font-bold text-[#1D1D1F]">
                      {ordersCount}
                    </p>
                    <p className="text-[10px] text-[#AEAEB2]">Orders</p>
                  </div>
                </div>

                {enrollments.length > 0 && (
                  <div className="mt-5">
                    <h4 className="mb-3 font-[DM_Sans] text-[12px] uppercase tracking-wide text-[#AEAEB2]">
                      Enrolled Courses ({enrollments.length})
                    </h4>
                    <div className="space-y-2">
                      {enrollments.slice(0, 5).map((enrollment) => (
                        <div
                          key={enrollment.id}
                          className="flex items-center gap-3 rounded-lg bg-[#F5F5F7] p-2"
                        >
                          <div className="h-10 w-14 shrink-0 overflow-hidden rounded bg-[rgba(0,0,0,0.05)]">
                            {enrollment.course.thumbnail_url && (
                              <Image
                                src={enrollment.course.thumbnail_url}
                                alt={enrollment.course.title}
                                width={56}
                                height={40}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate font-[DM_Sans] text-[13px] font-medium text-[#1D1D1F]">
                              {enrollment.course.title}
                            </p>
                            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-[rgba(0,0,0,0.08)]">
                              <div
                                className="h-full rounded-full bg-[#28C840]"
                                style={{ width: `${enrollment.progress_percentage}%` }}
                              />
                            </div>
                          </div>
                          <span className="shrink-0 font-[DM_Sans] text-[12px] font-medium text-[#6E6E73]">
                            {enrollment.progress_percentage}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Activity Timeline */}
          <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
            <div className="flex h-[44px] items-center gap-3 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
              <TrafficLights size="xs" />
              <span className="font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
                Activity Timeline
              </span>
            </div>
            <div className="space-y-3 p-5">
              {[
                {
                  title: 'Account created',
                  time: format(new Date(user.created_at), 'dd MMM yyyy, HH:mm'),
                  dotColor: 'bg-[#28C840]',
                },
                user.updated_at
                  ? {
                      title: 'Profile updated',
                      time: format(new Date(user.updated_at), 'dd MMM yyyy, HH:mm'),
                      dotColor: 'bg-[#3B82F6]',
                    }
                  : null,
                {
                  title: `Status: ${currentStatus}`,
                  time: 'Current account state',
                  dotColor:
                    currentStatus === 'active'
                      ? 'bg-[#28C840]'
                      : currentStatus === 'pending' || currentStatus === 'pending_approval'
                        ? 'bg-[#FEBC2E]'
                        : currentStatus === 'suspended'
                          ? 'bg-[#FF5F57]'
                          : 'bg-[#AEAEB2]',
                },
              ]
                .filter(Boolean)
                .map((entry) => (
                  <div
                    key={entry!.title}
                    className="flex items-start gap-3 rounded-xl bg-[#F5F5F7] p-3"
                  >
                    <span className={`mt-1 h-2.5 w-2.5 rounded-full ${entry!.dotColor}`} />
                    <div>
                      <p className="font-[DM_Sans] text-[13px] font-medium text-[#1D1D1F]">
                        {entry!.title}
                      </p>
                      <p className="mt-0.5 font-[DM_Sans] text-[11px] text-[#6E6E73]">
                        {entry!.time}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
            <div className="flex h-[44px] items-center gap-3 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
              <TrafficLights size="xs" />
              <span className="font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
                Recent Notifications
              </span>
            </div>
            <div className="space-y-2 p-5">
              {recentNotifications.length === 0 ? (
                <p className="font-[DM_Sans] text-[12px] text-[#AEAEB2]">No recent notifications</p>
              ) : (
                recentNotifications.slice(0, 5).map((n) => (
                  <div key={n.id} className="rounded-xl bg-[#F5F5F7] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-[DM_Sans] text-[13px] font-medium text-[#1D1D1F]">{n.title}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${n.is_read ? 'bg-[rgba(0,0,0,0.06)] text-[#6E6E73]' : 'bg-[#1D1D1F] text-white'}`}>
                        {n.is_read ? 'Read' : 'New'}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 font-[DM_Sans] text-[12px] text-[#6E6E73]">{n.message}</p>
                    <p className="mt-1 font-[DM_Sans] text-[10px] text-[#AEAEB2]">{format(new Date(n.created_at), 'dd MMM yyyy, HH:mm')}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="w-full space-y-4 lg:w-[320px]">
          {/* Admin Actions Card */}
          <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
            <div className="flex h-[44px] items-center gap-3 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
              <TrafficLights size="xs" />
              <span className="font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
                Admin Actions
              </span>
            </div>
            <div className="space-y-3 p-5">
              {(currentStatus === 'pending' || currentStatus === 'pending_approval') && (
                <>
                  <button
                    onClick={() => {
                      setApprovalMode('approve');
                      setApprovalModalOpen(true);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[#28C840] py-2.5 font-[DM_Sans] text-[13px] font-semibold text-white transition-colors hover:bg-[#28C840]/90"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve Application
                  </button>
                  <button
                    onClick={() => {
                      setApprovalMode('reject');
                      setApprovalModalOpen(true);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-[#FF5F57]/30 py-2.5 font-[DM_Sans] text-[13px] font-medium text-[#FF5F57] transition-colors hover:bg-[#FF5F57]/10"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject Application
                  </button>
                </>
              )}

              {currentStatus === 'active' && (
                <>
                  <button
                    onClick={() => setNotifyModalOpen(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-[rgba(0,0,0,0.1)] py-2.5 font-[DM_Sans] text-[13px] font-medium text-[#1D1D1F] transition-colors hover:bg-[#F5F5F7]"
                  >
                    <Bell className="h-4 w-4" />
                    Send Notification
                  </button>
                  {!isAdmin && (
                    <>
                      <button
                        onClick={() => setChangeRoleModalOpen(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-full border border-[rgba(0,0,0,0.1)] py-2.5 font-[DM_Sans] text-[13px] font-medium text-[#1D1D1F] transition-colors hover:bg-[#F5F5F7]"
                      >
                        <UserCog className="h-4 w-4" />
                        Change Role
                      </button>
                      <button
                        onClick={() => {
                          setSuspendMode('suspend');
                          setSuspendModalOpen(true);
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-full border border-[#FF5F57]/30 py-2.5 font-[DM_Sans] text-[13px] font-medium text-[#FF5F57] transition-colors hover:bg-[#FF5F57]/10"
                      >
                        <Ban className="h-4 w-4" />
                        Suspend Account
                      </button>
                    </>
                  )}
                </>
              )}

              {currentStatus === 'suspended' && !isAdmin && (
                <button
                  onClick={() => {
                    setSuspendMode('unsuspend');
                    setSuspendModalOpen(true);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#28C840] py-2.5 font-[DM_Sans] text-[13px] font-semibold text-white transition-colors hover:bg-[#28C840]/90"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Restore Access
                </button>
              )}
            </div>
          </div>

          {/* Account Info Card */}
          <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
            <div className="flex h-[44px] items-center gap-3 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
              <TrafficLights size="xs" />
              <span className="font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
                Account Info
              </span>
            </div>
            <div className="p-5">
              {[
                {
                  label: 'Status',
                  value: (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusBadge.bg}`}
                    >
                      <StatusIcon className="h-[10px] w-[10px]" />
                      {statusBadge.label}
                    </span>
                  ),
                },
                {
                  label: 'Role',
                  value: (
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${getRoleBadgeStyles(currentRole)}`}
                    >
                      {currentRole}
                    </span>
                  ),
                },
                { label: 'User ID', value: user.id.slice(0, 12) + '...', mono: true },
                { label: 'Email Verified', value: emailVerified ? 'Yes' : 'No' },
                { label: 'Auth Provider', value: authProvider },
                {
                  label: 'Created',
                  value: format(new Date(user.created_at), 'dd MMM yyyy, HH:mm'),
                },
                {
                  label: 'Last Sign In',
                  value: lastSignInAt
                    ? format(new Date(lastSignInAt), 'dd MMM yyyy, HH:mm')
                    : 'Never',
                },
                { label: 'Language', value: getLanguageLabel(user.preferred_language) },
              ].map((item, i, arr) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between py-2 ${i < arr.length - 1 ? 'border-b border-[rgba(0,0,0,0.05)]' : ''}`}
                >
                  <span className="font-[DM_Sans] text-[12px] text-[#AEAEB2]">
                    {item.label}
                  </span>
                  {typeof item.value === 'string' ? (
                    <span
                      className={`font-[DM_Sans] text-[12px] font-medium text-[#1D1D1F] ${item.mono ? 'font-mono' : ''}`}
                    >
                      {item.value}
                    </span>
                  ) : (
                    item.value
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone Card */}
          {!isAdmin && (
            <div className="overflow-hidden rounded-2xl border border-[#FF5F57]/20 bg-white">
              <div className="flex h-[44px] items-center gap-3 border-b border-[#FF5F57]/10 bg-[#FFF0EF]/50 px-5">
                <TrafficLights size="xs" />
                <span className="font-[DM_Sans] text-[13px] font-semibold text-[#FF5F57]">
                  Danger Zone
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 rounded-xl bg-[#FFF0EF] p-3">
                  <Trash2 className="h-4 w-4 shrink-0 text-[#FF5F57]" />
                  <span className="flex-1 font-[DM_Sans] text-[12px] text-[#FF5F57]">
                    Permanently delete this account
                  </span>
                  <button
                    onClick={() => setDeleteDialogOpen(true)}
                    className="rounded-full border border-[#FF5F57]/30 px-3 py-1.5 font-[DM_Sans] text-[11px] font-medium text-[#FF5F57] transition-colors hover:bg-[#FF5F57]/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Approval Modal */}
      <ApprovalModal
        open={approvalModalOpen}
        onOpenChange={setApprovalModalOpen}
        user={user}
        mode={approvalMode}
        instructorData={instructorData}
        sellerData={sellerData}
        onSuccess={handleActionSuccess}
        onUserStatusChange={(_, status) => setCurrentStatus(status)}
      />

      {/* Suspend Modal */}
      <SuspendModal
        open={suspendModalOpen}
        onOpenChange={setSuspendModalOpen}
        user={user}
        mode={suspendMode}
        onSuccess={handleActionSuccess}
        onUserStatusChange={(_, status) => setCurrentStatus(status)}
      />

      {/* Send Notification Modal */}
      <Dialog open={notifyModalOpen} onOpenChange={setNotifyModalOpen}>
        <DialogContent
          className="max-w-md overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
          showCloseButton={false}
        >
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <TrafficLights size="xs" />
              <DialogClose asChild>
                <button className="rounded-lg p-1 text-[#AEAEB2] transition-colors hover:bg-[#F5F5F7] hover:text-[#1D1D1F]">
                  <X className="h-5 w-5" />
                </button>
              </DialogClose>
            </div>
            <h2 className="font-[DM_Sans] text-[18px] font-bold text-[#1D1D1F]">
              Send Notification to {user.full_name}
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block font-[DM_Sans] text-[12px] uppercase tracking-wide text-[#AEAEB2]">
                  Type:
                </label>
                <div className="flex gap-2">
                  {(['info', 'warning', 'success'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setNotifyType(type)}
                      className={`rounded-full px-4 py-1.5 font-[DM_Sans] text-[12px] font-medium capitalize transition-colors ${
                        notifyType === type
                          ? type === 'info'
                            ? 'bg-[#3B82F6] text-white'
                            : type === 'warning'
                              ? 'bg-[#FEBC2E] text-white'
                              : 'bg-[#28C840] text-white'
                          : 'bg-[#F5F5F7] text-[#6E6E73] hover:bg-[rgba(0,0,0,0.08)]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block font-[DM_Sans] text-[12px] uppercase tracking-wide text-[#AEAEB2]">
                  Title:
                </label>
                <input
                  type="text"
                  value={notifyTitle}
                  onChange={(e) => setNotifyTitle(e.target.value)}
                  placeholder="Notification title..."
                  className="w-full rounded-xl bg-[#F5F5F7] px-4 py-3 font-[DM_Sans] text-[13px] text-[#1D1D1F] outline-none placeholder:text-[#AEAEB2] focus:ring-2 focus:ring-[#1D1D1F]/20"
                />
              </div>

              <div>
                <label className="mb-2 block font-[DM_Sans] text-[12px] uppercase tracking-wide text-[#AEAEB2]">
                  Message:
                </label>
                <textarea
                  value={notifyBody}
                  onChange={(e) => setNotifyBody(e.target.value)}
                  placeholder="Message content..."
                  rows={4}
                  className="w-full resize-none rounded-xl bg-[#F5F5F7] px-4 py-3 font-[DM_Sans] text-[13px] text-[#1D1D1F] outline-none placeholder:text-[#AEAEB2] focus:ring-2 focus:ring-[#1D1D1F]/20"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-6 py-4">
            <DialogClose asChild>
              <button className="rounded-full px-4 py-2 font-[DM_Sans] text-[13px] font-medium text-[#6E6E73] transition-colors hover:bg-[rgba(0,0,0,0.05)]">
                Cancel
              </button>
            </DialogClose>
            <button
              onClick={sendNotification}
              disabled={notifySending}
              className="rounded-full bg-[#1D1D1F] px-5 py-2 font-[DM_Sans] text-[13px] font-semibold text-white transition-colors hover:bg-[#1D1D1F]/90 disabled:opacity-50"
            >
              {notifySending ? 'Sending...' : 'Send Notification'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Role Modal */}
      <Dialog open={changeRoleModalOpen} onOpenChange={setChangeRoleModalOpen}>
        <DialogContent
          className="max-w-sm overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
          showCloseButton={false}
        >
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <TrafficLights size="xs" />
              <DialogClose asChild>
                <button className="rounded-lg p-1 text-[#AEAEB2] transition-colors hover:bg-[#F5F5F7] hover:text-[#1D1D1F]">
                  <X className="h-5 w-5" />
                </button>
              </DialogClose>
            </div>
            <h2 className="font-[DM_Sans] text-[18px] font-bold text-[#1D1D1F]">
              Change User Role
            </h2>

            <div className="mt-5">
              <div className="mb-4 rounded-xl bg-[#F5F5F7] p-3">
                <p className="font-[DM_Sans] text-[12px] text-[#AEAEB2]">Current role</p>
                <span
                  className={`mt-1 inline-flex rounded-full border px-2.5 py-0.5 font-[DM_Sans] text-[10px] font-semibold uppercase ${getRoleBadgeStyles(user.role)}`}
                >
                  {user.role}
                </span>
              </div>

              <p className="mb-2 font-[DM_Sans] text-[12px] uppercase tracking-wide text-[#AEAEB2]">
                New role:
              </p>
              <div className="flex flex-wrap gap-2">
                {['student', 'instructor', 'seller', 'admin'].map((role) => (
                  <button
                    key={role}
                    onClick={() => setNewRole(role)}
                    className={`rounded-full px-4 py-1.5 font-[DM_Sans] text-[12px] font-medium uppercase transition-colors ${
                      newRole === role
                        ? role === 'admin'
                          ? 'bg-[#FF5F57] text-white'
                          : 'bg-[#1D1D1F] text-white'
                        : 'bg-[#F5F5F7] text-[#6E6E73] hover:bg-[rgba(0,0,0,0.08)]'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>

              {newRole === 'admin' && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#FFF0EF] p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#FF5F57]" />
                  <p className="font-[DM_Sans] text-[12px] text-[#FF5F57]">
                    This grants full platform access
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-6 py-4">
            <DialogClose asChild>
              <button className="rounded-full px-4 py-2 font-[DM_Sans] text-[13px] font-medium text-[#6E6E73] transition-colors hover:bg-[rgba(0,0,0,0.05)]">
                Cancel
              </button>
            </DialogClose>
            <button
              onClick={changeRole}
              disabled={changingRole || newRole === currentRole}
              className="rounded-full bg-[#1D1D1F] px-5 py-2 font-[DM_Sans] text-[13px] font-semibold text-white transition-colors hover:bg-[#1D1D1F]/90 disabled:opacity-50"
            >
              {changingRole ? 'Changing...' : 'Change Role'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
          <div className="p-6">
            <div className="mb-4">
              <TrafficLights size="xs" />
            </div>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-[DM_Sans] text-[18px] font-bold text-[#FF5F57]">
                Delete Account
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-2 font-[DM_Sans] text-[13px] text-[#6E6E73]">
                This action cannot be undone. This will permanently delete the account and all
                associated data for <strong>{user.full_name}</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="mt-5">
              <label className="mb-2 block font-[DM_Sans] text-[12px] uppercase tracking-wide text-[#AEAEB2]">
                Type "{user.full_name}" to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder="Type the user's full name..."
                className="w-full rounded-xl bg-[#F5F5F7] px-4 py-3 font-[DM_Sans] text-[13px] text-[#1D1D1F] outline-none placeholder:text-[#AEAEB2] focus:ring-2 focus:ring-[#FF5F57]/20"
              />
            </div>
          </div>

          <AlertDialogFooter className="flex items-center justify-end gap-3 border-t border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-6 py-4">
            <AlertDialogCancel className="m-0 rounded-full border-0 px-4 py-2 font-[DM_Sans] text-[13px] font-medium text-[#6E6E73] transition-colors hover:bg-[rgba(0,0,0,0.05)]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                deleteAccount();
              }}
              disabled={deleting || deleteConfirmName !== user.full_name}
              className="m-0 rounded-full bg-[#FF5F57] px-5 py-2 font-[DM_Sans] text-[13px] font-semibold text-white transition-colors hover:bg-[#FF5F57]/90 disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
