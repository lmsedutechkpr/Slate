import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth.js';
import { buildApiUrl } from '../../lib/utils.js';
import { useAuthRefresh } from '../../hooks/useAuthRefresh.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, BookOpen, DollarSign } from 'lucide-react';
import { useState, useMemo } from 'react';

const Analytics = () => {
  const { accessToken, authenticatedFetch } = useAuth();
  const { authLoading } = useAuthRefresh();
  const [timeRange, setTimeRange] = useState('30d');

  // Live overview
  const { data: overview } = useQuery({
    queryKey: ['/api/admin/analytics/overview'],
    queryFn: async () => {
      const res = await authenticatedFetch(buildApiUrl('/api/admin/analytics/overview'));
      if (!res.ok) throw new Error('Failed to load overview');
      return res.json();
    },
    enabled: !!accessToken && !authLoading
  });

  // Students sample for growth (derive monthly counts)
  const { data: studentsData } = useQuery({
    queryKey: ['/api/admin/analytics/students', { timeRange }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '500');
      const res = await authenticatedFetch(buildApiUrl(`/api/admin/analytics/students?${params.toString()}`));
      if (!res.ok) throw new Error('Failed to load students');
      return res.json();
    },
    enabled: !!accessToken && !authLoading
  });

  // Courses for category distribution
  const { data: coursesData } = useQuery({
    queryKey: ['/api/courses', { published: 'all' }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '500');
      params.append('isPublished', 'false');
      const res = await authenticatedFetch(buildApiUrl(`/api/courses?${params.toString()}`));
      if (!res.ok) throw new Error('Failed to load courses');
      return res.json();
    },
    enabled: !!accessToken && !authLoading
  });

  const studentList = studentsData?.students || [];
  const courseList = coursesData?.courses || [];

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

  const userGrowth = useMemo(() => {
    const byMonth = new Map();
    studentList.forEach(s => {
      const d = new Date(s.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      byMonth.set(key, (byMonth.get(key) || 0) + 1);
    });
    const keys = Array.from(byMonth.keys()).sort();
    return keys.map(k => ({ month: k, students: byMonth.get(k) }));
  }, [studentList]);

  const categoryDistribution = useMemo(() => {
    const m = new Map();
    courseList.forEach(c => m.set(c.category || 'other', (m.get(c.category || 'other') || 0) + 1));
    return Array.from(m.entries()).map(([name, count]) => ({ name, count }));
  }, [courseList]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#14b8a6'];

  const StatCard = ({ title, value, change, icon: Icon, color, subtitle }) => (
    <Card className="card-hover">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
            {subtitle && (<p className="text-sm text-gray-500">{subtitle}</p>)}
            {change != null && (
              <p className={`text-sm flex items-center mt-1 ${change > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                <TrendingUp className="w-3 h-3 mr-1" /> {change > 0 ? `+${change}%` : `${change || 0}%`} vs last period
              </p>
            )}
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Monitor platform performance and insights</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="12m">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Stats (live) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={`₹${(overview?.totalRevenue || 0).toLocaleString()}`} change={0} icon={DollarSign} color="bg-green-500" />
        <StatCard title="Total Users" value={overview?.totalUsers || 0} change={0} icon={Users} color="bg-blue-500" />
        <StatCard title="Total Enrollments" value={overview?.totalEnrollments || 0} change={0} icon={BookOpen} color="bg-purple-500" />
        <StatCard title="Active Users" value={overview?.activeUsers || 0} change={0} icon={TrendingUp} color="bg-orange-500" />
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex w-full overflow-x-auto whitespace-nowrap p-1 bg-gray-100 rounded-lg gap-1 md:grid md:grid-cols-4 md:overflow-visible md:whitespace-normal">
          <TabsTrigger value="overview" data-testid="tab-overview" className="text-xs sm:text-sm px-3 py-2 shrink-0 rounded-md md:w-full md:justify-center data-[state=active]:bg-white data-[state=active]:text-gray-900">Overview</TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users" className="text-xs sm:text-sm px-3 py-2 shrink-0 rounded-md md:w-full md:justify-center data-[state=active]:bg-white data-[state=active]:text-gray-900">Users</TabsTrigger>
          <TabsTrigger value="courses" data-testid="tab-courses" className="text-xs sm:text-sm px-3 py-2 shrink-0 rounded-md md:w-full md:justify-center data-[state=active]:bg-white data-[state=active]:text-gray-900">Courses</TabsTrigger>
          <TabsTrigger value="revenue" data-testid="tab-revenue" className="text-xs sm:text-sm px-3 py-2 shrink-0 rounded-md md:w-full md:justify-center data-[state=active]:bg-white data-[state=active]:text-gray-900">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>User Growth</CardTitle><CardDescription>New user registrations over time (from recent data)</CardDescription></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="students" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Course Categories</CardTitle><CardDescription>Distribution by category</CardDescription></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={categoryDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="count" label={({ name, count }) => `${name}: ${count}`}>
                      {categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>User Metrics</CardTitle><CardDescription>Based on student analytics endpoint</CardDescription></CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">Total students fetched: {studentList.length}</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Courses Metrics</CardTitle><CardDescription>Live snapshot of course distribution</CardDescription></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Revenue</CardTitle><CardDescription>From overview (placeholder until revenue tracking implemented)</CardDescription></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{(overview?.totalRevenue || 0).toLocaleString()}</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
