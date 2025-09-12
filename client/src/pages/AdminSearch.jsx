import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useLocation } from 'wouter';

const AdminSearch = () => {
  const [location, setLocation] = useLocation();
  const q = useMemo(() => {
    try {
      const u = new URL(location, window.location.origin);
      return u.searchParams.get('q') || '';
    } catch { return ''; }
  }, [location]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Search</h1>
          <p className="text-sm lg:text-base text-gray-600">Results for: {q || '—'}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-600 text-sm">This page will aggregate results across users, courses, instructors, and store.</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSearch;


