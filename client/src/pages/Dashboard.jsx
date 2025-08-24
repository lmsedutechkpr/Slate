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
    staleTime: 5 * 60 * 1000, // 5 minutes
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

      {/* Live Classes and Store Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Live Classes */}
        <LiveClasses />

        {/* Store Section */}
        <StoreSection products={recommendations.products} />
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button 
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          data-testid="button-floating-action"
          onClick={() => {
            // Quick actions menu would be implemented here
            console.log('Quick actions menu');
          }}
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
