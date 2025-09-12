import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth.js';
import { buildApiUrl } from '../../lib/utils.js';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  BookOpen, 
  Award, 
  Clock,
  Users,
  Star
} from 'lucide-react';

const PersonalizedRecommendations = ({ enrollments = [] }) => {
  const { accessToken, authenticatedFetch } = useAuth();

  // Get user's completed courses for context
  const completedCourses = enrollments.filter(e => e.isCompleted);
  const recentCourses = enrollments
    .filter(e => e.lastActivityAt)
    .sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt))
    .slice(0, 3);

  // Fetch personalized recommendations
  const { data: recommendationsData, isLoading } = useQuery({
    queryKey: ['/api/recommendations', accessToken],
    queryFn: async () => {
      const response = await authenticatedFetch(buildApiUrl('/api/recommendations'));
      if (!response.ok) return { courses: [], context: null };
      return response.json();
    },
    enabled: !!accessToken,
    refetchInterval: 30000,
  });

  const recommendations = recommendationsData?.courses || [];
  const context = recommendationsData?.context;

  const getRecommendationContext = () => {
    if (completedCourses.length > 0) {
      const latestCompleted = completedCourses[0];
      return {
        type: 'completion',
        course: latestCompleted.courseId?.title || 'a course',
        message: `Since you completed "${latestCompleted.courseId?.title || 'a course'}", you might like these advanced courses.`
      };
    }
    
    if (recentCourses.length > 0) {
      const recentCourse = recentCourses[0];
      return {
        type: 'activity',
        course: recentCourse.courseId?.title || 'a course',
        message: `Based on your interest in "${recentCourse.courseId?.title || 'recent courses'}", here are some related recommendations.`
      };
    }

    return {
      type: 'general',
      course: null,
      message: 'Based on popular courses and trending topics, here are some recommendations for you.'
    };
  };

  const recommendationContext = getRecommendationContext();

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 mb-6">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card className="border-0 shadow-sm bg-gradient-to-r from-gray-50 to-gray-100 mb-6">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">No recommendations yet</h3>
              <p className="text-sm text-gray-600">Complete a course to get personalized suggestions</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 mb-6">
      <CardContent className="p-6">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">Personalized for You</h3>
            <p className="text-sm text-gray-700 mb-4">{recommendationContext.message}</p>
            
            {/* Quick stats about recommendations */}
            <div className="flex items-center space-x-4 text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                <BookOpen className="w-3 h-3" />
                <span>{recommendations.length} courses</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3" />
                <span>
                  Avg. {recommendations.reduce((sum, course) => sum + (course.rating?.average || 0), 0) / recommendations.length || 0}★
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span>
                  {recommendations.reduce((sum, course) => sum + (course.enrollmentCount || 0), 0).toLocaleString()} students
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalizedRecommendations;
