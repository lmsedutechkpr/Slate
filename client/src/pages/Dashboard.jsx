import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { subscribe } from '@/lib/realtime.js';
import { Link } from 'wouter';
import { useAuth } from '../hooks/useAuth.js';
import { buildApiUrl } from '../lib/utils.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '../components/Common/LoadingSpinner.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Import new dashboard components
import CompactWelcome from '../components/Dashboard/CompactWelcome.jsx';
import CircularProgress from '../components/Dashboard/CircularProgress.jsx';
import RecommendedGear from '../components/Dashboard/RecommendedGear.jsx';
import DiscoverWhatsNext from '../components/Dashboard/DiscoverWhatsNext.jsx';
import GearUpForSuccess from '../components/Dashboard/GearUpForSuccess.jsx';
import EnhancedContinueLearning from '../components/Dashboard/EnhancedContinueLearning.jsx';
import LiveNotifications from '../components/Dashboard/LiveNotifications.jsx';
import AnimatedCounter from '../components/Dashboard/AnimatedCounter.jsx';
import { 
  EmptyAssignments, 
  EmptyLiveSessions, 
  EmptyCourses 
} from '../components/Dashboard/EnhancedEmptyStates.jsx';

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
  const queryClient = useQueryClient();
  const [weeklyGoalHours, setWeeklyGoalHours] = useState(15);
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  // Comprehensive dummy data for student dashboard
  const dummyDashboardData = {
    enrollments: [
      {
        _id: '1',
        courseId: {
          _id: '1',
          title: 'Complete Web Development Bootcamp',
          description: 'Learn modern web development from scratch. Master HTML, CSS, JavaScript, React, Node.js.',
          coverUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop',
          category: 'Web Development',
          level: 'beginner',
          price: 199,
          instructor: { name: 'Sarah Wilson' },
          rating: { average: 4.8, count: 124 },
          lessons: 24,
          duration: '40 hours',
          sections: [
            {
              _id: 'section1',
              title: 'HTML & CSS Fundamentals',
              lectures: [
                { _id: 'lecture1', title: 'Introduction to HTML', duration: 1800, type: 'video' },
                { _id: 'lecture2', title: 'CSS Basics and Styling', duration: 2400, type: 'video' },
                { _id: 'lecture3', title: 'Responsive Design', duration: 2100, type: 'video' }
              ]
            },
            {
              _id: 'section2',
              title: 'JavaScript Essentials',
              lectures: [
                { _id: 'lecture4', title: 'JavaScript Variables and Functions', duration: 2700, type: 'video' },
                { _id: 'lecture5', title: 'DOM Manipulation', duration: 3000, type: 'video' },
                { _id: 'lecture6', title: 'Event Handling', duration: 1800, type: 'video' }
              ]
            }
          ]
        },
        progress: 65,
        status: 'active',
        enrolledAt: '2024-01-15T00:00:00.000Z',
        lastActivityAt: '2024-01-20T15:30:00.000Z',
        completedLessons: 15,
        totalLessons: 24,
        completedLectures: ['lecture1', 'lecture2', 'lecture3', 'lecture4'],
        lastAccessedLecture: 'lecture4'
      },
      {
        _id: '2',
        courseId: {
          _id: '2',
          title: 'React.js Complete Guide',
          description: 'Master React.js from fundamentals to advanced concepts. Learn hooks, state management, routing.',
          coverUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop',
          category: 'Frontend Development',
          level: 'intermediate',
          price: 149,
          instructor: { name: 'John Doe' },
          rating: { average: 4.6, count: 89 },
          lessons: 18,
          duration: '30 hours',
          sections: [
            {
              _id: 'section3',
              title: 'React Fundamentals',
              lectures: [
                { _id: 'lecture7', title: 'Introduction to React', duration: 1800, type: 'video' },
                { _id: 'lecture8', title: 'Components and Props', duration: 2400, type: 'video' },
                { _id: 'lecture9', title: 'State and Lifecycle', duration: 2100, type: 'video' }
              ]
            },
            {
              _id: 'section4',
              title: 'Advanced React',
              lectures: [
                { _id: 'lecture10', title: 'Hooks Deep Dive', duration: 2700, type: 'video' },
                { _id: 'lecture11', title: 'Context API', duration: 3000, type: 'video' }
              ]
            }
          ]
        },
        progress: 45,
        status: 'active',
        enrolledAt: '2024-01-10T00:00:00.000Z',
        lastActivityAt: '2024-01-19T14:20:00.000Z',
        completedLessons: 8,
        totalLessons: 18,
        completedLectures: ['lecture7', 'lecture8'],
        lastAccessedLecture: 'lecture8'
      },
      {
        _id: '3',
        courseId: {
          _id: '3',
          title: 'Node.js Backend Development',
          description: 'Build scalable backend applications with Node.js, Express, and MongoDB.',
          coverUrl: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&h=450&fit=crop',
          category: 'Backend Development',
          level: 'intermediate',
          price: 179,
          instructor: { name: 'Mike Johnson' },
          rating: { average: 4.7, count: 67 },
          lessons: 20,
          duration: '35 hours'
        },
        progress: 30,
        status: 'active',
        enrolledAt: '2024-01-05T00:00:00.000Z',
        lastActivityAt: '2024-01-18T16:45:00.000Z',
        completedLessons: 6,
        totalLessons: 20
      }
    ],
    assignments: [
      {
        _id: '1',
        title: 'Build a Personal Portfolio Website',
        courseId: { title: 'Complete Web Development Bootcamp' },
        dueAt: '2024-02-15T23:59:59.000Z',
        submissionStatus: 'pending',
        maxPoints: 100,
        description: 'Create a responsive portfolio website showcasing your projects and skills.',
        createdAt: '2024-01-15T00:00:00.000Z'
      },
      {
        _id: '2',
        title: 'React Todo Application',
        courseId: { title: 'React.js Complete Guide' },
        dueAt: '2024-02-20T23:59:59.000Z',
        submissionStatus: 'submitted',
        maxPoints: 80,
        description: 'Build a todo application using React hooks and state management.',
        createdAt: '2024-01-20T00:00:00.000Z'
      },
      {
        _id: '3',
        title: 'REST API with Express',
        courseId: { title: 'Node.js Backend Development' },
        dueAt: '2024-02-25T23:59:59.000Z',
        submissionStatus: 'graded',
        maxPoints: 120,
        grade: 95,
        description: 'Create a RESTful API using Express.js with authentication and CRUD operations.',
        createdAt: '2024-01-25T00:00:00.000Z'
      }
    ],
    liveSessions: [
      {
        _id: '1',
        title: 'React Hooks Deep Dive',
        courseId: { title: 'React.js Complete Guide' },
        scheduledAt: '2024-02-01T18:00:00.000Z',
        duration: 90,
        status: 'scheduled',
        instructor: { name: 'John Doe' },
        meetingUrl: 'https://meet.google.com/react-hooks-session',
        description: 'Learn advanced React hooks patterns and best practices.'
      },
      {
        _id: '2',
        title: 'Web Development Q&A',
        courseId: { title: 'Complete Web Development Bootcamp' },
        scheduledAt: '2024-02-03T17:00:00.000Z',
        duration: 60,
        status: 'scheduled',
        instructor: { name: 'Sarah Wilson' },
        meetingUrl: 'https://meet.google.com/webdev-qa',
        description: 'Ask questions about web development concepts and get live help.'
      }
    ],
    recommendations: {
      courses: [
        {
          _id: '4',
          title: 'Python for Data Science',
          description: 'Learn Python programming for data analysis and visualization.',
          coverUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop',
          category: 'Data Science',
          level: 'beginner',
          price: 129,
          instructor: { name: 'Dr. Emily Chen' },
          rating: { average: 4.9, count: 156 }
        },
        {
          _id: '5',
          title: 'Machine Learning Fundamentals',
          description: 'Introduction to machine learning algorithms and applications.',
          coverUrl: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=450&fit=crop',
          category: 'Machine Learning',
          level: 'intermediate',
          price: 199,
          instructor: { name: 'Prof. Alex Kumar' },
          rating: { average: 4.7, count: 203 }
        }
      ],
      products: [
        {
          _id: '1',
          name: 'Wireless Bluetooth Headphones',
          description: 'High-quality noise-canceling headphones perfect for online learning.',
          price: 89.99,
          imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
          category: 'Audio',
          brand: 'TechSound',
          rating: 4.5,
          reviews: 128
        },
        {
          _id: '2',
          name: 'Ergonomic Study Chair',
          description: 'Comfortable chair designed for long study sessions.',
          price: 199.99,
          imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
          category: 'Furniture',
          brand: 'ComfortPlus',
          rating: 4.8,
          reviews: 89
        }
      ]
    },
    stats: {
      totalCourses: 3,
      completedCourses: 0,
      totalAssignments: 3,
      completedAssignments: 1,
      totalHours: 45,
      totalStudyTime: 930, // 15h 30m in minutes
      weeklyHours: 8,
      weeklyStudyTime: 8.5,
      dayStreak: 5,
      xpPoints: 1250,
      achievements: 3
    }
  };

  useEffect(() => {
    const saved = Number(localStorage.getItem('weeklyGoalHours'));
    if (!Number.isNaN(saved) && saved > 0) setWeeklyGoalHours(saved);
  }, []);

  const handleSaveWeeklyGoal = (value) => {
    const n = Number(value);
    if (!Number.isNaN(n) && n > 0 && n <= 100) {
      setWeeklyGoalHours(n);
      localStorage.setItem('weeklyGoalHours', String(n));
      setIsEditingGoal(false);
    } else {
      setIsEditingGoal(false);
    }
  };
  
  // Fetch dashboard data with real-time updates
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard', accessToken],
    queryFn: async () => {
      // Return dummy data for demonstration
      return dummyDashboardData;
    },
    enabled: true, // Always enabled for dummy data
    refetchOnWindowFocus: true,
    refetchInterval: false,
    staleTime: 30000
  });

  // Realtime: invalidate dashboard on specific updates
  useEffect(() => {
    let unsubs = [];
    (async () => {
      // General API updates
      const unsubApi = await subscribe('api:update', () => {
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['/api/live-sessions/mine'] });
      });
      unsubs.push(unsubApi);

      // Course-specific updates
      const unsubCourses = await subscribe('courses:update', () => {
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      });
      unsubs.push(unsubCourses);

      // Product updates
      const unsubProducts = await subscribe('products:update', () => {
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      });
      unsubs.push(unsubProducts);

      // Live session updates
      const unsubLiveSessions = await subscribe('live-sessions:update', () => {
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['/api/live-sessions/mine'] });
      });
      unsubs.push(unsubLiveSessions);

      // Assignment updates
      const unsubAssignments = await subscribe('assignments:update', () => {
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      });
      unsubs.push(unsubAssignments);
    })();
    
    return () => {
      unsubs.forEach(unsub => {
        try { unsub(); } catch {}
      });
    };
  }, [queryClient]);

  // Fetch live sessions with real-time updates
  const { data: liveData } = useQuery({
    queryKey: ['/api/live-sessions/mine', accessToken],
    queryFn: async () => {
      // Return dummy data for demonstration
      return { sessions: dummyDashboardData.liveSessions };
    },
    enabled: true, // Always enabled for dummy data
    refetchOnWindowFocus: true,
    refetchInterval: false,
    staleTime: 30000
  });

  const {
    enrollments = [],
    assignments = [],
    liveSessions = [],
    recommendations = { courses: [], products: [] },
    stats = {}
  } = dashboardData || {};

  const recommendedEnrollment = useMemo(() => {
    if (!Array.isArray(enrollments) || enrollments.length === 0) return null;
    const withActivity = enrollments
      .slice()
      .sort((a, b) => new Date(b.lastActivityAt || 0) - new Date(a.lastActivityAt || 0));
    return withActivity[0];
  }, [enrollments]);

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
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header skeleton */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-72 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Welcome card skeleton */}
          <div className="border-0 shadow-sm bg-white rounded-xl mb-8 p-8">
            <div className="space-y-4">
              <div className="h-7 w-80 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
              <div className="grid grid-cols-3 gap-6">
                {[0,1,2].map((i) => (
                  <div key={i} className="p-4 rounded-xl bg-gray-50">
                    <div className="h-8 w-12 mx-auto bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 w-20 mx-auto mt-2 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Key metrics skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[0,1,2,3].map((i) => (
              <div key={i} className="border-0 shadow-sm bg-white rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-3 w-28 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-7 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-100 rounded-xl animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom grid skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[0,1].map((i) => (
              <div key={i} className="border-0 shadow-sm bg-white rounded-xl p-6">
                <div className="space-y-4">
                  <div className="h-5 w-40 bg-gray-200 rounded animate-pulse"></div>
                  {[0,1,2].map((j) => (
                    <div key={j} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="h-5 w-12 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's your learning overview</p>
          </div>
        </div>

        {/* Compact Welcome Banner */}
        <CompactWelcome stats={stats} />

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Enrolled Courses</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    <AnimatedCounter value={enrollments.length} />
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
                    <AnimatedCounter value={assignments.filter(a => !a.submitted).length} />
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
                    <AnimatedCounter value={liveSessions?.length || 0} />
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
          {/* Enhanced Continue Learning */}
          <EnhancedContinueLearning enrollments={enrollments} />

          {/* This Week Progress - Circular */}
          <CircularProgress
            current={stats.weeklyStudyTime || 0}
            goal={weeklyGoalHours}
            onGoalChange={handleSaveWeeklyGoal}
            unit="hours"
            label="This Week"
            className="lg:col-span-1"
          />
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
              {assignments.filter(a => a.submissionStatus !== 'submitted' && a.submissionStatus !== 'graded' && new Date(a.dueAt) > new Date()).length > 0 ? (
                <div className="space-y-4">
                  {assignments
                    .filter(a => a.submissionStatus !== 'submitted' && a.submissionStatus !== 'graded' && new Date(a.dueAt) > new Date())
                    .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))
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
                <EmptyAssignments />
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
              {liveSessions && liveSessions.length > 0 ? (
                <div className="space-y-4">
                  {liveSessions.slice(0, 3).map((session) => (
                    <div key={session._id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                        <Video className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{session.title}</h4>
                        <p className="text-sm text-gray-600">{session.instructorId?.username || 'Instructor'}</p>
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
                <EmptyLiveSessions />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Gear Up for Success Section */}
        <div className="mb-8">
          <GearUpForSuccess 
            products={recommendations.products || []} 
            enrollments={enrollments}
          />
        </div>

        {/* Discover What's Next */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <DiscoverWhatsNext 
            recommendations={recommendations}
            liveSessions={liveSessions}
            enrollments={enrollments}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
