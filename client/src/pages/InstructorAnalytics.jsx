import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth.js';
import { buildApiUrl } from '../lib/utils.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import LoadingSpinner from '../components/Common/LoadingSpinner.jsx';

const InstructorAnalytics = () => {
  const { accessToken, user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['/api/instructor/analytics', user?._id, accessToken],
    queryFn: async () => {
      const res = await fetch(buildApiUrl('/api/instructor/analytics'), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) return { instructor: null, stats: {}, coursePerformance: [] };
      return res.json();
    },
    enabled: !!accessToken && !!user?._id,
    refetchInterval: 30000
  });

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


