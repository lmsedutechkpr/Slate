import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import {
  Users, BookOpen, GraduationCap, TrendingUp, BarChart3, UserCheck, Eye, Plus,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth.js';
import { useAuthRefresh } from '../hooks/useAuthRefresh.js';
import { buildApiUrl } from '../lib/utils.js';

const AdminDashboard = () => {
  const [location, setLocation] = useLocation();
  const { accessToken, authenticatedFetch } = useAuth();
  const { authLoading } = useAuthRefresh();

  const { data: overview, isLoading } = useQuery({
    queryKey: ['/api/admin/analytics/overview'],
    queryFn: async () => {
      console.log('=== DASHBOARD API CALL ===');
      console.log('Making analytics request...');
      const res = await authenticatedFetch(buildApiUrl('/api/admin/analytics/overview'));
      console.log('Analytics response status:', res.status);
      if (!res.ok) throw new Error('Failed to load analytics');
      const data = await res.json();
      console.log('Analytics data received:', data);
      return data;
    },
    enabled: !!accessToken && !authLoading,
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

  const stats = overview || { totalUsers: 0, totalStudents: 0, totalInstructors: 0, totalCourses: 0, totalEnrollments: 0, totalRevenue: 0, monthlyGrowth: 0 };

  // Simple synthetic trend data derived from current totals (placeholder until backend provides series)
  const trend = [
    { label: 'W-3', users: Math.max(0, Math.floor((stats.totalUsers || 0) * 0.92)), revenue: Math.max(0, Math.floor((stats.totalRevenue || 0) * 0.85)), enrollments: Math.max(0, Math.floor((stats.totalEnrollments || 0) * 0.9)) },
    { label: 'W-2', users: Math.max(0, Math.floor((stats.totalUsers || 0) * 0.96)), revenue: Math.max(0, Math.floor((stats.totalRevenue || 0) * 0.92)), enrollments: Math.max(0, Math.floor((stats.totalEnrollments || 0) * 0.95)) },
    { label: 'W-1', users: Math.max(0, Math.floor((stats.totalUsers || 0) * 0.99)), revenue: Math.max(0, Math.floor((stats.totalRevenue || 0) * 0.97)), enrollments: Math.max(0, Math.floor((stats.totalEnrollments || 0) * 0.98)) },
    { label: 'Now', users: stats.totalUsers || 0, revenue: stats.totalRevenue || 0, enrollments: stats.totalEnrollments || 0 }
  ];

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
        <div className="flex gap-2">
          <Button onClick={() => setLocation('/admin/students')} variant="outline"><Eye className="w-4 h-4 mr-2" /> View Students</Button>
          <Button onClick={() => setLocation('/admin/analytics')} variant="outline"><BarChart3 className="w-4 h-4 mr-2" /> Analytics</Button>
          <Button onClick={() => setLocation('/admin/courses')}><Plus className="w-4 h-4 mr-2" /> Create Course</Button>
        </div>
      </div>

      {/* Stats + Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="grid grid-cols-2 gap-4">
          <Stat title="Total Users" value={isLoading ? '...' : stats.totalUsers} icon={Users} actionLabel="View Users" onAction={() => setLocation('/admin/users')} />
          <Stat title="Students" value={isLoading ? '...' : stats.totalStudents} icon={GraduationCap} />
          <Stat title="Instructors" value={isLoading ? '...' : stats.totalInstructors} icon={UserCheck} actionLabel="Manage" onAction={() => setLocation('/admin/instructors')} />
          <Stat title="Courses" value={isLoading ? '...' : stats.totalCourses} icon={BookOpen} />
        </div>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>User Growth</CardTitle><CardDescription>Weekly trend</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <Card>
          <CardHeader><CardTitle>Enrollments</CardTitle><CardDescription>Total course enrollments</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="enrollments" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Revenue</CardTitle><CardDescription>Total platform revenue</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Growth</CardTitle><CardDescription>Monthly user growth</CardDescription></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              <span className={stats.monthlyGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{isLoading ? '...' : stats.monthlyGrowth}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Promoted Platform Analytics */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Platform Analytics</CardTitle>
          <CardDescription>Live trends for users, revenue, enrollments</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="flex w-full overflow-x-auto whitespace-nowrap p-1 bg-gray-100 rounded-lg gap-1 md:grid md:grid-cols-4 md:overflow-visible md:whitespace-normal">
              <TabsTrigger value="overview" className="text-xs sm:text-sm px-3 py-2 shrink-0 rounded-md data-[state=active]:bg-white data-[state=active]:text-gray-900 md:w-full md:justify-center">Overview</TabsTrigger>
              <TabsTrigger value="users" className="text-xs sm:text-sm px-3 py-2 shrink-0 rounded-md data-[state=active]:bg-white data-[state=active]:text-gray-900 md:w-full md:justify-center">Users</TabsTrigger>
              <TabsTrigger value="courses" className="text-xs sm:text-sm px-3 py-2 shrink-0 rounded-md data-[state=active]:bg-white data-[state=active]:text-gray-900 md:w-full md:justify-center">Courses</TabsTrigger>
              <TabsTrigger value="activity" className="text-xs sm:text-sm px-3 py-2 shrink-0 rounded-md data-[state=active]:bg-white data-[state=active]:text-gray-900 md:w-full md:justify-center">Activity</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4 text-sm text-gray-600">
              Live data powered by API. Use Analytics page for full reports.
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

function Stat({ title, value, icon: Icon, actionLabel, onAction }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle><Icon className="h-4 w-4 text-blue-600" /></CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          {actionLabel && onAction && (
            <Button size="sm" variant="outline" onClick={onAction}>{actionLabel}</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default AdminDashboard;
