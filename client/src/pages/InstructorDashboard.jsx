import { useQuery } from '@tanstack/react-query';
import { useRealtimeInvalidate } from '@/lib/useRealtimeInvalidate.js';
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
  Video, 
  FileText, 
  Award,
  BarChart3,
  Clock,
  CheckCircle,
  UserCheck,
  ClipboardList,
  BookMarked,
  Plus
} from 'lucide-react';
import LoadingSpinner from '../components/Common/LoadingSpinner.jsx';

const InstructorDashboard = () => {
  const [location, setLocation] = useLocation();
  const { accessToken, user } = useAuth();

  // Fetch instructor's courses (both assigned and created)
  const { data: coursesData, isLoading: coursesLoading, error: coursesError } = useQuery({
    queryKey: ['instructor-courses', user?._id, accessToken],
    queryFn: async () => {
      console.log('Fetching instructor courses for user:', user?._id);
      const res = await fetch(buildApiUrl('/api/instructor/courses'), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) {
        console.error('Failed to fetch courses:', res.status, res.statusText);
        return { courses: [] };
      }
      const data = await res.json();
      console.log('Courses data received:', data);
      return data;
    },
    enabled: !!accessToken && !!user?._id,
    refetchInterval: 15000,
    staleTime: 0
  });

  // Fetch instructor's assignments
  const { data: assignmentsData, isLoading: assignmentsLoading, error: assignmentsError } = useQuery({
    queryKey: ['instructor-assignments', user?._id, accessToken],
    queryFn: async () => {
      console.log('Fetching instructor assignments for user:', user?._id);
      const res = await fetch(buildApiUrl('/api/instructor/assignments'), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) {
        console.error('Failed to fetch assignments:', res.status, res.statusText);
        return { assignments: [] };
      }
      const data = await res.json();
      console.log('Assignments data received:', data);
      return data;
    },
    enabled: !!accessToken && !!user?._id,
    refetchInterval: 15000,
    staleTime: 0
  });

  // Fetch instructor's live sessions
  const { data: sessionsData, isLoading: sessionsLoading, error: sessionsError } = useQuery({
    queryKey: ['instructor-live-sessions', user?._id, accessToken],
    queryFn: async () => {
      console.log('Fetching instructor live sessions for user:', user?._id);
      const res = await fetch(buildApiUrl('/api/instructor/live-sessions'), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) {
        console.error('Failed to fetch live sessions:', res.status, res.statusText);
        return { sessions: [] };
      }
      const data = await res.json();
      console.log('Live sessions data received:', data);
      return data;
    },
    enabled: !!accessToken && !!user?._id,
    refetchInterval: 15000,
    staleTime: 0
  });

  useRealtimeInvalidate([
    ['instructor-courses', user?._id],
    ['instructor-assignments', user?._id],
    ['instructor-live-sessions', user?._id]
  ], ['courses', 'assignments', 'live-sessions']);

  if (coursesLoading || assignmentsLoading || sessionsLoading) {
    return <LoadingSpinner />;
  }

  // Show error messages if any
  if (coursesError || assignmentsError || sessionsError) {
    console.error('Dashboard errors:', { coursesError, assignmentsError, sessionsError });
  }

  // Extract data from API responses
  const courses = coursesData?.courses || [];
  const assignments = assignmentsData?.assignments || [];
  const sessions = sessionsData?.sessions || [];

  // Debug logging
  console.log('Dashboard data:', {
    courses: courses.length,
    assignments: assignments.length,
    sessions: sessions.length,
    user: user?._id,
    role: user?.role
  });

  // Compute teaching statistics
  const totalCourses = courses?.length || 0;
  const totalStudents = courses?.reduce((total, course) => total + (course.enrolledStudents || 0), 0) || 0;
  const totalAssignments = assignments?.length || 0;
  const pendingGrading = assignments?.filter(assignment => assignment.status === 'submitted').length || 0;
  const activeSessions = sessions?.filter(session => session.status === 'live').length || 0;
  const upcomingSessions = sessions?.filter(session => session.status === 'scheduled').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Teaching Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Create courses, manage content, track student progress, and conduct live sessions</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setLocation('/instructor/live')} className="shadow-sm">
            <Video className="w-4 h-4 mr-2" />
            Start Live Session
          </Button>
        </div>
      </div>

      {/* Teaching Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">My Courses</p>
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
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Grading</p>
                <p className="text-2xl font-bold text-gray-900">{pendingGrading}</p>
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

      {/* Teaching Actions */}
      <Card className="shadow-sm border-0">
        <CardHeader>
          <CardTitle className="text-xl">Teaching Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 hover:border-blue-200 transition-colors"
              onClick={() => setLocation('/instructor/courses')}
            >
              <BookMarked className="w-7 h-7 text-blue-600" />
              <span className="font-medium">Course Content</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-purple-50 hover:border-purple-200 transition-colors"
              onClick={() => setLocation('/instructor/assignments')}
            >
              <ClipboardList className="w-7 h-7 text-purple-600" />
              <span className="font-medium">Grade Assignments</span>
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
              <UserCheck className="w-7 h-7 text-green-600" />
              <span className="font-medium">Track Students</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Teaching Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Courses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              My Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {courses?.slice(0, 3).map((course) => (
              <div key={course._id} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">{course.title}</p>
                  <p className="text-sm text-gray-600">{course.enrolledStudents || 0} students enrolled</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLocation(`/instructor/courses/${course._id}`)}
                >
                  Manage Content
                </Button>
              </div>
            ))}
            {courses?.length === 0 && (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-2">No courses yet</p>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setLocation('/instructor/courses')}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Create Course
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Grading */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Pending Grading
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignments?.filter(a => a.status === 'submitted').slice(0, 3).map((assignment) => (
              <div key={assignment._id} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">{assignment.title}</p>
                  <p className="text-sm text-gray-600">{assignment.submissions?.length || 0} submissions</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLocation('/instructor/assignments')}
                >
                  Grade Now
                </Button>
              </div>
            ))}
            {assignments?.filter(a => a.status === 'submitted').length === 0 && (
              <p className="text-gray-500 text-center py-4">No pending grading</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InstructorDashboard;
