import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/useAuth.js';
import { buildApiUrl } from '../lib/utils.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  TrendingUp, 
  Plus, 
  Video, 
  FileText, 
  Award,
  BarChart3,
  Clock
} from 'lucide-react';
import LoadingSpinner from '../components/Common/LoadingSpinner.jsx';

const InstructorDashboard = () => {
  const [location, setLocation] = useLocation();
  const { accessToken, user } = useAuth();

  // Fetch instructor's courses
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['instructor-courses', user?._id, accessToken],
    queryFn: async () => {
      const res = await fetch(buildApiUrl('/api/instructor/courses'), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) return { courses: [] };
      return res.json();
    },
    enabled: !!accessToken && !!user?._id,
    refetchInterval: 15000
  });

  // Fetch instructor's assignments
  const { data: assignmentsData, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['instructor-assignments', user?._id, accessToken],
    queryFn: async () => {
      const res = await fetch(buildApiUrl('/api/instructor/assignments'), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) return { assignments: [] };
      return res.json();
    },
    enabled: !!accessToken && !!user?._id,
    refetchInterval: 15000
  });

  // Fetch instructor's live sessions
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['instructor-live-sessions', user?._id, accessToken],
    queryFn: async () => {
      const res = await fetch(buildApiUrl('/api/instructor/live-sessions'), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) return { sessions: [] };
      return res.json();
    },
    enabled: !!accessToken && !!user?._id,
    refetchInterval: 15000
  });

  if (coursesLoading || assignmentsLoading || sessionsLoading) {
    return <LoadingSpinner />;
  }

  // Extract data from API responses
  const courses = coursesData?.courses || [];
  const assignments = assignmentsData?.assignments || [];
  const sessions = sessionsData?.sessions || [];

  // Compute statistics
  const totalCourses = courses?.length || 0;
  const publishedCourses = courses?.filter(course => course.status === 'published').length || 0;
  const totalStudents = courses?.reduce((total, course) => total + (course.enrolledStudents || 0), 0) || 0;
  const totalAssignments = assignments?.length || 0;
  const activeSessions = sessions?.filter(session => session.status === 'live').length || 0;
  const upcomingSessions = sessions?.filter(session => session.status === 'scheduled').length || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.profile?.firstName || user?.username}!
          </h1>
          <p className="text-gray-600 mt-2">Here's what's happening with your courses today</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setLocation('/instructor/courses')} className="shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            Create Course
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">{totalCourses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Assignments</p>
                <p className="text-2xl font-bold text-gray-900">{totalAssignments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Video className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Live Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{activeSessions + upcomingSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-sm border-0">
        <CardHeader>
          <CardTitle className="text-xl">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 hover:border-blue-200 transition-colors"
              onClick={() => setLocation('/instructor/courses')}
            >
              <BookOpen className="w-7 h-7 text-blue-600" />
              <span className="font-medium">Manage Courses</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-purple-50 hover:border-purple-200 transition-colors"
              onClick={() => setLocation('/instructor/assignments')}
            >
              <FileText className="w-7 h-7 text-purple-600" />
              <span className="font-medium">Assignments</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-orange-50 hover:border-orange-200 transition-colors"
              onClick={() => setLocation('/instructor/live')}
            >
              <Video className="w-7 h-7 text-orange-600" />
              <span className="font-medium">Live Sessions</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-green-50 hover:border-green-200 transition-colors"
              onClick={() => setLocation('/instructor/students')}
            >
              <Users className="w-7 h-7 text-green-600" />
              <span className="font-medium">My Students</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Courses</CardTitle>
          </CardHeader>
          <CardContent>
            {courses?.slice(0, 3).map((course) => (
              <div key={course._id} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">{course.title}</p>
                  <p className="text-sm text-gray-600">{course.enrolledStudents || 0} students</p>
                </div>
                <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                  {course.status}
                </Badge>
              </div>
            ))}
            {courses?.length === 0 && (
              <p className="text-gray-500 text-center py-4">No courses yet</p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {sessions?.filter(s => s.status === 'scheduled').slice(0, 3).map((session) => (
              <div key={session._id} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">{session.title}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(session.startAt).toLocaleDateString()}
                  </p>
                </div>
                <Clock className="w-4 h-4 text-gray-400" />
              </div>
            ))}
            {sessions?.filter(s => s.status === 'scheduled').length === 0 && (
              <p className="text-gray-500 text-center py-4">No upcoming sessions</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InstructorDashboard;
