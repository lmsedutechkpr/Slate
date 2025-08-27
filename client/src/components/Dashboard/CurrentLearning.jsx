import { Link } from 'wouter';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const CurrentLearning = ({ enrollments = [] }) => {
  if (!enrollments.length) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Continue Learning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No courses enrolled yet</p>
            <Link href="/courses">
              <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">
                Browse Courses
              </button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <Card className="lg:col-span-2 card-hover">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Continue Learning
          </CardTitle>
          <Link href="/courses">
            <button 
              className="text-primary-600 text-sm hover:text-primary-700"
              data-testid="link-view-all-courses"
            >
              View All
            </button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {enrollments.slice(0, 2).map((enrollment) => {
          const course = enrollment && enrollment.courseId ? enrollment.courseId : null;
          if (!course) return null;
          const progress = enrollment.progressPct || 0;
          const totalLectures = (course.sections || []).reduce((total, section) => 
            total + (section.lectures?.length || 0), 0) || 0;
          const completedLectures = enrollment.completedLectures?.length || 0;
          
          return (
            <div 
              key={enrollment._id || Math.random().toString(36)}
              className="border border-gray-200 rounded-xl p-4 hover:border-primary-300 transition-colors"
              data-testid={`course-card-${course?._id || 'unknown'}`}
            >
              <div className="flex items-start space-x-4">
                {/* Course thumbnail */}
                <div className="w-20 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  {course.coverUrl ? (
                    <img 
                      src={course.coverUrl} 
                      alt={`${course.title} thumbnail`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-gray-400 text-xs text-center">
                      {course.title.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900" data-testid={`course-title-${course?._id || 'unknown'}`}>
                        {course.title}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {enrollment.lastLectureId ? 'Continue where you left off' : 'Start learning'}
                      </p>
                    </div>
                    <Badge 
                      variant={progress > 70 ? 'default' : 'secondary'}
                      className={progress > 70 ? 'bg-green-100 text-green-700' : 'bg-primary-100 text-primary-700'}
                      data-testid={`progress-badge-${course?._id || 'unknown'}`}
                    >
                      {Math.round(progress)}% Complete
                    </Badge>
                  </div>
                  
                  <Progress 
                    value={progress} 
                    className="mb-2"
                    data-testid={`progress-bar-${course?._id || 'unknown'}`}
                  />
                  
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>
                      {completedLectures} of {totalLectures} lessons completed
                    </span>
                    <span>
                      {course.estimatedHours ? formatDuration(course.estimatedHours * 3600) : 'Duration varies'}
                    </span>
                  </div>
                  
                  <Link href={`/courses/${course?._id || ''}`}>
                    <button 
                      className="mt-2 text-sm bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700 transition-colors"
                      data-testid={`button-continue-${course?._id || 'unknown'}`}
                    >
                      Continue Learning
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default CurrentLearning;
