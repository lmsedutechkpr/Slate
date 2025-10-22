import { useQuery } from '@tanstack/react-query';
import { useRealtimeInvalidate } from '@/lib/useRealtimeInvalidate.js';
import { useAuth } from '../hooks/useAuth.js';
import { buildApiUrl } from '../lib/utils.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import LoadingSpinner from '../components/Common/LoadingSpinner.jsx';

const InstructorAnalytics = () => {
  const { accessToken, user } = useAuth();

  // Comprehensive dummy data for instructor analytics
  const dummyAnalyticsData = {
    instructor: {
      _id: user?._id,
      profile: { firstName: 'John', lastName: 'Doe' },
      email: 'john.doe@example.com'
    },
    stats: {
      totalCourses: 3,
      publishedCourses: 3,
      totalStudents: 312,
      totalEnrollments: 456,
      avgRating: 4.7,
      totalRevenue: 125000,
      monthlyGrowth: 12.5,
      activeStudents: 267,
      completionRate: 78.5,
      satisfactionScore: 4.6
    },
    coursePerformance: [
      {
        _id: '1',
        title: 'Complete Web Development Bootcamp',
        enrollments: 156,
        completionRate: 82.5,
        avgRating: 4.8,
        revenue: 62000,
        students: 156,
        assignments: 8,
        avgGrade: 87.5
      },
      {
        _id: '2',
        title: 'React.js Complete Guide',
        enrollments: 89,
        completionRate: 75.2,
        avgRating: 4.6,
        revenue: 35000,
        students: 89,
        assignments: 6,
        avgGrade: 82.3
      },
      {
        _id: '3',
        title: 'Node.js Backend Development',
        enrollments: 67,
        completionRate: 68.9,
        avgRating: 4.7,
        revenue: 28000,
        students: 67,
        assignments: 7,
        avgGrade: 78.9
      }
    ],
    recentActivity: [
      { action: 'New student enrolled in Web Development Bootcamp', timestamp: '2024-01-20T15:30:00.000Z' },
      { action: 'Assignment graded for React.js Guide', timestamp: '2024-01-20T14:20:00.000Z' },
      { action: 'Live session completed: Node.js Best Practices', timestamp: '2024-01-20T13:15:00.000Z' },
      { action: 'Course updated: Complete Web Development Bootcamp', timestamp: '2024-01-20T12:00:00.000Z' }
    ],
    trends: {
      enrollments: [
        { month: 'Oct 2023', count: 45 },
        { month: 'Nov 2023', count: 52 },
        { month: 'Dec 2023', count: 38 },
        { month: 'Jan 2024', count: 67 },
        { month: 'Feb 2024', count: 89 }
      ],
      revenue: [
        { month: 'Oct 2023', amount: 18000 },
        { month: 'Nov 2023', amount: 22000 },
        { month: 'Dec 2023', amount: 15000 },
        { month: 'Jan 2024', amount: 35000 },
        { month: 'Feb 2024', amount: 45000 }
      ]
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['/api/instructor/analytics', user?._id, accessToken],
    queryFn: async () => {
      // Return dummy data for demonstration
      return dummyAnalyticsData;
    },
    enabled: true, // Always enabled for dummy data
    refetchInterval: 30000
  });

  useRealtimeInvalidate([
    ['/api/instructor/analytics', user?._id]
  ], ['instructor', 'analytics']);

  if (isLoading) return <LoadingSpinner />;

  const stats = data?.stats || {};
  const perf = data?.coursePerformance || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Instructor Analytics</h1>
          <p className="text-gray-600 mt-2">Overview of your performance</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="text-sm text-gray-600">Total Courses</div><div className="text-2xl font-bold">{stats.totalCourses || 0}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-gray-600">Published</div><div className="text-2xl font-bold">{stats.publishedCourses || 0}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-gray-600">Students</div><div className="text-2xl font-bold">{stats.totalStudents || 0}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-gray-600">Enrollments</div><div className="text-2xl font-bold">{stats.totalEnrollments || 0}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Performance</CardTitle>
          <CardDescription>Average progress and enrollments for your courses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {perf.map((c) => (
              <div key={c.courseId} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{c.title}</div>
                  <div className="text-sm text-gray-600">{c.enrollments} enrollments</div>
                </div>
                <div className="text-sm text-gray-600">Avg progress: <span className="font-semibold">{c.avgProgress}%</span></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstructorAnalytics;


