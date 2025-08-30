import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../hooks/useAuth.js';
import { useQuery } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { buildApiUrl } from '../lib/utils.js';
import { useAuthRefresh } from '../hooks/useAuthRefresh.js';

const AdminInstructorDetail = () => {
  const { accessToken, authenticatedFetch } = useAuth();
  const { authLoading } = useAuthRefresh();
  const [, params] = useRoute('/admin/instructors/:id');
  const [, setLocation] = useLocation();
  const instructorId = params?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['/api/admin/analytics/instructors', instructorId],
    queryFn: async () => {
      const res = await authenticatedFetch(buildApiUrl(`/api/admin/analytics/instructors/${instructorId}`));
      if (!res.ok) throw new Error('Failed to load instructor analytics');
      return res.json();
    },
    enabled: !!accessToken && !authLoading && !!instructorId
  });

  const instructor = data?.instructor;
  const stats = data?.statistics;

  // Show loading state while authentication is in progress
  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Instructor Detail</h1>
          <p className="text-gray-600">Performance across assigned courses</p>
        </div>
        <Button variant="outline" onClick={() => setLocation('/admin/instructors')}>Back to Instructors</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isLoading ? 'Loading...' : instructor?.username}</CardTitle>
          <CardDescription>{instructor?.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Courses" value={stats?.totalCourses || 0} />
            <Stat label="Published" value={stats?.publishedCourses || 0} />
            <Stat label="Enrollments" value={stats?.totalEnrollments || 0} />
            <Stat label="Students" value={stats?.totalStudents || 0} />
          </div>
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

export default AdminInstructorDetail;
