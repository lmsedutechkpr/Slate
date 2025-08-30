import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../hooks/useAuth.js';
import { useQuery } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { buildApiUrl } from '../lib/utils.js';
import { useAuthRefresh } from '../hooks/useAuthRefresh.js';

const AdminStudentReport = () => {
  const { accessToken, authenticatedFetch } = useAuth();
  const { authLoading } = useAuthRefresh();
  const [, params] = useRoute('/admin/students/:id');
  const [, setLocation] = useLocation();
  const userId = params?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['/api/admin/users', userId, 'progress'],
    queryFn: async () => {
      const res = await authenticatedFetch(buildApiUrl(`/api/admin/users/${userId}/progress`));
      if (!res.ok) throw new Error('Failed to fetch student progress');
      return res.json();
    },
    enabled: !!accessToken && !authLoading && !!userId
  });

  const progress = data?.progress || [];

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
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Student Report</h1>
          <p className="text-gray-600">Recent progress and enrollments</p>
        </div>
        <Button variant="outline" onClick={() => setLocation('/admin/students')}>Back to Students</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enrollments</CardTitle>
          <CardDescription>Course progress snapshot</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : progress.length === 0 ? (
            <div className="text-sm text-gray-500">No enrollments found</div>
          ) : (
            <ul className="space-y-2">
              {progress.map((p, idx) => (
                <li key={idx} className="p-3 border rounded-lg">
                  <div className="font-medium">{p.course?.title || 'Unknown Course'}</div>
                  <div className="text-xs text-gray-500">Progress: {p.progressPct || 0}% • XP: {p.xp || 0}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStudentReport;
