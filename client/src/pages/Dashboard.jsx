import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth.js';
import { buildApiUrl } from '../lib/utils.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '../components/Common/LoadingSpinner.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BookOpen, 
  Clock, 
  Calendar, 
  Star, 
  TrendingUp, 
  Award, 
  Play, 
  Users, 
  Target,
  Zap,
  CheckCircle,
  AlertCircle,
  Eye,
  Plus,
  Video,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';

const Dashboard = () => {
  const { user, accessToken, authenticatedFetch, authLoading } = useAuth();
  
  // Fetch dashboard data with real-time updates
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard', accessToken],
    queryFn: async () => {
      const response = await authenticatedFetch(buildApiUrl('/api/dashboard'));
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      return response.json();
    },
    enabled: !!accessToken && !authLoading,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Fetch live sessions with real-time updates
  const { data: liveData } = useQuery({
    queryKey: ['/api/live-sessions/mine', accessToken],
    queryFn: async () => {
      const response = await authenticatedFetch(buildApiUrl('/api/live-sessions/mine'));
      if (!response.ok) return { sessions: [] };
      return response.json();
    },
    enabled: !!accessToken && !authLoading,
    refetchInterval: 30000,
  });

  // Show loading state while authentication is in progress
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load dashboard data. Please refresh the page or try again later.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const {
    enrollments = [],
    assignments = [],
    recommendations = { courses: [], products: [] },
    stats = {}
  } = dashboardData || {};

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const userName = user?.profile?.firstName || user?.username || 'Student';

  const formatTime = (minutes) => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back! Here's your learning overview</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live updates</span>
            </div>
          </div>
        </div>

        {/* Welcome Card */}
        <Card className="border-0 shadow-sm bg-gradient-to-r from-primary-600 to-primary-700 text-white mb-8">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">
                  {getGreeting()}, {userName}! 👋
                </h2>
                <p className="text-primary-100 mb-6">
                  You're making great progress. Keep up the momentum!
                </p>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{stats.currentStreak || 0}</div>
                    <div className="text-sm text-primary-200">Day Streak</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{stats.totalXP?.toLocaleString() || 0}</div>
                    <div className="text-sm text-primary-200">XP Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{stats.completedCourses || 0}</div>
                    <div className="text-sm text-primary-200">Completed</div>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="w-24 h-24 bg-white bg-opacity-10 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Enrolled Courses</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {enrollments.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Study Time</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {formatTime(stats.totalStudyTime || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {assignments.filter(a => !a.submitted).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Live Sessions</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {liveData?.sessions?.length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                  <Video className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Current Learning */}
          <Card className="border-0 shadow-sm bg-white lg:col-span-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Continue Learning</CardTitle>
              <CardDescription>Pick up where you left off</CardDescription>
            </CardHeader>
            <CardContent>
              {enrollments.length > 0 ? (
                <div className="space-y-4">
                  {enrollments.slice(0, 3).map((enrollment) => (
                    <div key={enrollment._id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{enrollment.course?.title}</h4>
                        <p className="text-sm text-gray-600">{enrollment.course?.instructor}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                            <span className="text-xs text-gray-500">
                              {Math.round(enrollment.progress || 0)}% complete
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatTime(enrollment.timeSpent || 0)} spent
                          </span>
                        </div>
                      </div>
                      <Button size="sm" className="flex-shrink-0">
                        <Play className="w-4 h-4 mr-2" />
                        Continue
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No courses enrolled yet</h3>
                  <p className="text-gray-600 mb-4">Start your learning journey by enrolling in a course</p>
                  <Button>
                    <Eye className="w-4 h-4 mr-2" />
                    Browse Courses
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* This Week Progress */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">This Week</CardTitle>
              <CardDescription>Study Hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {formatTime(stats.weeklyStudyTime || 0)}
                  </div>
                  <div className="text-sm text-gray-600">Goal: 15h per week</div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{Math.round(((stats.weeklyStudyTime || 0) / (15 * 60)) * 100)}%</span>
                  </div>
                  <ProgressBar 
                    value={Math.min(((stats.weeklyStudyTime || 0) / (15 * 60)) * 100, 100)} 
                    className="h-3 bg-gray-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="font-semibold text-gray-900">{stats.dailyAverage || 0}h</div>
                    <div className="text-gray-600">Daily avg</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="font-semibold text-gray-900">{stats.studyDays || 0}</div>
                    <div className="text-gray-600">Study days</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Assignments */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Upcoming Assignments</CardTitle>
              <CardDescription>Stay on top of your deadlines</CardDescription>
            </CardHeader>
            <CardContent>
              {assignments.filter(a => !a.submitted && new Date(a.dueAt) > new Date()).length > 0 ? (
                <div className="space-y-4">
                  {assignments
                    .filter(a => !a.submitted && new Date(a.dueAt) > new Date())
                    .slice(0, 3)
                    .map((assignment) => (
                      <div key={assignment._id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                          <p className="text-sm text-gray-600">{assignment.course?.title}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              Due {formatDate(assignment.dueAt)}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {assignment.points || 0} pts
                        </Badge>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">No upcoming assignments</p>
                  <p className="text-sm text-gray-500 mt-1">You're all caught up!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Live Classes */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Live Classes</CardTitle>
              <CardDescription>Join interactive sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {liveData?.sessions && liveData.sessions.length > 0 ? (
                <div className="space-y-4">
                  {liveData.sessions.slice(0, 3).map((session) => (
                    <div key={session._id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                        <Video className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{session.title}</h4>
                        <p className="text-sm text-gray-600">{session.instructor}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {formatDate(session.startTime)}
                          </span>
                        </div>
                      </div>
                      <Badge variant="default" className="text-xs">
                        Live
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Video className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">No live sessions scheduled</p>
                  <p className="text-sm text-gray-500 mt-1">Check back later for updates</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
