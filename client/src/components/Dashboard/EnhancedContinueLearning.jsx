import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Play, 
  Clock, 
  CheckCircle,
  ArrowRight,
  Users,
  Star,
  Target
} from 'lucide-react';

const EnhancedContinueLearning = ({ enrollments = [] }) => {
  const formatDuration = (seconds) => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getLastLesson = (enrollment) => {
    if (!enrollment.course?.sections) return null;
    
    // Find the last accessed lecture
    let lastLecture = null;
    let lastSection = null;
    
    for (const section of enrollment.course.sections) {
      if (section.lectures) {
        for (const lecture of section.lectures) {
          if (enrollment.completedLectures?.includes(lecture._id)) {
            lastLecture = lecture;
            lastSection = section;
          }
        }
      }
    }
    
    return { lecture: lastLecture, section: lastSection };
  };

  const getNextLesson = (enrollment) => {
    if (!enrollment.course?.sections) return null;
    
    const completedIds = enrollment.completedLectures || [];
    
    for (const section of enrollment.course.sections) {
      if (section.lectures) {
        for (const lecture of section.lectures) {
          if (!completedIds.includes(lecture._id)) {
            return { lecture, section };
          }
        }
      }
    }
    
    return null;
  };

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
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start your learning journey</h3>
            <p className="text-gray-600 mb-4">Enroll in courses to begin your educational adventure</p>
            <Link href="/courses">
              <Button>
                <BookOpen className="w-4 h-4 mr-2" />
                Browse Courses
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Continue Learning
          </CardTitle>
          <Link href="/courses">
            <Button variant="ghost" size="sm" className="text-primary-600 hover:text-primary-700">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {enrollments.slice(0, 2).map((enrollment) => {
          const course = enrollment.course;
          if (!course) return null;
          
          const progress = enrollment.progress || 0;
          const nextLesson = getNextLesson(enrollment);
          const lastLesson = getLastLesson(enrollment);
          const totalLectures = (course.sections || []).reduce((total, section) => 
            total + (section.lectures?.length || 0), 0) || 0;
          const completedLectures = enrollment.completedLectures?.length || 0;
          
          return (
            <div 
              key={enrollment._id}
              className="border border-gray-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-start space-x-4">
                {/* Course thumbnail */}
                <div className="w-20 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  {course.coverUrl ? (
                    <img 
                      src={course.coverUrl} 
                      alt={`${course.title} thumbnail`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <BookOpen className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  {/* Course header */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                        {course.title}
                      </h4>
                      <p className="text-sm text-gray-500 truncate">
                        {course.assignedInstructor?.username || 'Instructor'}
                      </p>
                    </div>
                    <Badge 
                      variant={progress > 70 ? 'default' : 'secondary'}
                      className={`${
                        progress > 70 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-primary-100 text-primary-700'
                      }`}
                    >
                      {Math.round(progress)}% Complete
                    </Badge>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mb-3">
                    <Progress 
                      value={progress} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{completedLectures} of {totalLectures} lessons</span>
                      <span>{formatDuration(course.estimatedHours * 3600)} total</span>
                    </div>
                  </div>
                  
                  {/* Next lesson info */}
                  {nextLesson ? (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Play className="w-4 h-4 text-primary-600" />
                        <span className="text-sm font-medium text-gray-900">Next Lesson</span>
                      </div>
                      <p className="text-sm text-gray-700 font-medium">
                        {nextLesson.lecture.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {nextLesson.section.title} • {formatDuration(nextLesson.lecture.duration || 0)}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-green-50 rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Course Completed!</span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        Congratulations on finishing this course
                      </p>
                    </div>
                  )}
                  
                  {/* Course stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{course.enrollmentCount || 0} students</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span>{course.rating?.average?.toFixed(1) || '0.0'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      <span>{course.level || 'Beginner'}</span>
                    </div>
                  </div>
                  
                  {/* Action button */}
                  <Link href={`/courses/${course._id}`}>
                    <Button 
                      size="sm" 
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {nextLesson ? 'Continue Learning' : 'Review Course'}
                    </Button>
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

export default EnhancedContinueLearning;
