import { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { 
  BookOpen, 
  Users, 
  Clock, 
  Star, 
  Play,
  Heart,
  ShoppingBag,
  Zap,
  Award,
  User
} from 'lucide-react';
import { getImageUrl, buildApiUrl } from '@/lib/utils.js';

const EnhancedCourseCard = ({ 
  course, 
  isEnrolled = false, 
  enrollment = null,
  onWishlistToggle = null,
  isWishlisted = false,
  onEnroll = null
}) => {
  const [isHovered, setIsHovered] = useState(false);

  if (!course) return null;

  const safeSections = (course && Array.isArray(course.sections)) ? course.sections : [];
  const totalLectures = safeSections.reduce((total, section) => 
    total + (section.lectures?.length || 0), 0) || 0;

  const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'beginner': return 'bg-green-50 text-green-600 border-green-200';
      case 'intermediate': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'advanced': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const formatDuration = (hours) => {
    if (!hours) return 'Duration varies';
    return `${hours}h`;
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star key={i} className="w-3 h-3 fill-yellow-400/50 text-yellow-400" />
        );
      } else {
        stars.push(
          <Star key={i} className="w-3 h-3 text-gray-300" />
        );
      }
    }
    return stars;
  };

  const hasRecommendedGear = () => {
    // Check if course has associated products or requires specific tools
    const courseTags = course.tags || [];
    const gearKeywords = ['design', 'art', 'music', 'video', 'photography', 'drawing', 'audio', 'video-editing'];
    return courseTags.some(tag => 
      gearKeywords.some(keyword => 
        tag.toLowerCase().includes(keyword)
      )
    );
  };

  const instructorName = course.assignedInstructor?.profile?.firstName 
    ? `${course.assignedInstructor.profile.firstName} ${course.assignedInstructor.profile.lastName || ''}`.trim()
    : course.assignedInstructor?.username || 'Instructor';

  return (
    <Card 
      className="border-0 shadow-sm bg-white hover:shadow-lg transition-all duration-300 cursor-pointer group relative overflow-hidden"
      data-testid={`course-card-${course._id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Wishlist Button */}
      <button
        className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white transition-all duration-200 opacity-0 group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onWishlistToggle?.(course._id);
        }}
        data-testid={`wishlist-button-${course._id}`}
      >
        <Heart 
          className={`w-4 h-4 transition-colors ${
            isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'
          }`} 
        />
      </button>

      {/* Recommended Gear Teaser */}
      {hasRecommendedGear() && (
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
            <ShoppingBag className="w-3 h-3 mr-1" />
            Gear Available
          </Badge>
        </div>
      )}

      <CardHeader className="p-6 pb-4">
        {/* Course Image and Basic Info */}
        <div className="flex items-start space-x-4 mb-4">
          {course.coverUrl && (
            <img 
              src={getImageUrl(course.coverUrl, buildApiUrl(''))}
              alt={course.title}
              className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-primary-600 transition-colors mb-2">
              {course.title}
            </CardTitle>
            
            {/* Star Rating */}
            {course.rating?.average > 0 && (
              <div className="flex items-center space-x-2 mb-2">
                <div className="flex items-center space-x-1">
                  {renderStars(course.rating.average)}
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {course.rating.average.toFixed(1)}
                </span>
                <span className="text-sm text-gray-500">
                  ({course.rating.count?.toLocaleString() || 0} ratings)
                </span>
              </div>
            )}
            
            <CardDescription className="text-sm line-clamp-2">
              {course.description}
            </CardDescription>
          </div>
        </div>
        
        {/* Consolidated Metadata with Icons */}
        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center space-x-1">
            <Award className="w-4 h-4 text-gray-400" />
            <span>{course.level || 'Beginner'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4 text-gray-400" />
            <span>{(course.enrollmentCount || 0).toLocaleString()} students</span>
          </div>
          <div className="flex items-center space-x-1">
            <BookOpen className="w-4 h-4 text-gray-400" />
            <span>{totalLectures} lessons</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>{formatDuration(course.estimatedHours)}</span>
          </div>
        </div>
        
        {/* Price and Level Badges */}
        <div className="flex items-center space-x-2 mb-4">
          <Badge className={`border ${getLevelColor(course.level)}`}>
            {course.level || 'Beginner'}
          </Badge>
          {course.price > 0 && (
            <Badge variant="outline" className="font-medium">₹{course.price}</Badge>
          )}
          {course.price === 0 && (
            <Badge className="bg-green-50 text-green-600 border-green-200">Free</Badge>
          )}
        </div>
        
        {/* Progress Bar for Enrolled Courses */}
        {isEnrolled && enrollment && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-semibold text-gray-900">
                {Math.round(enrollment.progressPct || 0)}%
              </span>
            </div>
            <ProgressBar 
              value={enrollment.progressPct || 0} 
              className="h-2 bg-gray-100"
            />
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-6 pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span>by {instructorName}</span>
          </div>
          
          <Button 
            size="sm"
            variant={isEnrolled ? "outline" : "default"}
            className="flex-shrink-0"
            data-testid={`button-${isEnrolled ? 'continue' : 'enroll'}-${course._id}`}
            onClick={(e) => {
              e.stopPropagation();
              if (isEnrolled) {
                window.location.href = `/courses/${course._id}`;
                return;
              }
              onEnroll?.(course._id);
            }}
          >
            {isEnrolled ? (
              <>
                <Play className="w-4 h-4 mr-2" />
                Continue Learning
              </>
            ) : (
              <>
                <BookOpen className="w-4 h-4 mr-2" />
                Enroll Now
              </>
            )}
          </Button>
        </div>
      </CardContent>

      {/* Hover Effect Overlay */}
      {isHovered && hasRecommendedGear() && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
      )}
    </Card>
  );
};

export default EnhancedCourseCard;
