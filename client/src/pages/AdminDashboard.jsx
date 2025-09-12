import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import {
  Users, BookOpen, GraduationCap, TrendingUp, BarChart3, UserCheck, Eye, Plus,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth.js';
import { useAuthRefresh } from '../hooks/useAuthRefresh.js';
import { buildApiUrl } from '../lib/utils.js';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { subscribe } from '@/lib/realtime.js';
import { useState, useMemo } from 'react';

const AdminDashboard = () => {
  const [location, setLocation] = useLocation();
  const { accessToken, authenticatedFetch } = useAuth();
  const { authLoading } = useAuthRefresh();
  const queryClient = useQueryClient();
  const [timeRange, setTimeRange] = useState('30d');

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

  // Secondary datasets
  const { data: studentsSample } = useQuery({
    queryKey: ['/api/admin/analytics/students', { page: 1, limit: 50 }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '50');
      const res = await authenticatedFetch(buildApiUrl(`/api/admin/analytics/students?${params.toString()}`));
      if (!res.ok) throw new Error('Failed to load students');
      return res.json();
    },
    enabled: !!accessToken && !authLoading
  });

  const { data: coursesData } = useQuery({
    queryKey: ['/api/courses', { page: 1, limit: 50 }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '50');
      const res = await authenticatedFetch(buildApiUrl(`/api/courses?${params.toString()}`));
      if (!res.ok) throw new Error('Failed to load courses');
      return res.json();
    },
    enabled: !!accessToken && !authLoading
  });

  // Realtime: invalidate overview on updates
  useEffect(() => {
    let unsub = () => {};
    (async () => {
      unsub = await subscribe('api:update', (evt) => {
        if (evt && evt.path && evt.path.startsWith('/api')) {
          queryClient.invalidateQueries({ queryKey: ['/api/admin/analytics/overview'] });
        }
      });
    })();
    return () => { try { unsub(); } catch {} };
  }, [queryClient]);

  // Debug: Log query state
  console.log('=== DASHBOARD QUERY STATE ===');
  console.log('accessToken:', !!accessToken);
  console.log('authLoading:', authLoading);
  console.log('query enabled:', !!accessToken && !authLoading);
  console.log('isLoading:', isLoading);
  console.log('overview data:', overview);

  const stats = overview || { totalUsers: 0, totalStudents: 0, totalInstructors: 0, totalCourses: 0, totalEnrollments: 0, totalRevenue: 0, monthlyGrowth: 0, activeUsers: 0 };

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
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-sm lg:text-base text-gray-600">Monitor performance and act quickly</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setLocation('/admin/courses')}><Plus className="w-4 h-4 mr-2" /> Create Course</Button>
        </div>
      </div>

      {/* Row 1: KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Stat title="Total Revenue" value={isLoading ? '...' : `₹${(stats.totalRevenue || 0).toLocaleString()}`} icon={TrendingUp} actionLabel="Sales Report" onAction={() => setLocation('/admin/analytics')} />
        <Stat title="Total Enrollments" value={isLoading ? '...' : stats.totalEnrollments} icon={BookOpen} />
        <Stat title="Active Students" value={isLoading ? '...' : stats.activeUsers} icon={Users} actionLabel="View Students" onAction={() => setLocation('/admin/students')} />
        <Stat title="Total Instructors" value={isLoading ? '...' : stats.totalInstructors} icon={UserCheck} actionLabel="Manage" onAction={() => setLocation('/admin/instructors')} />
      </div>

      {/* Row 2: Primary Visualizations with global date filter */}
      <div className="flex items-center justify-end">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Date Range" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="12m">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Revenue Trends</CardTitle><CardDescription>Trend over selected period</CardDescription></CardHeader>
          <CardContent>
            {trend.length === 0 ? (
              <div className="text-center text-sm text-gray-500 py-12">No revenue data available for this period</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>User Growth</CardTitle><CardDescription>New sign-ups trend</CardDescription></CardHeader>
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

      {/* Row 3: Secondary lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Recent Enrollments */}
        <Card>
          <CardHeader><CardTitle>Recent Enrollments</CardTitle><CardDescription>Last 10 sign-ups</CardDescription></CardHeader>
          <CardContent>
            {studentsSample?.students?.length ? (
              <ul className="divide-y">
                {studentsSample.students
                  .slice(0, 10)
                  .map((s) => (
                  <li key={s._id} className="py-2 text-sm flex items-center justify-between">
                    <span className="truncate mr-2">{s.profile?.firstName || s.username}</span>
                    <span className="text-gray-500">{new Date(s.analytics?.lastActivity || s.createdAt).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-500 text-center py-8">No recent enrollments</div>
            )}
          </CardContent>
        </Card>

        {/* Course Performance */}
        <Card>
          <CardHeader><CardTitle>Course Performance</CardTitle><CardDescription>Top courses by enrollments</CardDescription></CardHeader>
          <CardContent>
            {Array.isArray(coursesData?.courses) && coursesData.courses.length > 0 ? (
              <div className="text-sm">
                <div className="grid grid-cols-3 pb-2 border-b text-gray-500">
                  <div>Course</div>
                  <div>Instructor</div>
                  <div className="text-right">Enrollments</div>
                </div>
                {coursesData.courses
                  .slice(0, 5)
                  .map((c) => (
                    <div key={c._id} className="grid grid-cols-3 py-2 border-b last:border-0">
                      <div className="truncate pr-2">{c.title}</div>
                      <div className="truncate pr-2">{c.assignedInstructor?.profile?.firstName || '—'}</div>
                      <div className="text-right">{c.enrollmentCount ?? '—'}</div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 text-center py-8">No course performance data</div>
            )}
          </CardContent>
        </Card>

        {/* Platform Activity */}
        <Card>
          <CardHeader><CardTitle>Platform Activity</CardTitle><CardDescription>Latest events</CardDescription></CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500 text-center py-8">No recent platform activity</div>
          </CardContent>
        </Card>
      </div>

      {/* Removed separate Platform Analytics section; detailed reports live on Analytics page */}
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
