import { useQuery } from '@tanstack/react-query';
import { useRealtimeInvalidate } from '@/lib/useRealtimeInvalidate.js';
import { useAuth } from '../hooks/useAuth.js';
import { buildApiUrl } from '../lib/utils.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingSpinner from '../components/Common/LoadingSpinner.jsx';
import { 
  TrendingUp, 
  Award, 
  Clock, 
  BookOpen, 
  Target, 
  Calendar,
  Star,
  Trophy,
  CheckCircle,
  Play,
  Users,
  BarChart3,
  Activity,
  Zap,
  Eye,
  CalendarDays,
  Target as TargetIcon
} from 'lucide-react';

const Progress = () => {
  const { user, accessToken, authenticatedFetch } = useAuth();

  // Comprehensive dummy data for student progress
  const dummyProgressData = {
    stats: {
      enrolledCourses: 3,
      completedCourses: 0,
      studyTime: '15h 30m',
      achievements: 3,
      dayStreak: 5,
      xpPoints: 1250,
      totalAssignments: 5,
      completedAssignments: 1,
      averageGrade: 85
    },
    learningProgress: {
      courseCompletion: 45,
      assignmentProgress: 60,
      studyConsistency: 90
    },
    streak: {
      current: 5,
      longest: 10,
      last7Days: [
        { date: '2024-01-14', active: true, hours: 2.5 },
        { date: '2024-01-15', active: true, hours: 3.0 },
        { date: '2024-01-16', active: true, hours: 1.5 },
        { date: '2024-01-17', active: true, hours: 2.0 },
        { date: '2024-01-18', active: true, hours: 2.5 },
        { date: '2024-01-19', active: false, hours: 0 },
        { date: '2024-01-20', active: true, hours: 4.0 }
      ]
    },
    recentActivity: [
      {
        _id: '1',
        type: 'assignment_submitted',
        title: 'React Todo Application',
        description: 'Submitted assignment for React.js Complete Guide',
        timestamp: '2024-01-25T14:30:00.000Z',
        course: 'React.js Complete Guide',
        points: 85
      },
      {
        _id: '2',
        type: 'lesson_completed',
        title: 'React Hooks Deep Dive',
        description: 'Completed lesson 8 in Complete Web Development Bootcamp',
        timestamp: '2024-01-24T16:45:00.000Z',
        course: 'Complete Web Development Bootcamp',
        points: 25
      },
      {
        _id: '3',
        type: 'course_enrolled',
        title: 'Node.js Backend Development',
        description: 'Enrolled in new course',
        timestamp: '2024-01-23T10:20:00.000Z',
        course: 'Node.js Backend Development',
        points: 10
      },
      {
        _id: '4',
        type: 'achievement_earned',
        title: 'First Assignment',
        description: 'Completed your first assignment',
        timestamp: '2024-01-22T18:15:00.000Z',
        course: 'React.js Complete Guide',
        points: 50
      },
      {
        _id: '5',
        type: 'lesson_completed',
        title: 'CSS Grid Layout',
        description: 'Completed lesson 12 in Complete Web Development Bootcamp',
        timestamp: '2024-01-21T14:30:00.000Z',
        course: 'Complete Web Development Bootcamp',
        points: 25
      }
    ],
    courses: [
      {
        _id: '1',
        title: 'Complete Web Development Bootcamp',
        coverUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop',
        progress: 65,
        totalLessons: 24,
        completedLessons: 15,
        status: 'active',
        lastAccessed: '2024-01-20T15:30:00.000Z',
        instructor: 'Sarah Wilson',
        category: 'Web Development'
      },
      {
        _id: '2',
        title: 'React.js Complete Guide',
        coverUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop',
        progress: 45,
        totalLessons: 18,
        completedLessons: 8,
        status: 'active',
        lastAccessed: '2024-01-19T14:20:00.000Z',
        instructor: 'John Doe',
        category: 'Frontend Development'
      },
      {
        _id: '3',
        title: 'Node.js Backend Development',
        coverUrl: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&h=450&fit=crop',
        progress: 30,
        totalLessons: 20,
        completedLessons: 6,
        status: 'active',
        lastAccessed: '2024-01-18T16:45:00.000Z',
        instructor: 'Mike Johnson',
        category: 'Backend Development'
      }
    ]
  };

  const dummyAchievementsData = {
    achievements: [
      {
        _id: '1',
        title: 'First Assignment',
        description: 'Complete your first assignment',
        icon: '🎯',
        earnedAt: '2024-01-22T18:15:00.000Z',
        points: 50,
        category: 'milestone'
      },
      {
        _id: '2',
        title: 'Study Streak',
        description: 'Study for 5 consecutive days',
        icon: '🔥',
        earnedAt: '2024-01-20T00:00:00.000Z',
        points: 100,
        category: 'consistency'
      },
      {
        _id: '3',
        title: 'Quick Learner',
        description: 'Complete 10 lessons in one week',
        icon: '⚡',
        earnedAt: '2024-01-18T12:30:00.000Z',
        points: 75,
        category: 'speed'
      },
      {
        _id: '4',
        title: 'Course Explorer',
        description: 'Enroll in 3 different courses',
        icon: '📚',
        earnedAt: '2024-01-15T10:20:00.000Z',
        points: 60,
        category: 'diversity'
      },
      {
        _id: '5',
        title: 'Night Owl',
        description: 'Study after 10 PM',
        icon: '🦉',
        earnedAt: '2024-01-12T22:45:00.000Z',
        points: 30,
        category: 'habits'
      }
    ],
    availableAchievements: [
      {
        _id: '6',
        title: 'Perfect Score',
        description: 'Get 100% on an assignment',
        icon: '💯',
        points: 150,
        category: 'excellence',
        progress: 85
      },
      {
        _id: '7',
        title: 'Social Learner',
        description: 'Participate in 5 live sessions',
        icon: '👥',
        points: 80,
        category: 'engagement',
        progress: 2
      },
      {
        _id: '8',
        title: 'Course Master',
        description: 'Complete your first course',
        icon: '🏆',
        points: 200,
        category: 'milestone',
        progress: 65
      }
    ]
  };

  // Fetch progress data with real-time updates
  const { data: progressData, isLoading } = useQuery({
    queryKey: ['/api/students/progress', accessToken],
    queryFn: async () => {
      // Return dummy data for demonstration
      return dummyProgressData;
    },
    enabled: true, // Always enabled for dummy data
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Fetch achievements with real-time updates
  const { data: achievementsData } = useQuery({
    queryKey: ['/api/students/achievements', accessToken],
    queryFn: async () => {
      // Return dummy data for demonstration
      return dummyAchievementsData;
    },
    enabled: true, // Always enabled for dummy data
    refetchInterval: 30000,
  });

  // Fetch learning analytics with real-time updates
  const { data: analyticsData } = useQuery({
    queryKey: ['/api/students/analytics', accessToken],
    queryFn: async () => {
      const response = await authenticatedFetch(buildApiUrl('/api/students/analytics'));
      if (!response.ok) return { analytics: {} };
      return response.json();
    },
    enabled: !!accessToken,
    refetchInterval: 30000,
  });

  useRealtimeInvalidate([
    ['/api/students/progress'],
    ['/api/students/achievements'],
    ['/api/students/analytics']
  ], ['progress', 'achievements', 'analytics']);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  const progress = progressData?.progress || {};
  const achievements = achievementsData?.achievements || [];
  const analytics = analyticsData?.analytics || {};

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
      year: 'numeric'
    });
  };

  const getAchievementIcon = (type) => {
    switch (type) {
      case 'first_course': return <BookOpen className="w-5 h-5" />;
      case 'streak': return <Zap className="w-5 h-5" />;
      case 'completion': return <CheckCircle className="w-5 h-5" />;
      case 'excellence': return <Star className="w-5 h-5" />;
      default: return <Award className="w-5 h-5" />;
    }
  };

  const getAchievementColor = (type) => {
    switch (type) {
      case 'first_course': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'streak': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'completion': return 'bg-green-50 text-green-600 border-green-200';
      case 'excellence': return 'bg-purple-50 text-purple-600 border-purple-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Progress</h1>
              <p className="text-gray-600 mt-1">Track your learning journey and achievements</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live updates</span>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Enrolled Courses</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {progress.enrolledCourses || 0}
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
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {progress.completedCourses || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
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
                    {formatTime(progress.totalStudyTime || 0)}
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
                  <p className="text-sm font-medium text-gray-600">Achievements</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {achievements.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                </div>
            </div>
          </CardContent>
        </Card>
      </div>

        {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-fit bg-white shadow-sm">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700">
              Overview
            </TabsTrigger>
            <TabsTrigger value="courses" className="data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700">
              My Courses
            </TabsTrigger>
            <TabsTrigger value="achievements" className="data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700">
              Achievements
            </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Overall Progress */}
              <Card className="border-0 shadow-sm bg-white lg:col-span-2">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Learning Progress</CardTitle>
                  <CardDescription>Your overall learning metrics</CardDescription>
              </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-gray-700">Course Completion</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {Math.round(progress.overallProgress || 0)}%
                      </span>
                    </div>
                    <ProgressBar 
                      value={progress.overallProgress || 0} 
                      className="h-3 bg-gray-100"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-gray-700">Assignment Progress</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {Math.round(progress.assignmentProgress || 0)}%
                      </span>
                    </div>
                    <ProgressBar 
                      value={progress.assignmentProgress || 0} 
                      className="h-3 bg-gray-100"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-gray-700">Study Consistency</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {Math.round(progress.studyConsistency || 0)}%
                      </span>
                    </div>
                    <ProgressBar 
                      value={progress.studyConsistency || 0} 
                      className="h-3 bg-gray-100"
                    />
                  </div>
              </CardContent>
            </Card>

              {/* Learning Streak */}
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Learning Streak</CardTitle>
                  <CardDescription>Keep the momentum going</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="text-center space-y-4">
                    <div className="flex justify-center space-x-6">
                        <div>
                        <div className="text-2xl font-bold text-primary-600">
                          {progress.currentStreak || 0}
                        </div>
                        <div className="text-xs text-gray-600">Current</div>
                          </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-600">
                          {progress.longestStreak || 0}
                        </div>
                        <div className="text-xs text-gray-600">Longest</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-center space-x-1">
                      {Array.from({ length: 7 }, (_, i) => (
                        <div
                          key={i}
                          className={`w-6 h-6 rounded-md ${
                            i < (progress.currentStreak || 0) 
                              ? 'bg-primary-500' 
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">Last 7 days</p>
                  </div>
              </CardContent>
            </Card>
            </div>

            {/* Recent Activity */}
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Recent Activity</CardTitle>
                <CardDescription>Your latest learning activities</CardDescription>
              </CardHeader>
              <CardContent>
                {progress.recentActivity && progress.recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {progress.recentActivity.slice(0, 5).map((activity, index) => (
                      <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                          <Play className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                          <p className="text-xs text-gray-500">{activity.timestamp}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {activity.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">No recent activity</p>
                    <p className="text-sm text-gray-500 mt-1">Start learning to see your activity here</p>
                  </div>
                )}
              </CardContent>
            </Card>
        </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            {progress.courses && progress.courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {progress.courses.map((course) => (
                  <Card key={course._id} className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                          <CardDescription className="mt-1">{course.instructor}</CardDescription>
                        </div>
                        <Badge 
                          variant={course.status === 'completed' ? 'default' : 'secondary'}
                          className="ml-2 flex-shrink-0"
                        >
                          {course.status === 'completed' ? 'Completed' : 'In Progress'}
                        </Badge>
                      </div>
              </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Progress</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {Math.round(course.progress || 0)}%
                          </span>
                        </div>
                        <ProgressBar 
                          value={course.progress || 0} 
                          className="h-2 bg-gray-100"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-gray-600 text-xs">Lessons</p>
                          <p className="font-semibold text-gray-900">
                            {course.completedLessons || 0}/{course.totalLessons || 0}
                          </p>
                    </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-gray-600 text-xs">Time Spent</p>
                          <p className="font-semibold text-gray-900">
                            {formatTime(course.timeSpent || 0)}
                          </p>
                    </div>
                  </div>
                  
                      {course.grade && (
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-medium">Grade: {course.grade}</span>
                    </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                    </div>
            ) : (
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-12 text-center">
                  <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses yet</h3>
                  <p className="text-gray-600 mb-4">Enroll in your first course to start tracking progress</p>
                  <button className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                    <Eye className="w-4 h-4 mr-2" />
                    Browse Courses
                  </button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            {achievements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.map((achievement) => (
                  <Card key={achievement._id} className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
                    <CardContent className="p-6 text-center">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center border-2 ${getAchievementColor(achievement.type)}`}>
                        {getAchievementIcon(achievement.type)}
                    </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{achievement.title}</h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{achievement.description}</p>
                      <div className="flex items-center justify-center space-x-2">
                        <CalendarDays className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {formatDate(achievement.earnedAt)}
                        </span>
                </div>
              </CardContent>
            </Card>
                ))}
                  </div>
            ) : (
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-12 text-center">
                  <Trophy className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No achievements yet</h3>
                  <p className="text-gray-600 mb-4">Complete courses and assignments to earn achievements</p>
                  <div className="flex justify-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <TargetIcon className="w-4 h-4 mr-1" />
                      Set goals
                </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Complete courses
                  </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      Earn badges
                  </div>
                </div>
              </CardContent>
            </Card>
            )}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default Progress;
