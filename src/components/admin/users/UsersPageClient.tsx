'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Download, UserPlus, Search, CheckCircle2, ShieldCheck } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';
import { format } from 'date-fns';
import TrafficLights from '@/components/auth/TrafficLights';
import {
  getUserQuickDetailAction,
  inviteUserAction,
  sendUserNotificationAction,
} from '@/app/actions/admin';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogClose,
} from '@/components/ui/dialog';
import UserStatsCards from './UserStatsCards';
import UserRow, { UserProfile, InstructorData, SellerData } from './UserRow';
import ApprovalModal from './ApprovalModal';
import SuspendModal from './SuspendModal';
import UserDetailDrawer from './UserDetailDrawer';

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  suspendedUsers: number;
  newThisMonth: number;
  totalStudents: number;
  totalInstructors: number;
  totalSellers: number;
}

interface UsersPageClientProps {
  users: UserProfile[];
  stats: UserStats;
  instructorMap: Record<string, InstructorData>;
  sellerMap: Record<string, SellerData>;
  enrollmentMap: Record<string, number>;
  adminId: string;
  initialRoleFilter?: RoleFilter;
  initialStatusFilter?: StatusFilter;
}

type StatusFilter = 'all' | 'active' | 'pending' | 'suspended' | 'rejected';
type RoleFilter = 'all' | 'student' | 'instructor' | 'seller' | 'admin';
type DateFilter = 'all' | 'today' | 'week' | 'month' | '3months';
type SortOption = 'newest' | 'oldest' | 'name_asc' | 'name_desc';

const ITEMS_PER_PAGE = 50;
const isPendingAccountStatus = (status: string | null | undefined) =>
  status === 'pending' || status === 'pending_approval';

function extractErrorMessage(value: unknown, fallback: string) {
  if (typeof value === 'string' && value.trim()) return value;
  if (value instanceof Error && value.message) return value.message;
  if (value && typeof value === 'object') {
    const candidate = value as {
      message?: unknown;
      error?: unknown;
      error_description?: unknown;
      code?: unknown;
      status?: unknown;
    };
    if (typeof candidate.message === 'string' && candidate.message.trim()) return candidate.message;
    if (typeof candidate.error === 'string' && candidate.error.trim()) return candidate.error;
    if (typeof candidate.error_description === 'string' && candidate.error_description.trim()) {
      return candidate.error_description;
    }
    const details = [candidate.code, candidate.status]
      .filter((v) => typeof v === 'string' || typeof v === 'number')
      .map((v) => String(v))
      .join(' | ')
      .trim();
    if (details) return `Invite failed (${details})`;

    try {
      const asJson = JSON.stringify(value);
      if (asJson && asJson !== '{}' && asJson !== 'null') return asJson;
    } catch {
      // no-op
    }
  }
  return fallback;
}

export default function UsersPageClient({
  users: initialUsers,
  stats: initialStats,
  instructorMap: initialInstructorMap,
  sellerMap: initialSellerMap,
  enrollmentMap: initialEnrollmentMap,
  adminId,
  initialRoleFilter = 'all',
  initialStatusFilter = 'all',
}: UsersPageClientProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [stats, setStats] = useState(initialStats);
  const [instructorMap, setInstructorMap] = useState(initialInstructorMap);
  const [sellerMap, setSellerMap] = useState(initialSellerMap);
  const [enrollmentMap] = useState(initialEnrollmentMap);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialStatusFilter);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>(initialRoleFilter);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [approvalMode, setApprovalMode] = useState<'approve' | 'reject'>('approve');
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendMode, setSuspendMode] = useState<'suspend' | 'unsuspend'>('suspend');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [quickDetailOpen, setQuickDetailOpen] = useState(false);
  const [quickDetailLoading, setQuickDetailLoading] = useState(false);
  const [quickDetailUser, setQuickDetailUser] = useState<UserProfile | null>(null);

  // Notification modal state
  const [notifyType, setNotifyType] = useState<'info' | 'warning' | 'success'>('info');
  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyBody, setNotifyBody] = useState('');
  const [notifySending, setNotifySending] = useState(false);

  // Invite modal state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'student' | 'instructor' | 'seller' | 'admin'>('student');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteSending, setInviteSending] = useState(false);

  // Keep filters in sync with server-provided query defaults when route query changes.
  useEffect(() => {
    setRoleFilter(initialRoleFilter);
    setCurrentPage(1);
  }, [initialRoleFilter]);

  useEffect(() => {
    setStatusFilter(initialStatusFilter);
    setCurrentPage(1);
  }, [initialStatusFilter]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('admin-users')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        (payload) => {
          const newUser = payload.new as UserProfile;
          setUsers((prev) => [newUser, ...prev]);
          setStats((prev) => ({
            ...prev,
            totalUsers: prev.totalUsers + 1,
            pendingUsers:
              isPendingAccountStatus(newUser.status) ? prev.pendingUsers + 1 : prev.pendingUsers,
            activeUsers:
              newUser.status === 'active' ? prev.activeUsers + 1 : prev.activeUsers,
            newThisMonth: prev.newThisMonth + 1,
          }));
          if (isPendingAccountStatus(newUser.status)) {
            toast.info(`New ${newUser.role} application!`);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          const updatedUser = payload.new as UserProfile;
          const oldUser = payload.old as UserProfile;
          setUsers((prev) =>
            prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
          );
          // Update stats based on status change
          if (oldUser.status !== updatedUser.status) {
            setStats((prev) => {
              const newStats = { ...prev };
              // Decrement old status count
              if (isPendingAccountStatus(oldUser.status)) newStats.pendingUsers--;
              else if (oldUser.status === 'active') newStats.activeUsers--;
              else if (oldUser.status === 'suspended') newStats.suspendedUsers--;
              // Increment new status count
              if (isPendingAccountStatus(updatedUser.status)) newStats.pendingUsers++;
              else if (updatedUser.status === 'active') newStats.activeUsers++;
              else if (updatedUser.status === 'suspended') newStats.suspendedUsers++;
              return newStats;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((u) =>
        statusFilter === 'pending' ? isPendingAccountStatus(u.status) : u.status === statusFilter
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      result = result.filter((u) => u.role === roleFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let cutoff: Date;
      switch (dateFilter) {
        case 'today':
          cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '3months':
          cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoff = new Date(0);
      }
      result = result.filter((u) => new Date(u.created_at) >= cutoff);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query) ||
          u.id.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name_asc':
          return (a.full_name || '').localeCompare(b.full_name || '');
        case 'name_desc':
          return (b.full_name || '').localeCompare(a.full_name || '');
        default:
          return 0;
      }
    });

    return result;
  }, [users, statusFilter, roleFilter, dateFilter, searchQuery, sortOption]);

  // Paginated users
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

  // Status counts for tabs
  const statusCounts = useMemo(() => {
    return {
      all: users.length,
      active: users.filter((u) => u.status === 'active').length,
      pending: users.filter((u) => isPendingAccountStatus(u.status)).length,
      suspended: users.filter((u) => u.status === 'suspended').length,
      rejected: users.filter((u) => u.status === 'rejected').length,
    };
  }, [users]);

  // Export CSV
  const exportCSV = useCallback(() => {
    const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Joined', 'Language', 'Activity'];
    const rows = filteredUsers.map((user) => {
      let activity = '';
      if (user.role === 'instructor' && instructorMap[user.id]) {
        const data = instructorMap[user.id];
        activity = `Courses: ${data.total_courses}, Students: ${data.total_students}`;
      } else if (user.role === 'seller' && sellerMap[user.id]) {
        const data = sellerMap[user.id];
        activity = `Products: ${data.total_sales}, Revenue: ₹${data.total_revenue}`;
      } else if (user.role === 'student') {
        activity = `Enrolled: ${enrollmentMap[user.id] || 0}`;
      }

      return [
        user.id,
        user.full_name || '',
        user.email || '',
        user.role,
        user.status,
        format(new Date(user.created_at), 'yyyy-MM-dd'),
        user.preferred_language || 'en',
        activity,
      ];
    });

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `slate-users-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Users exported successfully');
  }, [filteredUsers, instructorMap, sellerMap, enrollmentMap]);

  // Send notification
  const sendNotification = async () => {
    if (!selectedUser || !notifyTitle.trim() || !notifyBody.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setNotifySending(true);
    try {
      const result = await sendUserNotificationAction({
        userId: selectedUser.id,
        type: notifyType,
        title: notifyTitle,
        message: notifyBody,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to send notification');
      }

      toast.success('Notification sent!');
      setNotifyModalOpen(false);
      setNotifyTitle('');
      setNotifyBody('');
      setSelectedUser(null);
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setNotifySending(false);
    }
  };

  const sendInvite = async () => {
    const normalizedEmail = inviteEmail.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }

    setInviteSending(true);
    try {
      const result = await inviteUserAction({
        email: normalizedEmail,
        role: inviteRole,
        message: inviteMessage.trim() || undefined,
        invitedBy: adminId,
      });

      if (!result.success) {
        const message = extractErrorMessage(result.error, 'Failed to send invite');
        toast.error(message);
        return;
      }

      toast.success(`Invitation sent to ${normalizedEmail}`);
      setInviteModalOpen(false);
      setInviteEmail('');
      setInviteRole('student');
      setInviteMessage('');
      router.refresh();
    } catch (error) {
      console.error('Invite failed:', error);
      toast.error(extractErrorMessage(error, 'Failed to send invite. Please try again.'));
    } finally {
      setInviteSending(false);
    }
  };

  // Refresh data after action
  const handleActionSuccess = () => {
    router.refresh();
  };

  const handleOptimisticStatusChange = useCallback((userId: string, status: string) => {
    let previousStatus: string | null = null;

    setUsers((prev) =>
      prev.map((user) => {
        if (user.id !== userId) return user;
        previousStatus = user.status;
        return { ...user, status };
      })
    );

    setSelectedUser((prev) => {
      if (!prev || prev.id !== userId) return prev;
      return { ...prev, status };
    });

    if (!previousStatus || previousStatus === status) {
      return;
    }

    setStats((prev) => {
      const next = { ...prev };
      if (isPendingAccountStatus(previousStatus)) next.pendingUsers = Math.max(0, next.pendingUsers - 1);
      if (previousStatus === 'active') next.activeUsers = Math.max(0, next.activeUsers - 1);
      if (previousStatus === 'suspended') next.suspendedUsers = Math.max(0, next.suspendedUsers - 1);

      if (isPendingAccountStatus(status)) next.pendingUsers += 1;
      if (status === 'active') next.activeUsers += 1;
      if (status === 'suspended') next.suspendedUsers += 1;
      return next;
    });
  }, []);

  const openQuickDetail = useCallback(async (user: UserProfile) => {
    setSelectedUser(user);
    setQuickDetailUser(user);
    setQuickDetailOpen(true);
    setQuickDetailLoading(true);

    try {
      const result = await getUserQuickDetailAction({ userId: user.id });
      if (result.success && result.user) {
        setQuickDetailUser((prev) => ({ ...(prev || user), ...result.user }));
      }
    } catch (error) {
      console.error('Failed to fetch quick profile details:', error);
    } finally {
      setQuickDetailLoading(false);
    }
  }, []);

  // Tab button component
  const TabButton = ({
    label,
    value,
    count,
  }: {
    label: string;
    value: StatusFilter;
    count: number;
  }) => {
    const isActive = statusFilter === value;
    const getBadgeStyles = () => {
      if (value === 'pending' && count > 0) {
        return 'bg-[#FEBC2E]/20 text-[#FEBC2E]';
      }
      if (value === 'suspended' && count > 0) {
        return 'bg-[#FF5F57]/20 text-[#FF5F57]';
      }
      return isActive ? 'bg-[#1D1D1F] text-white' : 'bg-[#F5F5F7] text-[#6E6E73]';
    };

    return (
      <button
        onClick={() => {
          setStatusFilter(value);
          setCurrentPage(1);
        }}
        className={`flex items-center gap-2 rounded-full px-4 py-2 font-[DM_Sans] text-[13px] font-medium transition-colors ${
          isActive
            ? 'bg-[#1D1D1F] text-white'
            : 'bg-white text-[#6E6E73] hover:bg-[#F5F5F7]'
        }`}
      >
        {label}
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${getBadgeStyles()}`}
        >
          {count}
        </span>
      </button>
    );
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-[DM_Sans] text-[26px] font-bold text-[#1D1D1F]">Users</h1>
          <p className="mt-1 font-[DM_Sans] text-[13px] text-[#6E6E73]">
            {stats.totalUsers} users · {stats.newThisMonth} joined this month
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-full border border-[rgba(0,0,0,0.1)] bg-white px-4 py-2 font-[DM_Sans] text-[13px] font-medium text-[#1D1D1F] transition-colors hover:bg-[#F5F5F7]"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={() => setInviteModalOpen(true)}
            className="flex items-center gap-2 rounded-full bg-[#1D1D1F] px-5 py-2.5 font-[DM_Sans] text-[13px] font-semibold text-white transition-colors hover:bg-[#1D1D1F]/90"
          >
            <UserPlus className="h-[14px] w-[14px]" />
            Invite User
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <UserStatsCards stats={stats} />

      {/* Filter + Search Row */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-2">
          <TabButton label="All" value="all" count={statusCounts.all} />
          <TabButton label="Active" value="active" count={statusCounts.active} />
          <TabButton label="Pending" value="pending" count={statusCounts.pending} />
          <TabButton label="Suspended" value="suspended" count={statusCounts.suspended} />
          <TabButton label="Rejected" value="rejected" count={statusCounts.rejected} />
        </div>

        {/* Right Filters */}
        <div className="ml-auto flex items-center gap-3">
          {/* Role Filter */}
          <Select
            value={roleFilter}
            onValueChange={(v) => {
              setRoleFilter(v as RoleFilter);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[150px] rounded-xl border-[rgba(0,0,0,0.08)] bg-white font-[DM_Sans] text-[13px]">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="instructor">Instructor</SelectItem>
              <SelectItem value="seller">Seller</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Filter */}
          <Select
            value={dateFilter}
            onValueChange={(v) => {
              setDateFilter(v as DateFilter);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[160px] rounded-xl border-[rgba(0,0,0,0.08)] bg-white font-[DM_Sans] text-[13px]">
              <SelectValue placeholder="All time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This week</SelectItem>
              <SelectItem value="month">This month</SelectItem>
              <SelectItem value="3months">Last 3 months</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select
            value={sortOption}
            onValueChange={(v) => setSortOption(v as SortOption)}
          >
            <SelectTrigger className="h-9 w-[160px] rounded-xl border-[rgba(0,0,0,0.08)] bg-white font-[DM_Sans] text-[13px]">
              <SelectValue placeholder="Newest First" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name_asc">Name A-Z</SelectItem>
              <SelectItem value="name_desc">Name Z-A</SelectItem>
            </SelectContent>
          </Select>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#AEAEB2]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Name, email, ID..."
              className="h-9 w-[220px] rounded-xl bg-[#F5F5F7] pl-10 pr-4 font-[DM_Sans] text-[13px] text-[#1D1D1F] outline-none placeholder:text-[#AEAEB2] focus:ring-2 focus:ring-[#1D1D1F]/20"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
        {/* Titlebar */}
        <div className="flex h-[44px] items-center gap-3 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
          <TrafficLights size="xs" />
          <span className="font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
            All Users ({filteredUsers.length})
          </span>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[980px]">
            {/* Table Header */}
            <div className="grid grid-cols-[minmax(180px,2fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(120px,1fr)] gap-4 border-b border-[rgba(0,0,0,0.05)] bg-[#F5F5F7] px-5 py-3">
              <span className="font-[DM_Sans] text-[11px] uppercase tracking-wide text-[#AEAEB2]">
                User
              </span>
              <span className="font-[DM_Sans] text-[11px] uppercase tracking-wide text-[#AEAEB2]">
                Role
              </span>
              <span className="font-[DM_Sans] text-[11px] uppercase tracking-wide text-[#AEAEB2]">
                Status
              </span>
              <span className="font-[DM_Sans] text-[11px] uppercase tracking-wide text-[#AEAEB2]">
                Joined
              </span>
              <span className="font-[DM_Sans] text-[11px] uppercase tracking-wide text-[#AEAEB2]">
                Activity
              </span>
              <span className="font-[DM_Sans] text-[11px] uppercase tracking-wide text-[#AEAEB2]">
                Actions
              </span>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-[rgba(0,0,0,0.05)]">
              {paginatedUsers.length === 0 ? (
                <div className="py-16 text-center">
                  {statusFilter === 'pending' ? (
                    <>
                      <CheckCircle2 className="mx-auto h-9 w-9 text-[#28C840]" />
                      <p className="mt-3 font-[DM_Sans] text-[15px] font-semibold text-[#1D1D1F]">
                        All applications reviewed!
                      </p>
                      <p className="mt-1 text-[13px] text-[#6E6E73]">No pending users.</p>
                    </>
                  ) : statusFilter === 'suspended' ? (
                    <>
                      <ShieldCheck className="mx-auto h-9 w-9 text-[#28C840]" />
                      <p className="mt-3 font-[DM_Sans] text-[15px] font-semibold text-[#1D1D1F]">
                        No suspended users
                      </p>
                      <p className="mt-1 text-[13px] text-[#6E6E73]">
                        Platform is running smoothly.
                      </p>
                    </>
                  ) : (
                    <>
                      <Search className="mx-auto h-9 w-9 text-[#AEAEB2]" />
                      <p className="mt-3 font-[DM_Sans] text-[15px] font-semibold text-[#1D1D1F]">
                        No users found
                      </p>
                      <p className="mt-1 text-[13px] text-[#6E6E73]">
                        Try different search terms.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                paginatedUsers.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    instructorData={instructorMap[user.id]}
                    sellerData={sellerMap[user.id]}
                    enrollmentCount={enrollmentMap[user.id] || 0}
                    onViewDetail={() => {
                      openQuickDetail(user);
                    }}
                    onApprove={() => {
                      setSelectedUser(user);
                      setApprovalMode('approve');
                      setApprovalModalOpen(true);
                    }}
                    onReject={() => {
                      setSelectedUser(user);
                      setApprovalMode('reject');
                      setApprovalModalOpen(true);
                    }}
                    onSuspend={() => {
                      setSelectedUser(user);
                      setSuspendMode('suspend');
                      setSuspendModalOpen(true);
                    }}
                    onUnsuspend={() => {
                      setSelectedUser(user);
                      setSuspendMode('unsuspend');
                      setSuspendModalOpen(true);
                    }}
                    onSendNotification={() => {
                      setSelectedUser(user);
                      setNotifyModalOpen(true);
                    }}
                    onChangeRole={() => {
                      router.push(`/admin/users/${user.id}?action=change-role`);
                    }}
                    onDelete={() => {
                      router.push(`/admin/users/${user.id}?action=delete`);
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[rgba(0,0,0,0.05)] px-5 py-3">
            <p className="font-[DM_Sans] text-[13px] text-[#6E6E73]">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} of{' '}
              {filteredUsers.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg bg-[#F5F5F7] px-3 py-1.5 font-[DM_Sans] text-[12px] font-medium text-[#1D1D1F] transition-colors hover:bg-[rgba(0,0,0,0.08)] disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`rounded-lg px-3 py-1.5 font-[DM_Sans] text-[12px] font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-[#1D1D1F] text-white'
                        : 'bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[rgba(0,0,0,0.08)]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg bg-[#F5F5F7] px-3 py-1.5 font-[DM_Sans] text-[12px] font-medium text-[#1D1D1F] transition-colors hover:bg-[rgba(0,0,0,0.08)] disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {selectedUser && (
        <ApprovalModal
          open={approvalModalOpen}
          onOpenChange={setApprovalModalOpen}
          user={selectedUser}
          mode={approvalMode}
          instructorData={instructorMap[selectedUser.id]}
          sellerData={sellerMap[selectedUser.id]}
          onSuccess={handleActionSuccess}
          onUserStatusChange={handleOptimisticStatusChange}
        />
      )}

      {/* Suspend Modal */}
      {selectedUser && (
        <SuspendModal
          open={suspendModalOpen}
          onOpenChange={setSuspendModalOpen}
          user={selectedUser}
          mode={suspendMode}
          onSuccess={handleActionSuccess}
          onUserStatusChange={handleOptimisticStatusChange}
        />
      )}

      {/* Quick Detail Drawer */}
      <UserDetailDrawer
        open={quickDetailOpen}
        onOpenChange={setQuickDetailOpen}
        user={quickDetailUser || selectedUser}
        loading={quickDetailLoading}
        instructorData={quickDetailUser ? instructorMap[quickDetailUser.id] : selectedUser ? instructorMap[selectedUser.id] : null}
        sellerData={quickDetailUser ? sellerMap[quickDetailUser.id] : selectedUser ? sellerMap[selectedUser.id] : null}
        enrollmentCount={quickDetailUser ? enrollmentMap[quickDetailUser.id] || 0 : selectedUser ? enrollmentMap[selectedUser.id] || 0 : 0}
        onViewDetail={() => {
          const targetUser = quickDetailUser || selectedUser;
          if (!targetUser) return;
          setQuickDetailOpen(false);
          router.push(`/admin/users/${targetUser.id}`);
        }}
        onApprove={() => {
          if (!selectedUser) return;
          setQuickDetailOpen(false);
          setApprovalMode('approve');
          setApprovalModalOpen(true);
        }}
        onReject={() => {
          if (!selectedUser) return;
          setQuickDetailOpen(false);
          setApprovalMode('reject');
          setApprovalModalOpen(true);
        }}
        onSuspend={() => {
          if (!selectedUser) return;
          setQuickDetailOpen(false);
          setSuspendMode('suspend');
          setSuspendModalOpen(true);
        }}
        onUnsuspend={() => {
          if (!selectedUser) return;
          setQuickDetailOpen(false);
          setSuspendMode('unsuspend');
          setSuspendModalOpen(true);
        }}
      />

      {/* Invite User Modal */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent
          className="max-w-sm overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
          showCloseButton={false}
        >
          <div className="p-6">
            <div className="mb-4">
              <TrafficLights size="xs" />
            </div>
            <h2 className="font-[DM_Sans] text-[18px] font-bold text-[#1D1D1F]">
              Invite User
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block font-[DM_Sans] text-[12px] uppercase tracking-wide text-[#AEAEB2]">
                  Email:
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@email.com"
                  className="w-full rounded-xl bg-[#F5F5F7] px-4 py-3 font-[DM_Sans] text-[13px] text-[#1D1D1F] outline-none placeholder:text-[#AEAEB2] focus:ring-2 focus:ring-[#1D1D1F]/20"
                />
              </div>

              <div>
                <label className="mb-2 block font-[DM_Sans] text-[12px] uppercase tracking-wide text-[#AEAEB2]">
                  Role:
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['student', 'instructor', 'seller', 'admin'] as const).map((role) => (
                    <button
                      key={role}
                      onClick={() => setInviteRole(role)}
                      className={`rounded-full px-3 py-1.5 font-[DM_Sans] text-[12px] font-medium capitalize transition-colors ${
                        inviteRole === role
                          ? role === 'admin'
                            ? 'bg-[#FF5F57] text-white'
                            : role === 'instructor'
                              ? 'bg-[#3B82F6] text-white'
                              : role === 'seller'
                                ? 'bg-[#28C840] text-white'
                                : 'bg-[#1D1D1F] text-white'
                          : 'bg-[#F5F5F7] text-[#6E6E73] hover:bg-[rgba(0,0,0,0.08)]'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block font-[DM_Sans] text-[12px] uppercase tracking-wide text-[#AEAEB2]">
                  Personal message (optional):
                </label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Add a personal note..."
                  rows={3}
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
              onClick={sendInvite}
              disabled={inviteSending}
              className="rounded-full bg-[#1D1D1F] px-5 py-2 font-[DM_Sans] text-[13px] font-semibold text-white transition-colors hover:bg-[#1D1D1F]/90 disabled:opacity-50"
            >
              {inviteSending ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Notification Modal */}
      <Dialog open={notifyModalOpen} onOpenChange={setNotifyModalOpen}>
        <DialogContent
          className="max-w-md overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
          showCloseButton={false}
        >
          <div className="p-6">
            <div className="mb-4">
              <TrafficLights size="xs" />
            </div>
            <h2 className="font-[DM_Sans] text-[18px] font-bold text-[#1D1D1F]">
              Send Notification to {selectedUser?.full_name}
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
    </div>
  );
}
