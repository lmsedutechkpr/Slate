import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '../components/Common/LoadingSpinner.jsx';
import MyCourses from '../components/Instructor/MyCourses.jsx';
import LiveSessions from '../components/Instructor/LiveSessions.jsx';
import InstructorAssignments from '../components/Instructor/Assignments.jsx';
import { BookOpen, Users, Calendar, TrendingUp, Plus, Video, FileText, Award } from 'lucide-react';

const InstructorDashboard = () => {
  const { accessToken, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch instructor's courses
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['/api/instructor/courses'],
    queryFn: async () => {
      const response = await fetch('/api/instructor/courses', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      
      return response.json();
    },
    enabled: !!accessToken,
  });

  // Mock instructor statistics (in a real app, this would come from the API)
  const mockStats = {
    totalCourses: 3,
    totalStudents: 145,
    totalLectures: 28,
    totalAssignments: 12,
    avgRating: 4.7,
    completionRate: 78,
    thisMonthEnrollments: 23,
    pendingGradings: 8
  };

  const courses = coursesData?.courses || [];
  const stats = mockStats;

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <Card className="card-hover">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {value}
            </p>
            {subtitle && (
              <p className="text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const QuickActionButton = ({ icon: Icon, label, onClick, variant = "outline" }) => (
    <Button 
      variant={variant}
      className="flex items-center space-x-2 h-auto p-4"
      onClick={onClick}
      data-testid={`button-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </Button>
  );

  if (coursesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.profile?.firstName || user?.username}!
        </h1>
        <p className="text-gray-600">Manage your courses and track student progress</p>
      </div>

      {/* Instructor Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-fit">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="courses" data-testid="tab-courses">My Courses</TabsTrigger>
          <TabsTrigger value="live" data-testid="tab-live">Live Sessions</TabsTrigger>
          <TabsTrigger value="assignments" data-testid="tab-assignments">Assignments</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Courses"
              value={stats.totalCourses}
              icon={BookOpen}
              color="bg-blue-500"
              subtitle="Active courses"
            />
            <StatCard
              title="Total Students"
              value={stats.totalStudents}
              icon={Users}
              color="bg-green-500"
              subtitle="Across all courses"
            />
            <StatCard
              title="Average Rating"
              value={`${stats.avgRating}/5.0`}
              icon={Award}
              color="bg-yellow-500"
              subtitle="Student feedback"
            />
            <StatCard
              title="Completion Rate"
              value={`${stats.completionRate}%`}
              icon={TrendingUp}
              color="bg-purple-500"
              subtitle="Course completion"
            />
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts for course management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <QuickActionButton
                  icon={Plus}
                  label="Create Course"
                  variant="default"
                  onClick={() => setActiveTab('courses')}
                />
                <QuickActionButton
                  icon={Video}
                  label="Schedule Live Session"
                  onClick={() => setActiveTab('live')}
                />
                <QuickActionButton
                  icon={FileText}
                  label="Create Assignment"
                  onClick={() => setActiveTab('assignments')}
                />
                <QuickActionButton
                  icon={TrendingUp}
                  label="View Analytics"
                  onClick={() => console.log('Navigate to analytics')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity & Pending Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest updates from your courses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">5 new enrollments</p>
                      <p className="text-xs text-gray-500">JavaScript Fundamentals - 2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Assignment submitted</p>
                      <p className="text-xs text-gray-500">React Project - Sarah Chen - 4 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Award className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Course rating received</p>
                      <p className="text-xs text-gray-500">5 stars on "Advanced React" - 6 hours ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Pending Tasks</span>
                  <Badge variant="destructive">{stats.pendingGradings}</Badge>
                </CardTitle>
                <CardDescription>
                  Items requiring your attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Assignments to grade</p>
                      <p className="text-xs text-gray-500">React Development Course</p>
                    </div>
                    <Badge variant="secondary">{stats.pendingGradings}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Course content to review</p>
                      <p className="text-xs text-gray-500">JavaScript Fundamentals</p>
                    </div>
                    <Badge variant="secondary">2</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Student questions</p>
                      <p className="text-xs text-gray-500">Course Q&A forums</p>
                    </div>
                    <Badge variant="secondary">3</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Course Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Course Performance</CardTitle>
              <CardDescription>
                Overview of your course statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courses.slice(0, 3).map((course) => (
                  <div key={course._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{course.title}</h4>
                        <p className="text-sm text-gray-500">
                          {course.enrollmentCount || 0} students enrolled
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{course.rating?.average?.toFixed(1) || 'No ratings'}</p>
                      <p className="text-xs text-gray-500">
                        {course.rating?.count || 0} reviews
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses">
          <MyCourses courses={courses} />
        </TabsContent>

        {/* Live Sessions Tab */}
        <TabsContent value="live">
          <LiveSessions />
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments">
          <InstructorAssignments />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InstructorDashboard;
