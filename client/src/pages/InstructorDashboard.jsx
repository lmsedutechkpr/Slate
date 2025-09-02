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
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['instructor-courses', user?._id, accessToken],
    queryFn: async () => {
      const res = await fetch(buildApiUrl('/api/instructor/courses'), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!accessToken && !!user?._id,
    refetchInterval: 15000
  });

  // Fetch instructor's assignments
  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['instructor-assignments', user?._id, accessToken],
    queryFn: async () => {
      const res = await fetch(buildApiUrl('/api/instructor/assignments'), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!accessToken && !!user?._id,
    refetchInterval: 15000
  });

  // Fetch instructor's live sessions
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['instructor-live-sessions', user?._id, accessToken],
    queryFn: async () => {
      const res = await fetch(buildApiUrl('/api/instructor/live-sessions'), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!accessToken && !!user?._id,
    refetchInterval: 15000
  });

  if (coursesLoading || assignmentsLoading || sessionsLoading) {
    return <LoadingSpinner />;
  }

  // Compute statistics
  const totalCourses = courses?.length || 0;
  const publishedCourses = courses?.filter(course => course.status === 'published').length || 0;
  const totalStudents = courses?.reduce((total, course) => total + (course.enrolledStudents || 0), 0) || 0;
  const totalAssignments = assignments?.length || 0;
  const activeSessions = sessions?.filter(session => session.status === 'live').length || 0;
  const upcomingSessions = sessions?.filter(session => session.status === 'scheduled').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.profile?.firstName || user?.username}!
          </h1>
          <p className="text-gray-600">Here's what's happening with your courses today</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setLocation('/instructor/courses')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Course
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold">{totalCourses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold">{totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Assignments</p>
                <p className="text-2xl font-bold">{totalAssignments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Video className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Live Sessions</p>
                <p className="text-2xl font-bold">{activeSessions + upcomingSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center"
              onClick={() => setLocation('/instructor/courses')}
            >
              <BookOpen className="w-6 h-6 mb-2" />
              Manage Courses
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center"
              onClick={() => setLocation('/instructor/assignments')}
            >
              <FileText className="w-6 h-6 mb-2" />
              View Assignments
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center"
              onClick={() => setLocation('/instructor/live')}
            >
              <Video className="w-6 h-6 mb-2" />
              Live Sessions
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center"
              onClick={() => setLocation('/instructor/analytics')}
            >
              <BarChart3 className="w-6 h-6 mb-2" />
              Analytics
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
