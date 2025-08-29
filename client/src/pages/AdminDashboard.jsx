import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users, BookOpen, GraduationCap, TrendingUp, BarChart3, UserCheck, Eye, Plus,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth.js';

const AdminDashboard = () => {
  const [location, setLocation] = useLocation();
  const { accessToken } = useAuth();

  const { data: overview, isLoading } = useQuery({
    queryKey: ['/api/admin/analytics/overview'],
    queryFn: async () => {
      const res = await fetch('/api/admin/analytics/overview', { headers: { 'Authorization': `Bearer ${accessToken}` } });
      if (!res.ok) throw new Error('Failed to load analytics');
      return res.json();
    },
    enabled: !!accessToken
  });

  const stats = overview || { totalUsers: 0, totalStudents: 0, totalInstructors: 0, totalCourses: 0, totalEnrollments: 0, totalRevenue: 0, monthlyGrowth: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Welcome to Admin Dashboard</h1>
          <p className="text-sm lg:text-base text-gray-600">Monitor platform performance and manage your learning ecosystem</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setLocation('/admin/analytics')} variant="outline"><BarChart3 className="w-4 h-4 mr-2" /> Analytics</Button>
          <Button onClick={() => setLocation('/admin/courses')}><Plus className="w-4 h-4 mr-2" /> Create Course</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Stat title="Total Users" value={isLoading ? '...' : stats.totalUsers} icon={Users} />
        <Stat title="Students" value={isLoading ? '...' : stats.totalStudents} icon={GraduationCap} />
        <Stat title="Instructors" value={isLoading ? '...' : stats.totalInstructors} icon={UserCheck} />
        <Stat title="Courses" value={isLoading ? '...' : stats.totalCourses} icon={BookOpen} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
        <Card className="hover:shadow-md transition-shadow"><CardHeader><CardTitle>Enrollments</CardTitle><CardDescription>Total course enrollments</CardDescription></CardHeader><CardContent><div className="text-3xl font-bold text-blue-600">{isLoading ? '...' : stats.totalEnrollments}</div></CardContent></Card>
        <Card className="hover:shadow-md transition-shadow"><CardHeader><CardTitle>Revenue</CardTitle><CardDescription>Total platform revenue</CardDescription></CardHeader><CardContent><div className="text-3xl font-bold text-green-600">₹{isLoading ? '...' : stats.totalRevenue}</div></CardContent></Card>
        <Card className="hover:shadow-md transition-shadow"><CardHeader><CardTitle>Growth</CardTitle><CardDescription>Monthly user growth</CardDescription></CardHeader><CardContent><div className="text-3xl font-bold text-purple-600">{isLoading ? '...' : stats.monthlyGrowth}%</div></CardContent></Card>
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
            <TabsContent value="overview" className="mt-4 text-sm text-gray-600">Live data powered by API. Use Analytics page for full reports.</TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

function Stat({ title, value, icon: Icon }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle><Icon className="h-4 w-4 text-blue-600" /></CardHeader>
      <CardContent><div className="text-2xl font-bold text-gray-900">{value}</div></CardContent>
    </Card>
  );
}

export default AdminDashboard;
