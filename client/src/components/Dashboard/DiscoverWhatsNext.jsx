import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  ShoppingBag, 
  Video, 
  Users, 
  Clock, 
  Star,
  ArrowRight,
  Zap,
  TrendingUp,
  Calendar
} from 'lucide-react';

const DiscoverWhatsNext = ({ 
  recommendations = { courses: [], products: [] }, 
  liveSessions = [],
  enrollments = []
}) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const getRecommendationType = (item, index) => {
    if (item.course) return 'course';
    if (item.product) return 'product';
    if (item.session) return 'session';
    return 'course'; // fallback
  };

  const getRecommendationIcon = (type) => {
    const iconMap = {
      'course': BookOpen,
      'product': ShoppingBag,
      'session': Video
    };
    return iconMap[type] || BookOpen;
  };

  const getRecommendationColor = (type) => {
    const colorMap = {
      'course': 'bg-blue-50 text-blue-600',
      'product': 'bg-green-50 text-green-600',
      'session': 'bg-purple-50 text-purple-600'
    };
    return colorMap[type] || 'bg-gray-50 text-gray-600';
  };

  // Generate smart recommendations based on user behavior
  const generateSmartRecommendations = () => {
    const recommendations = [];
    
    // Course recommendations based on current enrollments
    if (recommendations.courses && recommendations.courses.length > 0) {
      recommendations.courses.slice(0, 2).forEach(course => {
        recommendations.push({
          type: 'course',
          title: course.title,
          description: `Since you're excelling in your current courses, you might like this advanced course`,
          item: course,
          actionText: 'Explore Course',
          href: `/courses/${course._id}`,
          icon: BookOpen,
          color: 'bg-blue-50 text-blue-600'
        });
      });
    }

    // Product recommendations
    if (recommendations.products && recommendations.products.length > 0) {
      recommendations.products.slice(0, 1).forEach(product => {
        recommendations.push({
          type: 'product',
          title: product.title,
          description: `Upgrade your learning setup with this recommended tool`,
          item: product,
          actionText: 'View Product',
          href: `/store/${product._id}`,
          icon: ShoppingBag,
          color: 'bg-green-50 text-green-600',
          price: product.price
        });
      });
    }

    // Live session recommendations
    if (liveSessions && liveSessions.length > 0) {
      liveSessions.slice(0, 1).forEach(session => {
        recommendations.push({
          type: 'session',
          title: session.title,
          description: `Join this upcoming workshop to enhance your skills`,
          item: session,
          actionText: 'Join Session',
          href: `/live-sessions/${session._id}`,
          icon: Video,
          color: 'bg-purple-50 text-purple-600',
          time: session.startTime
        });
      });
    }

    // Fill with additional course recommendations if needed
    if (recommendations.length < 3 && recommendations.courses && recommendations.courses.length > 2) {
      recommendations.courses.slice(2, 3).forEach(course => {
        recommendations.push({
          type: 'course',
          title: course.title,
          description: `Continue your learning journey with this recommended course`,
          item: course,
          actionText: 'Start Learning',
          href: `/courses/${course._id}`,
          icon: BookOpen,
          color: 'bg-blue-50 text-blue-600'
        });
      });
    }

    return recommendations.slice(0, 3);
  };

  const smartRecommendations = generateSmartRecommendations();

  if (smartRecommendations.length === 0) {
    return (
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Discover What's Next
          </CardTitle>
          <p className="text-sm text-gray-600">
            Personalized recommendations just for you
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations yet</h3>
            <p className="text-gray-600 mb-4">Complete a course to get personalized suggestions</p>
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
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Discover What's Next
            </CardTitle>
            <p className="text-sm text-gray-600">
              Personalized recommendations just for you
            </p>
          </div>
          <Link href="/courses">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              View All
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {smartRecommendations.map((rec, index) => {
            const Icon = rec.icon;
            
            return (
              <div 
                key={`${rec.type}-${index}`}
                className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${rec.color}`}>
                  <Icon className="w-6 h-6" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                      {rec.title}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {rec.type === 'course' ? 'Course' : 
                       rec.type === 'product' ? 'Product' : 'Live Session'}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {rec.description}
                  </p>

                  {/* Additional info based on type */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    {rec.type === 'course' && rec.item && (
                      <>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{rec.item.enrollmentCount || 0} students</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{rec.item.estimatedHours || 0}h</span>
                        </div>
                        {rec.item.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span>{rec.item.rating.average?.toFixed(1) || '0.0'}</span>
                          </div>
                        )}
                      </>
                    )}
                    
                    {rec.type === 'product' && rec.price && (
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-green-600">
                          {formatPrice(rec.price)}
                        </span>
                      </div>
                    )}
                    
                    {rec.type === 'session' && rec.time && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(rec.time).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <Link href={rec.href}>
                    <Button size="sm" className="bg-primary-600 hover:bg-primary-700 text-white">
                      {rec.actionText}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default DiscoverWhatsNext;
