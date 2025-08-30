import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../hooks/useAuth.js';
import { useQuery } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { buildApiUrl } from '../lib/utils.js';

const AdminCourseDetail = () => {
  const { accessToken } = useAuth();
  const [, params] = useRoute('/admin/courses/:id');
  const [, setLocation] = useLocation();
  const courseId = params?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['/api/courses', courseId],
    queryFn: async () => {
      const res = await fetch(buildApiUrl(`/api/courses/${courseId}`), { headers: { 'Authorization': `Bearer ${accessToken}` } });
      if (!res.ok) throw new Error('Failed to load course');
      return res.json();
    },
    enabled: !!accessToken && !!courseId
  });

  const { data: analytics } = useQuery({
    queryKey: ['/api/admin/analytics/courses', courseId],
    queryFn: async () => {
      const res = await fetch(buildApiUrl(`/api/admin/analytics/courses/${courseId}`), { headers: { 'Authorization': `Bearer ${accessToken}` } });
      if (!res.ok) throw new Error('Failed to load course analytics');
      return res.json();
    },
    enabled: !!accessToken && !!courseId
  });

  const course = data?.course || data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Course Detail</h1>
          <p className="text-gray-600">Inspect course info and performance</p>
        </div>
        <Button variant="outline" onClick={() => setLocation('/admin/courses')}>Back to Courses</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isLoading ? 'Loading...' : course?.title}</CardTitle>
          <CardDescription>{course?.category} · {course?.level}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-700">{course?.description}</div>
          <div className="mt-3 text-sm text-gray-500">Instructor: {course?.assignedInstructor?.username || 'Unassigned'}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance</CardTitle>
          <CardDescription>Live analytics snapshot</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat label="Enrollments" value={analytics.statistics.totalEnrollments} />
              <Stat label="Active" value={analytics.statistics.activeEnrollments} />
              <Stat label="Completed" value={analytics.statistics.completedEnrollments} />
              <Stat label="Avg Progress" value={`${analytics.statistics.avgProgress}%`} />
            </div>
          ) : (
            <div className="text-sm text-gray-500">Loading analytics...</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const Stat = ({ label, value }) => (
  <div className="p-4 border rounded-lg">
    <div className="text-xs text-gray-500">{label}</div>
    <div className="text-xl font-semibold">{value}</div>
  </div>
);

export default AdminCourseDetail;
