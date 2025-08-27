import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth.js';
import DashboardWelcome from '../components/Dashboard/DashboardWelcome.jsx';
import CurrentLearning from '../components/Dashboard/CurrentLearning.jsx';
import ProgressSummary from '../components/Dashboard/ProgressSummary.jsx';
import UpcomingAssignments from '../components/Dashboard/UpcomingAssignments.jsx';
import RecommendedCourses from '../components/Dashboard/RecommendedCourses.jsx';
import LiveClasses from '../components/Dashboard/LiveClasses.jsx';
import StoreSection from '../components/Dashboard/StoreSection.jsx';
import LoadingSpinner from '../components/Common/LoadingSpinner.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus } from 'lucide-react';

const Dashboard = () => {
  const { user, accessToken } = useAuth();
  
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard', accessToken],
    queryFn: async () => {
      const response = await fetch('/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      return response.json();
    },
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: liveData } = useQuery({
    queryKey: ['/api/live-sessions/mine', accessToken],
    queryFn: async () => {
      const response = await fetch('/api/live-sessions/mine', {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        cache: 'no-store'
      });
      if (!response.ok) throw new Error('Failed to fetch live sessions');
      return response.json();
    },
    enabled: !!accessToken,
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load dashboard data. Please refresh the page or try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const {
    enrollments = [],
    assignments = [],
    recommendations = { courses: [], products: [] },
    stats = {}
  } = dashboardData || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <DashboardWelcome stats={stats} />

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Current Learning Section */}
        <CurrentLearning enrollments={enrollments} />

        {/* Progress Summary */}
        <ProgressSummary stats={stats} />
      </div>

      {/* Upcoming and Recommended Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Upcoming Assignments */}
        <UpcomingAssignments assignments={assignments} />

        {/* Recommended Courses */}
        <RecommendedCourses courses={recommendations.courses} />
      </div>

      {/* Live Classes and Store Section (only if DB provides) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <LiveClasses liveSessions={liveData?.sessions || []} />
        <StoreSection products={recommendations.products} />
      </div>
    </div>
  );
};

export default Dashboard;
