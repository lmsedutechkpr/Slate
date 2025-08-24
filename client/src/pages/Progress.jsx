import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingSpinner from '../components/Common/LoadingSpinner.jsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Award, Calendar, Target, BookOpen, Clock, Zap } from 'lucide-react';

const Progress = () => {
  const { accessToken } = useAuth();

  // Fetch enrollments for progress data
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['/api/enrollments'],
    queryFn: async () => {
      const response = await fetch('/api/enrollments', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch enrollments');
      }
      
      return response.json();
    },
    enabled: !!accessToken,
  });

  // Fetch dashboard data for additional stats
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['/api/dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      return response.json();
    },
    enabled: !!accessToken,
  });

  const enrollments = enrollmentsData?.enrollments || [];
  const stats = dashboardData?.stats || {};

  // Calculate progress statistics
  const calculateStats = () => {
    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter(e => e.isCompleted).length;
    const totalXP = enrollments.reduce((sum, e) => sum + (e.xp || 0), 0);
    const averageProgress = totalCourses > 0 
      ? enrollments.reduce((sum, e) => sum + (e.progressPct || 0), 0) / totalCourses 
      : 0;

    return {
      totalCourses,
      completedCourses,
      totalXP,
      averageProgress,
      currentStreak: Math.max(...enrollments.map(e => e.streakCount || 0), 0)
    };
  };

  const progressStats = calculateStats();

  // Generate mock weekly data for charts
  const generateWeeklyData = () => {
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    return weeks.map((week, index) => ({
      week,
      hours: Math.floor(Math.random() * 15) + 5,
      xp: Math.floor(Math.random() * 200) + 50,
      progress: Math.min((index + 1) * 25, 100)
    }));
  };

  const weeklyData = generateWeeklyData();

  // Course progress data for pie chart
  const courseProgressData = enrollments.map(enrollment => ({
    name: enrollment.courseId?.title || 'Unknown Course',
    value: enrollment.progressPct || 0,
    xp: enrollment.xp || 0
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const AchievementCard = ({ icon: Icon, title, description, color }) => (
    <Card className="card-hover">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{title}</h4>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (enrollmentsLoading || dashboardLoading) {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Progress Dashboard</h1>
        <p className="text-gray-600">Track your learning journey and achievements</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary-600" data-testid="total-xp">
              {progressStats.totalXP.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total XP</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600" data-testid="completed-courses">
              {progressStats.completedCourses}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600" data-testid="active-courses">
              {progressStats.totalCourses}
            </div>
            <div className="text-sm text-gray-600">Active Courses</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600" data-testid="current-streak">
              {progressStats.currentStreak}
            </div>
            <div className="text-sm text-gray-600">Day Streak</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600" data-testid="average-progress">
              {Math.round(progressStats.averageProgress)}%
            </div>
            <div className="text-sm text-gray-600">Avg Progress</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-fit">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="courses" data-testid="tab-courses">Courses</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
          <TabsTrigger value="achievements" data-testid="tab-achievements">Achievements</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Weekly Activity
                </CardTitle>
                <CardDescription>
                  Your study hours over the past month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="hours" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* XP Progress Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  XP Progress
                </CardTitle>
                <CardDescription>
                  Experience points earned over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="xp" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Course Progress List */}
            <Card>
              <CardHeader>
                <CardTitle>Course Progress</CardTitle>
                <CardDescription>
                  Your progress in each enrolled course
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {enrollments.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">No courses enrolled yet</p>
                  </div>
                ) : (
                  enrollments.map((enrollment) => (
                    <div key={enrollment._id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{enrollment.courseId?.title}</h4>
                          <p className="text-sm text-gray-500">
                            {enrollment.completedLectures?.length || 0} lectures completed
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {Math.round(enrollment.progressPct || 0)}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {enrollment.xp || 0} XP
                          </div>
                        </div>
                      </div>
                      <ProgressBar value={enrollment.progressPct || 0} className="h-2" />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Course Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Course Distribution</CardTitle>
                <CardDescription>
                  Progress distribution across courses
                </CardDescription>
              </CardHeader>
              <CardContent>
                {courseProgressData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={courseProgressData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {courseProgressData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No course data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Learning Analytics</CardTitle>
                <CardDescription>
                  Detailed insights into your learning patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {stats.weeklyHours || 12.5}h
                      </div>
                      <div className="text-sm text-gray-600">This Week</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">94%</div>
                      <div className="text-sm text-gray-600">Avg Quiz Score</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Study Consistency</span>
                      <span className="text-sm font-medium">85%</span>
                    </div>
                    <ProgressBar value={85} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Assignment Completion</span>
                      <span className="text-sm font-medium">92%</span>
                    </div>
                    <ProgressBar value={92} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Goal Achievement</span>
                      <span className="text-sm font-medium">78%</span>
                    </div>
                    <ProgressBar value={78} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Study Goals</CardTitle>
                <CardDescription>
                  Track your learning objectives
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Target className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Weekly Goal</div>
                    <div className="text-sm text-gray-500">15 hours/week</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium">Monthly Target</div>
                    <div className="text-sm text-gray-500">Complete 2 courses</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="font-medium">Skill Focus</div>
                    <div className="text-sm text-gray-500">JavaScript & React</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AchievementCard
              icon={Award}
              title="Week Warrior"
              description="Maintained 7-day streak"
              color="bg-yellow-500"
            />
            <AchievementCard
              icon={Zap}
              title="Quiz Master"
              description="Perfect score on 5 quizzes"
              color="bg-blue-500"
            />
            <AchievementCard
              icon={BookOpen}
              title="Course Crusher"
              description="Completed first course"
              color="bg-green-500"
            />
            <AchievementCard
              icon={Target}
              title="Goal Getter"
              description="Met weekly study goal"
              color="bg-purple-500"
            />
            <AchievementCard
              icon={Clock}
              title="Early Bird"
              description="Studied 3 days before 9 AM"
              color="bg-orange-500"
            />
            <AchievementCard
              icon={TrendingUp}
              title="Progress Pioneer"
              description="50% overall progress"
              color="bg-indigo-500"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Progress;
