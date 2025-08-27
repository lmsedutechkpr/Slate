import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, Clock } from 'lucide-react';

const RecommendedCourses = ({ courses = [] }) => {
  const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-700';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700';
      case 'advanced':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (!courses.length) return null;

  return (
    <Card className="card-hover">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Recommended for You
          </CardTitle>
          <Link href="/courses">
            <button 
              className="text-primary-600 text-sm hover:text-primary-700"
              data-testid="link-browse-all-courses"
            >
              Browse All
            </button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {courses.slice(0, 2).map((course) => {
          const totalLectures = course.sections?.reduce((total, section) => 
            total + (section.lectures?.length || 0), 0) || 0;
          
          return (
            <div 
              key={course._id}
              className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors cursor-pointer"
              data-testid={`recommended-course-${course._id}`}
            >
              {/* Course thumbnail */}
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                {course.coverUrl ? (
                  <img 
                    src={course.coverUrl} 
                    alt={`${course.title} thumbnail`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <BookOpen className="h-6 w-6 text-gray-400" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {course.title}
                </h4>
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                  {course.description}
                </p>
                <div className="flex items-center space-x-2 flex-wrap">
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getLevelColor(course.level)}`}
                  >
                    {course.level || 'Beginner'}
                  </Badge>
                  <div className="flex items-center text-xs text-gray-500">
                    <Users className="h-3 w-3 mr-1" />
                    {course.enrollmentCount || 0}
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {totalLectures} lessons
                  </div>
                </div>
                <Link href={`/courses/${course._id}`}>
                  <button 
                    className="mt-2 text-xs bg-primary-600 text-white px-2 py-1 rounded hover:bg-primary-700 transition-colors"
                    data-testid={`button-enroll-${course._id}`}
                  >
                    View Course
                  </button>
                </Link>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default RecommendedCourses;
