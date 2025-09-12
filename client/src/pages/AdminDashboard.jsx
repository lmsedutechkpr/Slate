import { useLocation } from 'wouter';
import { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users, BookOpen, GraduationCap, TrendingUp, BarChart3, UserCheck, Eye, Plus,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../hooks/useAuth.js';
import { useAuthRefresh } from '../hooks/useAuthRefresh.js';
import { buildApiUrl } from '../lib/utils.js';

const AdminDashboard = () => {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { accessToken, authenticatedFetch } = useAuth();
  const { authLoading } = useAuthRefresh();

  const [range, setRange] = useState('30d');
  const { data: overview, isLoading } = useQuery({
    queryKey: ['/api/admin/analytics/overview', range],
    queryFn: async () => {
      console.log('=== DASHBOARD API CALL ===');
      console.log('Making analytics request...');
      const res = await authenticatedFetch(buildApiUrl(`/api/admin/analytics/overview?range=${range}`));
      console.log('Analytics response status:', res.status);
      if (!res.ok) throw new Error('Failed to load analytics');
      const data = await res.json();
      console.log('Analytics data received:', data);
      return data;
    },
    enabled: !!accessToken && !authLoading,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: 1000
  });

  // Debug: Log query state
  console.log('=== DASHBOARD QUERY STATE ===');
  console.log('accessToken:', !!accessToken);
  console.log('authLoading:', authLoading);
  console.log('query enabled:', !!accessToken && !authLoading);
  console.log('isLoading:', isLoading);
  console.log('overview data:', overview);

  const stats = overview || { totalUsers: 0, totalStudents: 0, totalInstructors: 0, totalCourses: 0, totalEnrollments: 0, totalRevenue: 0, monthlyGrowth: 0, revenueByMonth: [], dau: [], topCourses: [] };

  const revenueSeries = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}`, label: d.toLocaleString('default', { month: 'short' }) + ' ' + String(d.getFullYear()).slice(2), total: 0 });
    }
    const map = new Map(months.map(m => [m.key, m]));
    (stats.revenueByMonth || []).forEach(r => {
      const key = `${r._id?.y}-${String(r._id?.m).padStart(2,'0')}`;
      const entry = map.get(key);
      if (entry) entry.total = r.total || 0;
    });
    return months;
  }, [stats.revenueByMonth]);

  const dauSeries = useMemo(() => {
    return (stats.dau || []).map(d => ({
      date: `${d.date?.y}-${String(d.date?.m).padStart(2,'0')}-${String(d.date?.d).padStart(2,'0')}`,
      count: d.count || 0
    }));
  }, [stats.dau]);

  const topCoursesSeries = useMemo(() => (stats.topCourses || []).map(t => ({ name: t.title, enrollments: t.enrollments })), [stats.topCourses]);

  // Show loading state while authentication is in progress
  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Welcome to Admin Dashboard</h1>
          <p className="text-sm lg:text-base text-gray-600">Monitor platform performance and manage your learning ecosystem</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={range} onValueChange={(v) => {
            setRange(v);
          }}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => {
            const rows = [{
              totalUsers: stats.totalUsers,
              totalStudents: stats.totalStudents,
              totalInstructors: stats.totalInstructors,
              totalCourses: stats.totalCourses,
              totalEnrollments: stats.totalEnrollments,
              totalRevenue: stats.totalRevenue,
              monthlyGrowth: stats.monthlyGrowth,
            }];
            const header = Object.keys(rows[0] || {}).join(',');
            const body = rows.map(r => Object.values(r).join(',')).join('\n');
            const csv = header + '\n' + body;
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `overview-${range}.csv`; a.click(); URL.revokeObjectURL(url);
          }}>Export CSV</Button>
          <Button variant="outline" onClick={() => {
            import('jspdf').then(({ default: jsPDF }) => {
              const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
              doc.setFontSize(16);
              doc.text('Admin Overview', 40, 40);
              doc.setFontSize(11);
              const lines = [
                `Total Users: ${stats.totalUsers}`,
                `Students: ${stats.totalStudents}`,
                `Instructors: ${stats.totalInstructors}`,
                `Courses: ${stats.totalCourses}`,
                `Enrollments: ${stats.totalEnrollments}`,
                `Revenue: ₹${stats.totalRevenue}`,
              ];
              let y = 70;
              lines.forEach(line => { doc.text(line, 40, y); y += 18; });
              doc.save(`overview-${range}.pdf`);
            });
          }}>Export PDF</Button>
          <Button onClick={() => setLocation('/admin/analytics')} variant="outline"><BarChart3 className="w-4 h-4 mr-2" /> Analytics</Button>
          <Button onClick={() => setLocation('/admin/courses')}><Plus className="w-4 h-4 mr-2" /> Create Course</Button>
        </div>
      </div>

      {/* Stats Cards (clickable) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Stat title="Total Users" value={isLoading ? '...' : stats.totalUsers} icon={Users} onClick={() => setLocation('/admin/users')} color="text-blue-600" />
        <Stat title="Students" value={isLoading ? '...' : stats.totalStudents} icon={GraduationCap} onClick={() => setLocation('/admin/users?role=student')} color="text-blue-600" />
        <Stat title="Instructors" value={isLoading ? '...' : stats.totalInstructors} icon={UserCheck} onClick={() => setLocation('/admin/users?role=instructor')} color="text-blue-600" />
        <Stat title="Courses" value={isLoading ? '...' : stats.totalCourses} icon={BookOpen} onClick={() => setLocation('/admin/courses')} color="text-purple-600" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 lg:gap-6">
        <Card className="hover:shadow-md transition-shadow"><CardHeader><CardTitle>Enrollments</CardTitle><CardDescription>Total course enrollments</CardDescription></CardHeader><CardContent><div className="text-3xl font-bold text-blue-600">{isLoading ? '...' : stats.totalEnrollments}</div></CardContent></Card>
        <Card className="hover:shadow-md transition-shadow"><CardHeader><CardTitle>Revenue</CardTitle><CardDescription>Total platform revenue</CardDescription></CardHeader><CardContent><div className="text-3xl font-bold text-green-600">₹{isLoading ? '...' : stats.totalRevenue}</div><div className="mt-3 h-20"><ResponsiveContainer width="100%" height="100%"><LineChart data={revenueSeries}><XAxis dataKey="label" hide /><YAxis hide /><Tooltip /><Line type="monotone" dataKey="total" stroke="#16a34a" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div></CardContent></Card>
        <Card className="hover:shadow-md transition-shadow"><CardHeader><CardTitle>Orders</CardTitle><CardDescription>Total paid/refunded orders</CardDescription></CardHeader><CardContent><div className="text-3xl font-bold text-indigo-600">{isLoading ? '...' : (stats.ordersCount || 0)}</div></CardContent></Card>
        <Card className="hover:shadow-md transition-shadow"><CardHeader><CardTitle>DAU (30d)</CardTitle><CardDescription>Daily active users</CardDescription></CardHeader><CardContent><div className="h-20"><ResponsiveContainer width="100%" height="100%"><LineChart data={dauSeries}><XAxis dataKey="date" hide /><YAxis hide /><Tooltip /><Line type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div></CardContent></Card>
      </div>

      {/* Minimal analytics tabs retained - assume charts wired later */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Analytics</CardTitle>
          <CardDescription>Detailed insights and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="flex w-full overflow-x-auto whitespace-nowrap p-1 bg-gray-100 rounded-lg gap-1 md:grid md:grid-cols-4 md:overflow-visible md:whitespace-normal">
              <TabsTrigger value="overview" className="text-xs sm:text-sm px-3 py-2 shrink-0 rounded-md data-[state=active]:bg-white data-[state=active]:text-gray-900 md:w-full md:justify-center">Overview</TabsTrigger>
              <TabsTrigger value="users" className="text-xs sm:text-sm px-3 py-2 shrink-0 rounded-md data-[state=active]:bg-white data-[state=active]:text-gray-900 md:w-full md:justify-center">Users</TabsTrigger>
              <TabsTrigger value="courses" className="text-xs sm:text-sm px-3 py-2 shrink-0 rounded-md data-[state=active]:bg-white data-[state=active]:text-gray-900 md:w-full md:justify-center">Courses</TabsTrigger>
              <TabsTrigger value="activity" className="text-xs sm:text-sm px-3 py-2 shrink-0 rounded-md data-[state=active]:bg-white data-[state=active]:text-gray-900 md:w-full md:justify-center">Activity</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader><CardTitle>Revenue (12 mo)</CardTitle><CardDescription>Monthly revenue</CardDescription></CardHeader>
                  <CardContent className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={revenueSeries}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis /><Tooltip /><Bar dataKey="total" fill="#22c55e" /></BarChart></ResponsiveContainer></CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Top Courses</CardTitle><CardDescription>By enrollments (30d)</CardDescription></CardHeader>
                  <CardContent className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={topCoursesSeries}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={60} /><YAxis /><Tooltip /><Bar dataKey="enrollments" fill="#3b82f6" /></BarChart></ResponsiveContainer></CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Revenue Split</CardTitle><CardDescription>Platform vs Instructor payout</CardDescription></CardHeader>
                  <CardContent className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={[{name:'Platform', value: stats.platformRevenue || 0},{name:'Instructors', value: stats.instructorPayout || 0}]} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>{[{name:'Platform', value: stats.platformRevenue || 0},{name:'Instructors', value: stats.instructorPayout || 0}].map((_,i)=>(<Cell key={i} fill={i===0? '#16a34a':'#60a5fa'} />))}</Pie><Tooltip /></PieChart></ResponsiveContainer></CardContent>
                </Card>
                <Card className="md:col-span-2 lg:col-span-3">
                  <CardHeader><CardTitle>Conversion Funnel</CardTitle><CardDescription>Visitors → Enrollments → Orders (30d)</CardDescription></CardHeader>
                  <CardContent className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={[{stage:'Visitors', value: stats.funnel?.visitors || 0},{stage:'Enrollments', value: stats.funnel?.enrollments || 0},{stage:'Orders', value: stats.funnel?.orders || 0}]}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="stage" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#9333ea" /></BarChart></ResponsiveContainer></CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

function Stat({ title, value, icon: Icon, onClick, color = 'text-blue-600' }) {
  return (
    <Card onClick={onClick} className={`hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle><Icon className={`h-4 w-4 ${color}`} /></CardHeader>
      <CardContent><div className="text-2xl font-bold text-gray-900">{value}</div></CardContent>
    </Card>
  );
}

export default AdminDashboard;
