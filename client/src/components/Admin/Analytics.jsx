import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, BookOpen, DollarSign, Calendar, Download } from 'lucide-react';
import { useState } from 'react';

const Analytics = () => {
  const { accessToken } = useAuth();
  const [timeRange, setTimeRange] = useState('30d');

  // Mock analytics data (in a real app, this would come from the API)
  const mockAnalytics = {
    overview: {
      totalRevenue: 125000,
      totalUsers: 1245,
      totalEnrollments: 3421,
      completionRate: 72.5,
      revenueGrowth: 15.3,
      userGrowth: 12.1,
      enrollmentGrowth: 8.7,
      completionGrowth: 3.2
    },
    userGrowth: [
      { month: 'Jan', students: 120, instructors: 8 },
      { month: 'Feb', students: 145, instructors: 10 },
      { month: 'Mar', students: 180, instructors: 12 },
      { month: 'Apr', students: 220, instructors: 15 },
      { month: 'May', students: 280, instructors: 18 },
      { month: 'Jun', students: 340, instructors: 22 }
    ],
    courseEnrollments: [
      { course: 'JavaScript Fundamentals', enrollments: 245 },
      { course: 'React Development', enrollments: 189 },
      { course: 'Node.js Backend', enrollments: 156 },
      { course: 'Python Basics', enrollments: 134 },
      { course: 'Data Science', enrollments: 98 }
    ],
    revenueData: [
      { month: 'Jan', revenue: 15000 },
      { month: 'Feb', revenue: 18000 },
      { month: 'Mar', revenue: 22000 },
      { month: 'Apr', revenue: 25000 },
      { month: 'May', revenue: 28000 },
      { month: 'Jun', revenue: 32000 }
    ],
    categoryDistribution: [
      { name: 'Programming', value: 45, count: 18 },
      { name: 'Design', value: 25, count: 10 },
      { name: 'Data Science', value: 15, count: 6 },
      { name: 'Business', value: 10, count: 4 },
      { name: 'Marketing', value: 5, count: 2 }
    ]
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const StatCard = ({ title, value, change, icon: Icon, color, subtitle }) => (
    <Card className="card-hover">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {subtitle && (
              <p className="text-sm text-gray-500">{subtitle}</p>
            )}
            {change && (
              <p className={`text-sm flex items-center mt-1 ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp className="w-3 h-3 mr-1" />
                {change > 0 ? '+' : ''}{change}% vs last period
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
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="12m">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <button className="flex items-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`₹${Math.round(mockAnalytics.overview.totalRevenue / 1000)}k`}
          change={mockAnalytics.overview.revenueGrowth}
          icon={DollarSign}
          color="bg-green-500"
        />
        <StatCard
          title="Total Users"
          value={mockAnalytics.overview.totalUsers}
          change={mockAnalytics.overview.userGrowth}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Enrollments"
          value={mockAnalytics.overview.totalEnrollments}
          change={mockAnalytics.overview.enrollmentGrowth}
          icon={BookOpen}
          color="bg-purple-500"
        />
        <StatCard
          title="Completion Rate"
          value={`${mockAnalytics.overview.completionRate}%`}
          change={mockAnalytics.overview.completionGrowth}
          icon={TrendingUp}
          color="bg-orange-500"
        />
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-fit">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
          <TabsTrigger value="courses" data-testid="tab-courses">Courses</TabsTrigger>
          <TabsTrigger value="revenue" data-testid="tab-revenue">Revenue</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>
                  New user registrations over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockAnalytics.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="students" fill="#3b82f6" name="Students" />
                    <Bar dataKey="instructors" fill="#10b981" name="Instructors" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Course Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Course Categories</CardTitle>
                <CardDescription>
                  Distribution of courses by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={mockAnalytics.categoryDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ name, count }) => `${name}: ${count}`}
                    >
                      {mockAnalytics.categoryDistribution.map((entry, index) => (
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

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Analytics</CardTitle>
              <CardDescription>
                Detailed user growth and engagement metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={mockAnalytics.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="students" stroke="#3b82f6" strokeWidth={2} name="Students" />
                  <Line type="monotone" dataKey="instructors" stroke="#10b981" strokeWidth={2} name="Instructors" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* User Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-blue-600">92%</div>
                <div className="text-sm text-gray-600">Active Users</div>
                <div className="text-xs text-gray-500 mt-1">Last 30 days</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-green-600">4.2h</div>
                <div className="text-sm text-gray-600">Avg Session</div>
                <div className="text-xs text-gray-500 mt-1">Per user</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-purple-600">68%</div>
                <div className="text-sm text-gray-600">Retention Rate</div>
                <div className="text-xs text-gray-500 mt-1">30-day</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Popular Courses</CardTitle>
              <CardDescription>
                Most enrolled courses on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={mockAnalytics.courseEnrollments} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="course" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="enrollments" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>
                Monthly revenue growth over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={mockAnalytics.revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-green-600">₹32k</div>
                <div className="text-sm text-gray-600">This Month</div>
                <div className="text-xs text-green-500 mt-1">+12.5% vs last month</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-blue-600">₹2.1k</div>
                <div className="text-sm text-gray-600">Avg Order Value</div>
                <div className="text-xs text-gray-500 mt-1">Per student</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-purple-600">78%</div>
                <div className="text-sm text-gray-600">Payment Success</div>
                <div className="text-xs text-gray-500 mt-1">Rate</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
