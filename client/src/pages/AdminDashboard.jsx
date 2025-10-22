import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { Link } from 'wouter';
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

  // Dummy data for students and courses
  const dummyStudentsSample = {
    students: [
      {
        _id: '1',
        username: 'alice_johnson',
        profile: { firstName: 'Alice', lastName: 'Johnson' },
        enrollments: [{ courseId: { title: 'Complete Web Development Bootcamp' } }],
        analytics: { lastActivity: '2024-01-20T15:30:00.000Z' },
        createdAt: '2024-01-20T00:00:00.000Z'
      },
      {
        _id: '2',
        username: 'bob_smith',
        profile: { firstName: 'Bob', lastName: 'Smith' },
        enrollments: [{ courseId: { title: 'React.js Complete Guide' } }],
        analytics: { lastActivity: '2024-01-19T14:20:00.000Z' },
        createdAt: '2024-01-19T00:00:00.000Z'
      },
      {
        _id: '3',
        username: 'charlie_brown',
        profile: { firstName: 'Charlie', lastName: 'Brown' },
        enrollments: [{ courseId: { title: 'Machine Learning with Python' } }],
        analytics: { lastActivity: '2024-01-18T16:45:00.000Z' },
        createdAt: '2024-01-18T00:00:00.000Z'
      },
      {
        _id: '4',
        username: 'diana_prince',
        profile: { firstName: 'Diana', lastName: 'Prince' },
        enrollments: [{ courseId: { title: 'Complete Web Development Bootcamp' } }],
        analytics: { lastActivity: '2024-01-17T11:15:00.000Z' },
        createdAt: '2024-01-17T00:00:00.000Z'
      },
      {
        _id: '5',
        username: 'eve_adams',
        profile: { firstName: 'Eve', lastName: 'Adams' },
        enrollments: [{ courseId: { title: 'React.js Complete Guide' } }],
        analytics: { lastActivity: '2024-01-16T09:30:00.000Z' },
        createdAt: '2024-01-16T00:00:00.000Z'
      }
    ]
  };

  const dummyCoursesData = {
    courses: [
      {
        _id: '1',
        title: 'Complete Web Development Bootcamp',
        enrollmentCount: 456,
        assignedInstructor: { profile: { firstName: 'John', lastName: 'Doe' } }
      },
      {
        _id: '2',
        title: 'React.js Complete Guide',
        enrollmentCount: 234,
        assignedInstructor: { profile: { firstName: 'Sarah', lastName: 'Wilson' } }
      },
      {
        _id: '3',
        title: 'Machine Learning with Python',
        enrollmentCount: 189,
        assignedInstructor: { profile: { firstName: 'Mike', lastName: 'Johnson' } }
      },
      {
        _id: '4',
        title: 'Node.js Backend Development',
        enrollmentCount: 156,
        assignedInstructor: { profile: { firstName: 'John', lastName: 'Doe' } }
      },
      {
        _id: '5',
        title: 'Data Science Fundamentals',
        enrollmentCount: 123,
        assignedInstructor: { profile: { firstName: 'Sarah', lastName: 'Wilson' } }
      }
    ]
  };

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

  // Use dummy data if API data is not available
  const finalStudentsSample = studentsSample || dummyStudentsSample;
  const finalCoursesData = coursesData || dummyCoursesData;

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

  // Dummy data for demonstration
  const dummyStats = {
    totalUsers: 1247,
    totalStudents: 1156,
    totalInstructors: 45,
    totalCourses: 23,
    totalEnrollments: 3456,
    totalRevenue: 125000,
    monthlyGrowth: 12.5,
    activeUsers: 892
  };

  const stats = overview || dummyStats;

  // Simple synthetic trend data derived from current totals (placeholder until backend provides series)
  const trend = [
    { label: 'W-3', users: Math.max(0, Math.floor((stats.totalUsers || 0) * 0.92)), revenue: Math.max(0, Math.floor((stats.totalRevenue || 0) * 0.85)), enrollments: Math.max(0, Math.floor((stats.totalEnrollments || 0) * 0.9)) },
    { label: 'W-2', users: Math.max(0, Math.floor((stats.totalUsers || 0) * 0.96)), revenue: Math.max(0, Math.floor((stats.totalRevenue || 0) * 0.92)), enrollments: Math.max(0, Math.floor((stats.totalEnrollments || 0) * 0.95)) },
    { label: 'W-1', users: Math.max(0, Math.floor((stats.totalUsers || 0) * 0.99)), revenue: Math.max(0, Math.floor((stats.totalRevenue || 0) * 0.97)), enrollments: Math.max(0, Math.floor((stats.totalEnrollments || 0) * 0.98)) },
    { label: 'Now', users: stats.totalUsers || 0, revenue: stats.totalRevenue || 0, enrollments: stats.totalEnrollments || 0 }
  ];
  const previousTrend = trend.map(t => ({ ...t, revenuePrev: Math.max(0, Math.floor(t.revenue * 0.85)) }));
  const totalCurrent = trend.reduce((s, t) => s + t.revenue, 0);
  const totalPrev = previousTrend.reduce((s, t) => s + t.revenuePrev, 0);
  const deltaPct = totalPrev > 0 ? Math.round(((totalCurrent - totalPrev) / totalPrev) * 100) : 0;

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
        <Stat title="Total Revenue" value={isLoading ? '...' : `₹${(stats.totalRevenue || 0).toLocaleString()}`} icon={TrendingUp} actionLabel="Sales Report →" onAction={() => setLocation('/admin/analytics')} emphasize />
        <Stat title="Total Enrollments" value={isLoading ? '...' : stats.totalEnrollments} icon={BookOpen} subtle />
        <Stat title="Active Students" value={isLoading ? '...' : stats.activeUsers} icon={Users} actionLabel="View Students →" onAction={() => setLocation('/admin/students')} subtle />
        <Stat title="Total Instructors" value={isLoading ? '...' : stats.totalInstructors} icon={UserCheck} actionLabel="Manage →" onAction={() => setLocation('/admin/instructors')} subtle />
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
        <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
            <CardDescription>
              {totalPrev > 0 ? (
                <span className={deltaPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{deltaPct >= 0 ? `+${deltaPct}%` : `${deltaPct}%`} from last period</span>
              ) : 'Trend over selected period'}
            </CardDescription>
        </CardHeader>
        <CardContent>
            {(totalCurrent === 0 && totalPrev === 0) ? (
              <div className="text-center text-sm text-gray-500 py-16 flex flex-col items-center gap-2">
                <svg className="w-8 h-8 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M19 9l-5 5-4-4-3 3"/></svg>
                <span>No revenue data for this period</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={previousTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenuePrev" fill="#c7d2fe" name="Previous" />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Current" />
                </BarChart>
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
                <Tooltip formatter={(v) => [v, 'Users']} />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
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
            {finalStudentsSample?.students?.length ? (
              <ul className="divide-y">
                {finalStudentsSample.students
                  .slice(0, 10)
                  .map((s) => {
                    const courseTitle = s.enrollments?.[0]?.courseId?.title;
                    return (
                      <li key={s._id} className="py-2 text-sm flex items-center justify-between">
                        <Link href={`/admin/students/${s._id}`} className="truncate mr-2 text-blue-600 hover:underline">
                          {s.profile?.firstName || s.username}
                        </Link>
                        <span className="hidden md:inline text-gray-500 truncate mr-2">{courseTitle ? `enrolled in "${courseTitle}"` : ''}</span>
                        <span className="text-gray-500">{new Date(s.analytics?.lastActivity || s.createdAt).toLocaleDateString()}</span>
                      </li>
                    );
                  })}
              </ul>
            ) : (
              <div className="text-sm text-gray-500 text-center py-12 flex flex-col items-center gap-2">
                <svg className="w-8 h-8 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                <span>No recent enrollments</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Course Performance */}
        <Card>
          <CardHeader><CardTitle>Course Performance</CardTitle><CardDescription>Top courses by enrollments</CardDescription></CardHeader>
          <CardContent>
            {Array.isArray(finalCoursesData?.courses) && finalCoursesData.courses.length > 0 ? (
              <div className="text-sm">
                {finalCoursesData.courses
                  .slice(0, 5)
                  .sort((a,b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0))
                  .map((c, idx, arr) => {
                    const max = Math.max(...arr.map(x => x.enrollmentCount || 0), 1);
                    const pct = Math.min(100, Math.round(((c.enrollmentCount || 0) / max) * 100));
                    return (
                      <div key={c._id} className="py-3 border-b last:border-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-6 h-6 text-xs rounded-full bg-blue-50 text-blue-700 flex items-center justify-center">{idx + 1}</span>
                            <Link href={`/admin/courses/${c._id}`} className="truncate text-blue-600 hover:underline">{c.title}</Link>
                          </div>
                          <div className="text-right whitespace-nowrap ml-2">{c.enrollmentCount ?? '—'}</div>
                        </div>
                        <ProgressBar value={pct} className="h-1.5 mt-2" />
                        <div className="text-xs text-gray-500 mt-1">Instructor: {c.assignedInstructor?.profile?.firstName || '—'}</div>
                      </div>
                    );
                  })}
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
            <div className="text-sm text-gray-500 text-center py-12 flex flex-col items-center gap-2">
              <svg className="w-8 h-8 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span>No new activity to report</span>
            </div>
        </CardContent>
      </Card>
      </div>

      {/* Removed separate Platform Analytics section; detailed reports live on Analytics page */}
    </div>
  );
};

function Stat({ title, value, icon: Icon, actionLabel, onAction, emphasize, subtle }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className={`font-medium ${subtle ? 'text-gray-600 text-sm' : 'text-gray-700 text-sm'}`}>{title}</CardTitle><Icon className="h-4 w-4 text-blue-600" /></CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className={`${emphasize ? 'text-4xl' : 'text-3xl'} font-extrabold text-gray-900`}>{value}</div>
          {actionLabel && onAction && (
            <button className="text-sm text-blue-600 hover:underline" onClick={onAction}>{actionLabel}</button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default AdminDashboard;
