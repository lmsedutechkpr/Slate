'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
  TrendingUp, CheckCircle2, Calendar, Percent,
  Settings, DollarSign, Download, Search,
  ChevronLeft, ChevronRight, Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import EarningsChart from './EarningsChart';
import EarningsBreakdown from './EarningsBreakdown';
import TransactionRow from './TransactionRow';
import PayoutSettingsForm from './PayoutSettingsForm';

/* ─── Types ─── */
interface Transaction {
  id: string;
  type: 'enrollment' | 'payout';
  status: 'paid' | 'pending' | 'failed';
  description: string;
  course_title?: string;
  gross_amount: number;
  net_amount: number;
  created_at: string;
}
interface Stats {
  totalEarnings: number;
  totalPaidOut: number;
  pendingBalance: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  monthOverMonth: number;
  commissionRate: number;
}
interface Props {
  instructorProfile: any;
  transactions: Transaction[];
  courseEarnings: any[];
  monthlyData: { month: string; amount: number }[];
  stats: Stats;
  userId: string;
}

/* ─── Helpers ─── */
function MacCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm overflow-hidden ${className}`}>
      {children}
    </div>
  );
}
function TitleBar({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="h-[44px] flex items-center justify-between border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
          <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
          <div className="h-2 w-2 rounded-full bg-[#28C840]" />
        </div>
        <span className="font-[DM_Sans] font-semibold text-[13px] text-[#1D1D1F]">{children}</span>
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}

const statuses = ['All', 'Paid', 'Pending', 'Failed'] as const;
const DATE_RANGES = ['Last 30 days', 'Last 3 months', 'Last 6 months', 'This year', 'All time'] as const;
const PAGE_SIZE = 10;

/* ─── Export CSV ─── */
function exportCSV(transactions: Transaction[]) {
  const headers = ['Date', 'Description', 'Course', 'Gross Amount', 'Your Earnings', 'Status'];
  const rows = transactions.map(t => [
    format(new Date(t.created_at), 'dd/MM/yyyy'),
    t.description,
    t.course_title || '',
    `₹${t.gross_amount}`,
    `₹${t.net_amount}`,
    t.status,
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `slate-earnings-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('CSV exported!');
}

/* ─────────────────────────────── MAIN ─────────────────────────────── */
export default function PayoutsPageClient({
  instructorProfile, transactions, courseEarnings, monthlyData, stats, userId,
}: Props) {
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(instructorProfile);
  const [showSettings, setShowSettings] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  // Recent transactions sidebar state
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // All-transactions table state
  const [dateRange, setDateRange] = useState<string>('All time');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Payout request
  const [payoutAmount, setPayoutAmount] = useState(stats.pendingBalance);
  const [payoutLoading, setPayoutLoading] = useState(false);

  // When settings are saved, immediately update the profile state so the modal reflects the new method
  const handleSettingsSaved = (updatedMethod: string, updatedDetails: any) => {
    setProfile((prev: any) => ({ ...prev, payout_method: updatedMethod, payout_details: updatedDetails }));
  };

  /* ─── Filtered transactions for table ─── */
  const filtered = useMemo(() => {
    let result = [...transactions];

    if (dateRange !== 'All time') {
      const now = new Date();
      const days = dateRange === 'Last 30 days' ? 30 : dateRange === 'Last 3 months' ? 90 : dateRange === 'Last 6 months' ? 180 : 365;
      const cutoff = new Date(now.getTime() - days * 86400000);
      result = result.filter(t => new Date(t.created_at) >= cutoff);
    }
    if (typeFilter === 'Enrollments') result = result.filter(t => t.type === 'enrollment');
    if (typeFilter === 'Payouts') result = result.filter(t => t.type === 'payout');
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t => t.description.toLowerCase().includes(q) || t.course_title?.toLowerCase().includes(q));
    }
    return result;
  }, [transactions, dateRange, typeFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ─── Request Payout ─── */
  const submitPayoutRequest = async () => {
    setPayoutLoading(true);
    try {
      const newPending = Math.max(0, stats.pendingBalance - payoutAmount);
      const { error } = await supabase.from('instructor_profiles').update({
        pending_payout: newPending,
      }).eq('user_id', userId);
      if (error) throw error;
      // Optimistic update
      setProfile((prev: any) => ({ ...prev, pending_payout: newPending }));
      toast.success('Payout request submitted! Expected within 3-5 business days.', { style: { color: '#28C840' } });
      setShowPayoutModal(false);
    } catch {
      toast.error('Failed to submit request');
    } finally {
      setPayoutLoading(false);
    }
  };

  /* ─── Next payout date ─── */
  const now = new Date();
  const nextPayoutDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    .toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });

  const recentFiltered = filterStatus === 'All'
    ? transactions.slice(0, 8)
    : transactions.filter(t => t.status === filterStatus.toLowerCase()).slice(0, 8);

  /* ──────────────────────────── RENDER ──────────────────────────── */
  return (
    <div className="mx-auto max-w-6xl px-6 py-8 font-[DM_Sans]">

      {/* ─── HEADER ─── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[26px] font-bold text-[#1D1D1F]">Payouts</h1>
          <p className="mt-1 text-[13px] text-[#6E6E73]">Track your earnings and payouts</p>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center border border-[rgba(0,0,0,0.1)] text-[#1D1D1F] rounded-full px-4 py-2 text-[13px] font-medium hover:bg-[#F5F5F7] transition-colors"
        >
          <Settings className="w-3.5 h-3.5 mr-2" />
          Payout Settings
        </button>
      </div>

      {/* ─── PENDING BALANCE HERO ─── */}
      <MacCard className="mb-6">
        <TitleBar>Available Balance</TitleBar>
        <div className="p-6 flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-[12px] text-[#AEAEB2] uppercase tracking-wide mb-2 font-semibold">Pending Payout</p>
            <div className="font-[DM_Sans] font-extrabold text-[40px] leading-none text-[#1D1D1F]">
              ₹{stats.pendingBalance.toLocaleString('en-IN')}
            </div>
            {stats.pendingBalance > 0 ? (
              <div className="flex items-center gap-1.5 mt-2">
                <CheckCircle2 className="w-3 h-3 text-[#28C840]" />
                <span className="text-[13px] text-[#28C840]">Available for withdrawal</span>
              </div>
            ) : (
              <p className="text-[13px] text-[#AEAEB2] mt-2">No pending balance</p>
            )}
            <div className="flex items-center gap-1.5 mt-1">
              <Calendar className="w-3 h-3 text-[#6E6E73]" />
              <span className="text-[12px] text-[#6E6E73]">Next payout: {nextPayoutDate}</span>
            </div>
          </div>
          <div className="text-center">
            <button
              onClick={() => setShowPayoutModal(true)}
              disabled={stats.pendingBalance === 0}
              className="flex items-center bg-[#1D1D1F] text-white rounded-full px-6 py-3 font-bold text-[14px] hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Request Payout
            </button>
            <p className="text-[10px] text-[#AEAEB2] mt-2 text-center">
              Payouts processed on 1st<br />of every month
            </p>
          </div>
        </div>
      </MacCard>

      {/* ─── STATS ROW ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            icon: TrendingUp,
            value: `₹${stats.totalEarnings.toLocaleString('en-IN')}`,
            label: 'Total Earnings',
            trend: stats.monthOverMonth !== 0
              ? `${stats.monthOverMonth > 0 ? '+' : ''}${stats.monthOverMonth}% vs last month`
              : undefined,
          },
          {
            icon: CheckCircle2,
            value: `₹${stats.totalPaidOut.toLocaleString('en-IN')}`,
            label: 'Total Paid Out',
            valueColor: 'text-[#28C840]',
          },
          {
            icon: Calendar,
            value: `₹${stats.thisMonthEarnings.toLocaleString('en-IN')}`,
            label: 'This Month',
            trend: stats.monthOverMonth !== 0
              ? `${stats.monthOverMonth > 0 ? '+' : ''}${stats.monthOverMonth}% vs last month`
              : undefined,
          },
          {
            icon: Percent,
            value: `${stats.commissionRate}%`,
            label: 'Your Revenue Share',
            sub: `Platform takes ${100 - stats.commissionRate}%`,
          },
        ].map((s, i) => (
          <MacCard key={i}>
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-xl bg-[#F5F5F7] flex items-center justify-center">
                  <s.icon className="w-4 h-4 text-[#6E6E73]" />
                </div>
              </div>
              <div className={`font-[DM_Sans] font-bold text-[22px] ${s.valueColor || 'text-[#1D1D1F]'}`}>
                {s.value}
              </div>
              <div className="text-[12px] text-[#6E6E73] mt-0.5">{s.label}</div>
              {s.trend && (
                <div className="text-[11px] text-[#AEAEB2] mt-1">{s.trend}</div>
              )}
              {s.sub && (
                <div className="text-[10px] text-[#AEAEB2] mt-1">{s.sub}</div>
              )}
            </div>
          </MacCard>
        ))}
      </div>

      {/* ─── EARNINGS CHART ─── */}
      <EarningsChart monthlyData={monthlyData} />

      {/* ─── TWO COLUMN ─── */}
      {transactions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* LEFT: Per-Course */}
          <EarningsBreakdown courseEarnings={courseEarnings} />

          {/* RIGHT: Recent Transactions */}
          <MacCard className="h-full flex flex-col">
            <TitleBar>Recent Transactions</TitleBar>

            {/* Filter pills */}
            <div className="px-4 py-3 border-b border-[rgba(0,0,0,0.06)] flex gap-2 flex-wrap">
              {statuses.map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                    filterStatus === s
                      ? 'bg-[#1D1D1F] text-white'
                      : 'bg-[#F5F5F7] text-[#6E6E73] hover:bg-[rgba(0,0,0,0.06)]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="flex-1 divide-y divide-[rgba(0,0,0,0.05)] overflow-auto">
              {recentFiltered.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-center">
                  <p className="text-[13px] text-[#AEAEB2]">No transactions found</p>
                </div>
              ) : (
                recentFiltered.map(t => <TransactionRow key={t.id} transaction={t} />)
              )}
            </div>
          </MacCard>
        </div>
      ) : (
        /* ─── EMPTY STATE ─── */
        <MacCard className="mb-6">
          <TitleBar>Earnings</TitleBar>
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <DollarSign className="w-12 h-12 text-[#AEAEB2] mx-auto mt-8" />
            <h2 className="font-bold text-[22px] text-[#1D1D1F] mt-5">No earnings yet</h2>
            <p className="text-[14px] text-[#6E6E73] mt-2 max-w-xs">
              Earnings will appear here once students enroll in your courses.
            </p>
            <a
              href="/instructor/courses"
              className="mt-8 bg-[#1D1D1F] text-white rounded-full px-6 py-3 font-bold text-[14px] hover:bg-[#333] transition-colors inline-block"
            >
              View My Courses
            </a>
          </div>
        </MacCard>
      )}

      {/* ─── ALL TRANSACTIONS TABLE ─── */}
      {transactions.length > 0 && (
        <MacCard className="mb-6">
          <TitleBar right={
            <button
              onClick={() => exportCSV(filtered)}
              className="flex items-center border border-[rgba(0,0,0,0.1)] rounded-full px-3 py-1.5 text-[12px] text-[#1D1D1F] hover:bg-[rgba(0,0,0,0.04)] transition-colors"
            >
              <Download className="w-3 h-3 mr-1.5" />
              Export CSV
            </button>
          }>
            All Transactions
          </TitleBar>

          {/* Filter Row */}
          <div className="px-5 py-3 border-b border-[rgba(0,0,0,0.06)] flex items-center gap-3 flex-wrap">
            <select
              value={dateRange}
              onChange={e => { setDateRange(e.target.value); setPage(1); }}
              className="border border-[rgba(0,0,0,0.1)] rounded-xl px-3 py-1.5 text-[12px] text-[#1D1D1F] bg-[#F5F5F7] focus:outline-none"
            >
              {DATE_RANGES.map(r => <option key={r}>{r}</option>)}
            </select>
            <select
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
              className="border border-[rgba(0,0,0,0.1)] rounded-xl px-3 py-1.5 text-[12px] text-[#1D1D1F] bg-[#F5F5F7] focus:outline-none"
            >
              {['All Types', 'Enrollments', 'Payouts'].map(r => <option key={r}>{r}</option>)}
            </select>
            <div className="relative ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[#AEAEB2]" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search transactions..."
                className="pl-8 pr-4 py-1.5 border border-[rgba(0,0,0,0.1)] rounded-xl text-[12px] text-[#1D1D1F] bg-[#F5F5F7] focus:outline-none w-[180px]"
              />
            </div>
          </div>

          {/* Table Header */}
          <div className="bg-[#F5F5F7] px-5 py-3 grid grid-cols-[120px_1fr_1fr_80px_80px_80px] gap-4">
            {['Date', 'Description', 'Course', 'Gross', 'Your Share', 'Status'].map(h => (
              <span key={h} className="text-[11px] text-[#AEAEB2] uppercase font-semibold tracking-wide">{h}</span>
            ))}
          </div>

          {/* Table Rows */}
          <div>
            {paginated.length === 0 ? (
              <div className="py-12 text-center text-[13px] text-[#AEAEB2]">No results found</div>
            ) : (
              paginated.map(t => {
                const ss =
                  t.status === 'paid' ? { bg: 'bg-[#EDFAF0]', text: 'text-[#28C840]', label: 'Paid' } :
                  t.status === 'pending' ? { bg: 'bg-[#FFF8EC]', text: 'text-[#FEBC2E]', label: 'Pending' } :
                  { bg: 'bg-[#FFF0EF]', text: 'text-[#FF5F57]', label: 'Failed' };
                return (
                  <div
                    key={t.id}
                    className="px-5 py-3 grid grid-cols-[120px_1fr_1fr_80px_80px_80px] gap-4 border-b border-[rgba(0,0,0,0.05)] hover:bg-[#F5F5F7] transition-colors items-center"
                  >
                    <span className="text-[12px] text-[#6E6E73]">{format(new Date(t.created_at), 'dd MMM yyyy')}</span>
                    <span className="text-[12px] font-medium text-[#1D1D1F] truncate">{t.description}</span>
                    <span className="text-[12px] text-[#6E6E73] line-clamp-1">{t.course_title || '—'}</span>
                    <span className="text-[12px] text-[#6E6E73]">₹{t.gross_amount.toLocaleString('en-IN')}</span>
                    <span className="text-[12px] font-semibold text-[#28C840]">₹{t.net_amount.toLocaleString('en-IN')}</span>
                    <span className={`inline-flex items-center font-[DM_Sans] font-semibold text-[10px] rounded-full px-2 py-0.5 w-fit ${ss.bg} ${ss.text}`}>{ss.label}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-[rgba(0,0,0,0.06)]">
            <span className="text-[12px] text-[#AEAEB2]">
              Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-1.5 text-[12px] text-[#1D1D1F] hover:bg-[#F5F5F7] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-3 h-3" />
                Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-1.5 text-[12px] text-[#1D1D1F] hover:bg-[#F5F5F7] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </MacCard>
      )}

      {/* ─── PAYOUT SETTINGS DRAWER ─── */}
      <PayoutSettingsForm
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        userId={userId}
        instructorProfile={profile}
        onSaved={handleSettingsSaved}
      />

      {/* ─── REQUEST PAYOUT MODAL ─── */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-xl w-full max-w-sm">
            <div className="p-6">
              {/* traffic lights */}
              <div className="flex items-center gap-1.5 mb-4">
                <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
                <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
                <div className="h-2 w-2 rounded-full bg-[#28C840]" />
              </div>

              <h2 className="font-bold text-[18px] text-[#1D1D1F]">Request Payout</h2>

              <div className="bg-[#F5F5F7] rounded-xl p-4 mt-4">
                <div className="text-[12px] text-[#AEAEB2] mb-1">Available</div>
                <div className="font-bold text-[20px] text-[#1D1D1F]">₹{stats.pendingBalance.toLocaleString('en-IN')}</div>
              </div>

              {profile?.payout_method ? (
                <div className="mt-4 text-[12px] text-[#6E6E73]">
                  Payout via{' '}
                  <span className="font-semibold text-[#1D1D1F] capitalize">{profile.payout_method === 'bank' ? 'Bank Transfer' : profile.payout_method === 'upi' ? 'UPI' : 'PayPal'}</span>
                  {profile.payout_details?.upi_id && (
                    <span className="ml-1 text-[#AEAEB2]">({profile.payout_details.upi_id})</span>
                  )}
                  {profile.payout_details?.account_holder_name && (
                    <span className="ml-1 text-[#AEAEB2]">— {profile.payout_details.account_holder_name}</span>
                  )}
                </div>
              ) : (
                <button
                  className="mt-4 text-[13px] text-[#FF5F57] font-medium"
                  onClick={() => { setShowPayoutModal(false); setShowSettings(true); }}
                >
                  Set up payout method first →
                </button>
              )}

              <div className="mt-4">
                <label className="block text-[12px] font-medium text-[#1D1D1F] mb-1.5">
                  Amount to withdraw (₹)
                </label>
                <input
                  type="number"
                  min={100}
                  max={stats.pendingBalance}
                  value={payoutAmount}
                  onChange={e => setPayoutAmount(Math.min(stats.pendingBalance, Number(e.target.value)))}
                  className="w-full border border-[rgba(0,0,0,0.1)] rounded-xl px-4 py-2.5 text-[13px] text-[#1D1D1F] bg-[#F5F5F7] focus:outline-none focus:border-[#1D1D1F]"
                />
              </div>

              <div className="mt-4 bg-[#FFF8EC] rounded-xl p-3 flex items-start gap-2">
                <Info className="w-4 h-4 text-[#FEBC2E] flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-[#FEBC2E]">
                  Payouts are typically processed within 3-5 business days.
                </p>
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setShowPayoutModal(false)}
                className="flex-1 border border-[rgba(0,0,0,0.1)] rounded-full py-2.5 text-[13px] font-medium text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitPayoutRequest}
                disabled={payoutLoading || !profile?.payout_method || payoutAmount < 100}
                className="flex-1 bg-[#1D1D1F] text-white rounded-full py-2.5 text-[13px] font-bold hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {payoutLoading ? 'Submitting...' : `Request ₹${payoutAmount.toLocaleString('en-IN')}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
