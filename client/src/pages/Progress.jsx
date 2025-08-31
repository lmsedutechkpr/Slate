import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth.js';
import { buildApiUrl } from '../lib/utils.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Zap
} from 'lucide-react';

const Progress = () => {
  const { user, accessToken, authenticatedFetch } = useAuth();

  // Fetch progress data
  const { data: progressData, isLoading } = useQuery({
    queryKey: ['/api/students/progress', accessToken],
    queryFn: async () => {
      const response = await authenticatedFetch(buildApiUrl('/api/students/progress'));
      if (!response.ok) throw new Error('Failed to fetch progress data');
      return response.json();
    },
    enabled: !!accessToken,
  });

  // Fetch achievements
  const { data: achievementsData } = useQuery({
    queryKey: ['/api/students/achievements', accessToken],
    queryFn: async () => {
      const response = await authenticatedFetch(buildApiUrl('/api/students/achievements'));
      if (!response.ok) return { achievements: [] };
      return response.json();
    },
    enabled: !!accessToken,
  });

  // Fetch learning analytics
  const { data: analyticsData } = useQuery({
    queryKey: ['/api/students/analytics', accessToken],
    queryFn: async () => {
      const response = await authenticatedFetch(buildApiUrl('/api/students/analytics'));
      if (!response.ok) return { analytics: {} };
      return response.json();
    },
    enabled: !!accessToken,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  const progress = progressData?.progress || {};
  const achievements = achievementsData?.achievements || [];
  const analytics = analyticsData?.analytics || {};

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getAchievementIcon = (type) => {
    switch (type) {
      case 'first_course': return <BookOpen className="w-6 h-6" />;
      case 'streak': return <Zap className="w-6 h-6" />;
      case 'completion': return <CheckCircle className="w-6 h-6" />;
      case 'excellence': return <Star className="w-6 h-6" />;
      default: return <Award className="w-6 h-6" />;
    }
  };

  const getAchievementColor = (type) => {
    switch (type) {
      case 'first_course': return 'bg-blue-100 text-blue-700';
      case 'streak': return 'bg-yellow-100 text-yellow-700';
      case 'completion': return 'bg-green-100 text-green-700';
      case 'excellence': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Progress</h1>
        <p className="text-gray-600">Track your learning journey and achievements</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Enrolled Courses</p>
                <p className="text-2xl font-bold text-gray-900">{progress.enrolledCourses || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed Courses</p>
                <p className="text-2xl font-bold text-gray-900">{progress.completedCourses || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Study Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatTime(progress.totalStudyTime || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Achievements</p>
                <p className="text-2xl font-bold text-gray-900">{achievements.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-fit">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Overall Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Overall Progress</CardTitle>
                <CardDescription>Your learning journey overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Course Completion</span>
                    <span>{Math.round(progress.overallProgress || 0)}%</span>
                  </div>
                  <Progress value={progress.overallProgress || 0} className="h-3" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Assignment Completion</span>
                    <span>{Math.round(progress.assignmentProgress || 0)}%</span>
                  </div>
                  <Progress value={progress.assignmentProgress || 0} className="h-3" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Study Consistency</span>
                    <span>{Math.round(progress.studyConsistency || 0)}%</span>
                  </div>
                  <Progress value={progress.studyConsistency || 0} className="h-3" />
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest learning activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {progress.recentActivity?.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <Play className="w-4 h-4 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-gray-500">{activity.timestamp}</p>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-4 text-gray-500">
                      No recent activity
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Learning Streak */}
          <Card>
            <CardHeader>
              <CardTitle>Learning Streak</CardTitle>
              <CardDescription>Maintain your momentum</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600">
                    {progress.currentStreak || 0}
                  </div>
                  <div className="text-sm text-gray-600">Current Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {progress.longestStreak || 0}
                  </div>
                  <div className="text-sm text-gray-600">Longest Streak</div>
                </div>
                <div className="flex-1">
                  <div className="flex space-x-1">
                    {Array.from({ length: 7 }, (_, i) => (
                      <div
                        key={i}
                        className={`w-8 h-8 rounded ${
                          i < (progress.currentStreak || 0) 
                            ? 'bg-primary-500' 
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Last 7 days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {progress.courses?.map((course) => (
              <Card key={course._id}>
                <CardHeader>
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <CardDescription>{course.instructor}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>{Math.round(course.progress || 0)}%</span>
                    </div>
                    <Progress value={course.progress || 0} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Lessons</p>
                      <p className="font-medium">{course.completedLessons}/{course.totalLessons}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Time Spent</p>
                      <p className="font-medium">{formatTime(course.timeSpent || 0)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge variant={course.status === 'completed' ? 'default' : 'secondary'}>
                      {course.status === 'completed' ? 'Completed' : 'In Progress'}
                    </Badge>
                    {course.grade && (
                      <Badge variant="outline">
                        Grade: {course.grade}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )) || (
              <div className="col-span-full text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
                <p className="text-gray-600">Enroll in your first course to start tracking progress</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement) => (
              <Card key={achievement._id}>
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${getAchievementColor(achievement.type)}`}>
                    {getAchievementIcon(achievement.type)}
                  </div>
                  <h3 className="font-semibold mb-2">{achievement.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                  <Badge variant="outline">
                    {new Date(achievement.earnedAt).toLocaleDateString()}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          {achievements.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Award className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No achievements yet</h3>
                <p className="text-gray-600">Complete courses and assignments to earn achievements</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Study Time Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Study Time Analytics</CardTitle>
                <CardDescription>Your learning patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Average daily study time</span>
                    <span className="font-medium">{formatTime(analytics.avgDailyStudyTime || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Most active day</span>
                    <span className="font-medium">{analytics.mostActiveDay || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total study sessions</span>
                    <span className="font-medium">{analytics.totalSessions || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
                <CardDescription>Your academic performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Average grade</span>
                    <span className="font-medium">{analytics.avgGrade || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Assignments completed</span>
                    <span className="font-medium">{analytics.assignmentsCompleted || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">On-time submissions</span>
                    <span className="font-medium">{analytics.onTimeSubmissions || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Learning Goals */}
          <Card>
            <CardHeader>
              <CardTitle>Learning Goals</CardTitle>
              <CardDescription>Track your learning objectives</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {progress.learningGoals?.map((goal, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{goal.title}</p>
                      <p className="text-sm text-gray-600">{goal.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{goal.progress}%</p>
                      <Progress value={goal.progress} className="w-20 h-2" />
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="mx-auto h-8 w-8 mb-2" />
                    <p>No learning goals set</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Progress;
