'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Download, IndianRupee, TrendingUp, Users } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import PlatformGrowthChart from './PlatformGrowthChart';
import RevenueBreakdownChart from './RevenueBreakdownChart';
import UserGrowthChart from './UserGrowthChart';
import ContentPerformanceChart from './ContentPerformanceChart';
import GeographyInsights from './GeographyInsights';

type Row = Record<string, any>;

type PeriodKey = '30d' | '3m' | '6m' | '12m' | 'all';

function monthKeyFromDate(dt: Date) {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, (m || 1) - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
}

function toDate(v: any) {
  const d = new Date(v || '');
  return Number.isNaN(d.getTime()) ? null : d;
}

function WindowCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
      <div className="flex h-10 items-center justify-between border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-4">
        <div className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
          <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
          <span className="h-2 w-2 rounded-full bg-[#28C840]" />
        </div>
        <p className="text-[12px] font-semibold text-[#6E6E73]">{title}</p>
        <div className="w-8" />
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  growth,
  growthClass,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  growth: string;
  growthClass?: string;
}) {
  return (
    <WindowCard title={label}>
      <div className="mb-2 text-[#6E6E73]">{icon}</div>
      <p className="text-[26px] font-bold text-[#1D1D1F]">{value}</p>
      <p className="mt-1 text-[12px] text-[#6E6E73]">{label}</p>
      <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${growthClass || 'bg-[#EDFAF0] text-[#28C840]'}`}>
        {growth}
      </span>
    </WindowCard>
  );
}

function growthPct(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export default function AnalyticsPageClient({
  rawUsers,
  rawRevenueOrders,
  rawEnrollments,
  topCourses,
  topSellers,
  topInstructors,
  rawCategoryCourses,
  rawAddresses,
  rawAllProfiles,
  totalCoursesCount,
  totalEnrollmentsCount,
  revenueBreakdown,
}: {
  rawUsers: Row[];
  rawRevenueOrders: Row[];
  rawEnrollments: Row[];
  topCourses: Row[];
  topSellers: Row[];
  topInstructors: Row[];
  rawCategoryCourses: Row[];
  rawAddresses: Row[];
  rawAllProfiles: Row[];
  totalCoursesCount: number;
  totalEnrollmentsCount: number;
  revenueBreakdown: {
    courseRevenue: number;
    productRevenue: number;
    platformFees: number;
  };
}) {
  const router = useRouter();
  const [period, setPeriod] = useState<PeriodKey>('12m');

  const periodStart = useMemo(() => {
    const now = new Date();
    if (period === 'all') return new Date('2000-01-01T00:00:00.000Z');
    if (period === '30d') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (period === '3m') {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      return d;
    }
    if (period === '6m') {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 6);
      return d;
    }
    const d = new Date(now);
    d.setMonth(d.getMonth() - 12);
    return d;
  }, [period]);

  const userRows = useMemo(
    () => rawUsers.filter((r) => {
      const d = toDate(r.created_at);
      return d ? d >= periodStart : false;
    }),
    [rawUsers, periodStart],
  );

  const revenueRows = useMemo(
    () => rawRevenueOrders.filter((r) => {
      const d = toDate(r.created_at);
      return d ? d >= periodStart : false;
    }),
    [rawRevenueOrders, periodStart],
  );

  const enrollmentRows = useMemo(
    () => rawEnrollments.filter((r) => {
      const d = toDate(r.created_at || r.enrolled_at);
      return d ? d >= periodStart : false;
    }),
    [rawEnrollments, periodStart],
  );

  const monthlyKeys = useMemo(() => {
    const map = new Set<string>();
    [...userRows, ...revenueRows, ...enrollmentRows].forEach((r) => {
      const d = toDate(r.created_at || r.enrolled_at);
      if (d) map.add(monthKeyFromDate(d));
    });
    const keys = Array.from(map).sort();
    return keys;
  }, [userRows, revenueRows, enrollmentRows]);

  const growthSeries = useMemo(() => {
    return monthlyKeys.map((key) => {
      const usersInMonth = userRows.filter((u) => {
        const d = toDate(u.created_at);
        return d ? monthKeyFromDate(d) === key : false;
      });

      const students = usersInMonth.filter((u) => String(u.role || '').toLowerCase() === 'student').length;
      const instructors = usersInMonth.filter((u) => String(u.role || '').toLowerCase() === 'instructor').length;
      const sellers = usersInMonth.filter((u) => String(u.role || '').toLowerCase() === 'seller').length;

      const monthRevenueRows = revenueRows.filter((o) => {
        const d = toDate(o.created_at);
        return d ? monthKeyFromDate(d) === key : false;
      });

      const monthCourseRevenue = enrollmentRows.reduce((sum, e) => {
        const d = toDate(e.created_at || e.enrolled_at);
        if (!d || monthKeyFromDate(d) !== key) return sum;
        const course = e.courses;
        if (!course || course.is_free) return sum;
        return sum + Number(course.discounted_price ?? course.price ?? 0);
      }, 0);

      const enrollments = enrollmentRows.filter((e) => {
        const d = toDate(e.created_at || e.enrolled_at);
        return d ? monthKeyFromDate(d) === key : false;
      }).length;

      return {
        month: monthLabel(key),
        students,
        instructors,
        sellers,
        users: students + instructors + sellers,
        revenue: monthRevenueRows.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) + monthCourseRevenue,
        orderCount: monthRevenueRows.length,
        enrollments,
      };
    });
  }, [monthlyKeys, userRows, revenueRows, enrollmentRows]);

  const totalRevenue = useMemo(
    () => Number(revenueBreakdown.courseRevenue || 0) + Number(revenueBreakdown.productRevenue || 0) + Number(revenueBreakdown.platformFees || 0),
    [revenueBreakdown],
  );
  const orderRevenue = useMemo(() => revenueRows.reduce((sum, r) => sum + Number(r.total_amount || 0), 0), [revenueRows]);
  const totalUsers = useMemo(() => rawAllProfiles.length, [rawAllProfiles.length]);
  const totalOrders = useMemo(() => revenueRows.length, [revenueRows.length]);

  const roleTotals = useMemo(() => {
    const students = rawAllProfiles.filter((u) => String(u.role || '').toLowerCase() === 'student').length;
    const instructors = rawAllProfiles.filter((u) => String(u.role || '').toLowerCase() === 'instructor').length;
    const sellers = rawAllProfiles.filter((u) => String(u.role || '').toLowerCase() === 'seller').length;
    return { students, instructors, sellers, total: students + instructors + sellers };
  }, [rawAllProfiles]);

  const courseRevenue = Number(revenueBreakdown.courseRevenue || 0);
  const productRevenue = Number(revenueBreakdown.productRevenue || 0);
  const platformFees = Number(revenueBreakdown.platformFees || 0);

  const categoryData = useMemo(() => {
    const map = new Map<string, { category: string; courses: number; enrollments: number }>();
    rawCategoryCourses.forEach((c) => {
      const cat = c.categories?.name || 'Uncategorized';
      if (!map.has(cat)) map.set(cat, { category: cat, courses: 0, enrollments: 0 });
      const row = map.get(cat)!;
      row.courses += 1;
      row.enrollments += Number(c.total_enrolled || 0);
    });
    return Array.from(map.values()).sort((a, b) => b.enrollments - a.enrollments);
  }, [rawCategoryCourses]);

  const geoData = useMemo(() => {
    const statesMap = new Map<string, number>();
    const citiesMap = new Map<string, { count: number; state: string }>();

    rawAddresses.forEach((a) => {
      const state = String(a.state || 'Unknown').trim() || 'Unknown';
      const city = String(a.city || 'Unknown').trim() || 'Unknown';
      statesMap.set(state, (statesMap.get(state) || 0) + 1);
      const key = `${city}@@${state}`;
      const prev = citiesMap.get(key) || { count: 0, state };
      citiesMap.set(key, { count: prev.count + 1, state });
    });

    const states = Array.from(statesMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const cities = Array.from(citiesMap.entries())
      .map(([key, value]) => ({ name: key.split('@@')[0], state: value.state, count: value.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return { states, cities };
  }, [rawAddresses]);

  const stats = useMemo(() => {
    const middle = Math.floor(growthSeries.length / 2);
    const firstHalfRevenue = growthSeries.slice(0, middle).reduce((s, p) => s + Number(p.revenue || 0), 0);
    const secondHalfRevenue = growthSeries.slice(middle).reduce((s, p) => s + Number(p.revenue || 0), 0);

    const firstHalfUsers = growthSeries.slice(0, middle).reduce((s, p) => s + Number(p.users || 0), 0);
    const secondHalfUsers = growthSeries.slice(middle).reduce((s, p) => s + Number(p.users || 0), 0);

    const returnRate = totalOrders > 0 ? (0 / totalOrders) * 100 : 0;

    return {
      totalRevenue,
      totalUsers,
      totalEnrollments: totalEnrollmentsCount,
      totalCourses: totalCoursesCount,
      avgOrderValue: totalOrders > 0 ? orderRevenue / totalOrders : 0,
      revenueGrowth: growthPct(secondHalfRevenue, firstHalfRevenue),
      userGrowth: growthPct(secondHalfUsers, firstHalfUsers),
      enrollGrowth: growthPct(
        growthSeries.slice(middle).reduce((s, p) => s + Number(p.enrollments || 0), 0),
        growthSeries.slice(0, middle).reduce((s, p) => s + Number(p.enrollments || 0), 0),
      ),
      returnRate,
    };
  }, [growthSeries, totalRevenue, totalUsers, totalOrders, totalEnrollmentsCount, totalCoursesCount, orderRevenue]);

  const exportReport = () => {
    const lines: string[] = [];

    lines.push('Section,Metric,Value');
    lines.push(`Platform KPIs,Total Revenue,${Math.round(stats.totalRevenue)}`);
    lines.push(`Platform KPIs,Total Users,${stats.totalUsers}`);
    lines.push(`Platform KPIs,Total Enrollments,${stats.totalEnrollments}`);
    lines.push(`Platform KPIs,Total Courses,${stats.totalCourses}`);
    lines.push(`Platform KPIs,Avg Order Value,${Math.round(stats.avgOrderValue)}`);

    lines.push('');
    lines.push('Monthly Revenue,Month,Revenue,OrderCount');
    growthSeries.forEach((m) => lines.push(`Monthly Revenue,${m.month},${Math.round(m.revenue || 0)},${m.orderCount || 0}`));

    lines.push('');
    lines.push('User Growth,Month,Students,Instructors,Sellers,Total');
    growthSeries.forEach((m) => lines.push(`User Growth,${m.month},${m.students || 0},${m.instructors || 0},${m.sellers || 0},${m.users || 0}`));

    lines.push('');
    lines.push('Top Courses,Title,Enrolled,Rating,Reviews');
    topCourses.forEach((c) => lines.push(`Top Courses,${String(c.title || '').replace(/,/g, ' ')},${c.total_enrolled || 0},${c.avg_rating || 0},${c.total_reviews || 0}`));

    lines.push('');
    lines.push('Top Instructors,Name,Students,Courses,Rating');
    topInstructors.forEach((i) => lines.push(`Top Instructors,${(i.profiles?.full_name || 'Unknown').replace(/,/g, ' ')},${i.total_students || 0},${i.total_courses || 0},${i.avg_rating || 0}`));

    lines.push('');
    lines.push('Top Sellers,Store,Revenue,Sales,Rating');
    topSellers.forEach((s) => lines.push(`Top Sellers,${String(s.store_name || '').replace(/,/g, ' ')},${s.total_revenue || 0},${s.total_sales || 0},${s.avg_rating || 0}`));

    lines.push('');
    lines.push('Category Performance,Category,Courses,Enrollments');
    categoryData.forEach((c) => lines.push(`Category Performance,${String(c.category || '').replace(/,/g, ' ')},${c.courses},${c.enrollments}`));

    lines.push('');
    lines.push('Geographic Data,Type,Name,State,Count');
    geoData.states.forEach((s) => lines.push(`Geographic Data,State,${s.name},,${s.count}`));
    geoData.cities.forEach((c) => lines.push(`Geographic Data,City,${c.name},${c.state || ''},${c.count}`));

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `slate-platform-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="font-[DM_Sans]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold text-[#1D1D1F]">Analytics</h1>
          <p className="mt-1 text-[13px] text-[#6E6E73]">Platform-wide performance insights</p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(v: string) => setPeriod(v as PeriodKey)}>
            <SelectTrigger className="h-10 w-[180px] rounded-full bg-white text-[13px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="3m">Last 3 months</SelectItem>
              <SelectItem value="6m">Last 6 months</SelectItem>
              <SelectItem value="12m">Last 12 months</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>

          <button
            onClick={exportReport}
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(0,0,0,0.1)] bg-white px-4 py-2 text-[13px] font-semibold text-[#1D1D1F]"
          >
            <Download className="h-4 w-4" /> Export Report
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<IndianRupee className="h-4 w-4" />}
          value={`₹${Math.round(stats.totalRevenue).toLocaleString('en-IN')}`}
          label="Platform Revenue"
          growth={`${stats.revenueGrowth >= 0 ? '+' : ''}${stats.revenueGrowth.toFixed(1)}% growth`}
          growthClass="bg-[#EDFAF0] text-[#28C840]"
        />
        <StatCard
          icon={<Users className="h-4 w-4" />}
          value={stats.totalUsers.toLocaleString('en-IN')}
          label="Total Users"
          growth={`${stats.userGrowth >= 0 ? '+' : ''}${stats.userGrowth.toFixed(1)}% this period`}
        />
        <StatCard
          icon={<BookOpen className="h-4 w-4" />}
          value={stats.totalEnrollments.toLocaleString('en-IN')}
          label="Course Enrollments"
          growth={`${stats.enrollGrowth >= 0 ? '+' : ''}${stats.enrollGrowth.toFixed(1)}% this period`}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          value={`₹${Math.round(stats.avgOrderValue).toLocaleString('en-IN')}`}
          label="Avg Order Value"
          growth={`${stats.revenueGrowth >= 0 ? '+' : ''}${stats.revenueGrowth.toFixed(1)}% vs last period`}
          growthClass={stats.returnRate > 5 ? 'bg-[#FFF0EF] text-[#FF5F57]' : 'bg-[#EDFAF0] text-[#28C840]'}
        />
      </div>

      <div className="mb-6">
        <PlatformGrowthChart points={growthSeries} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <RevenueBreakdownChart
          total={totalRevenue}
          courseRevenue={courseRevenue}
          productRevenue={productRevenue}
          fees={platformFees}
        />
        <UserGrowthChart points={growthSeries.map((p) => ({ month: p.month, students: p.students || 0, instructors: p.instructors || 0, sellers: p.sellers || 0 }))} roleTotals={roleTotals} />
        <ContentPerformanceChart categories={categoryData} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <WindowCard title="Top Courses">
          <div className="space-y-1">
            {topCourses.slice(0, 8).map((course, idx) => (
              <button
                key={course.id || `${idx}`}
                className="flex w-full cursor-pointer items-center gap-3 border-b border-[rgba(0,0,0,0.05)] py-2.5 text-left hover:bg-[#F5F5F7]"
                onClick={() => router.push('/admin/content')}
              >
                <p className="w-5 text-[11px] font-semibold text-[#AEAEB2]">#{idx + 1}</p>
                <img src={course.thumbnail_url || '/placeholder.png'} alt="course" className="h-8 w-8 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-[#1D1D1F]">{course.title || 'Course'}</p>
                  <p className="truncate text-[10px] text-[#AEAEB2]">{course.course_instructors?.[0]?.profiles?.full_name || 'Instructor'}</p>
                </div>
                <p className="text-[11px] font-semibold text-[#1D1D1F]">{Number(course.total_enrolled || 0).toLocaleString('en-IN')}</p>
              </button>
            ))}
          </div>
        </WindowCard>

        <WindowCard title="Top Instructors">
          <div className="space-y-1">
            {topInstructors.slice(0, 8).map((inst, idx) => (
              <button
                key={inst.user_id || `${idx}`}
                className="flex w-full cursor-pointer items-center gap-3 border-b border-[rgba(0,0,0,0.05)] py-2.5 text-left hover:bg-[#F5F5F7]"
                onClick={() => router.push('/admin/users')}
              >
                <p className="w-5 text-[11px] font-semibold text-[#AEAEB2]">#{idx + 1}</p>
                <img src={inst.profiles?.avatar_url || '/avatar-placeholder.png'} alt="avatar" className="h-8 w-8 rounded-full object-cover bg-[#F5F5F7]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-[#1D1D1F]">{inst.profiles?.full_name || 'Instructor'}</p>
                  <p className="truncate text-[10px] text-[#AEAEB2]">{Number(inst.avg_rating || 0).toFixed(1)}★</p>
                </div>
                <p className="text-[11px] font-semibold text-[#1D1D1F]">{Number(inst.total_students || 0).toLocaleString('en-IN')}</p>
              </button>
            ))}
          </div>
        </WindowCard>

        <WindowCard title="Top Sellers">
          <div className="space-y-1">
            {topSellers.slice(0, 8).map((seller, idx) => (
              <button
                key={seller.user_id || `${idx}`}
                className="flex w-full cursor-pointer items-center gap-3 border-b border-[rgba(0,0,0,0.05)] py-2.5 text-left hover:bg-[#F5F5F7]"
                onClick={() => router.push('/admin/users')}
              >
                <p className="w-5 text-[11px] font-semibold text-[#AEAEB2]">#{idx + 1}</p>
                <img src={seller.profiles?.avatar_url || '/avatar-placeholder.png'} alt="avatar" className="h-8 w-8 rounded-full object-cover bg-[#F5F5F7]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-[#1D1D1F]">{seller.store_name || seller.profiles?.full_name || 'Seller'}</p>
                  <p className="truncate text-[10px] text-[#AEAEB2]">{Number(seller.total_sales || 0)} sales</p>
                </div>
                <p className="text-[11px] font-semibold text-[#1D1D1F]">₹{Math.round(Number(seller.total_revenue || 0)).toLocaleString('en-IN')}</p>
              </button>
            ))}
          </div>
        </WindowCard>
      </div>

      <GeographyInsights states={geoData.states} cities={geoData.cities} />
    </div>
  );
}
