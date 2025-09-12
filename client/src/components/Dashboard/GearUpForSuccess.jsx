import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingBag, 
  Star, 
  ArrowRight, 
  Zap,
  Headphones,
  Monitor,
  Keyboard,
  Mouse,
  PenTool,
  Camera,
  Mic,
  Plus,
  Heart
} from 'lucide-react';

const GearUpForSuccess = ({ products = [], enrollments = [] }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const getProductIcon = (category) => {
    const iconMap = {
      'headphones': Headphones,
      'monitor': Monitor,
      'keyboard': Keyboard,
      'mouse': Mouse,
      'stylus': PenTool,
      'camera': Camera,
      'microphone': Mic,
      'default': ShoppingBag
    };
    return iconMap[category?.toLowerCase()] || iconMap.default;
  };

  const getCourseCategory = (course) => {
    const categoryMap = {
      'web-development': ['keyboard', 'mouse', 'monitor', 'headphones'],
      'mobile-development': ['stylus', 'headphones', 'camera'],
      'data-science': ['monitor', 'headphones', 'stylus'],
      'ai-ml': ['headphones', 'monitor', 'stylus'],
      'design': ['stylus', 'monitor', 'tablet', 'camera'],
      'photography': ['camera', 'tripod', 'lens', 'memory-card'],
      'video-editing': ['monitor', 'headphones', 'camera', 'microphone'],
      'podcasting': ['microphone', 'headphones', 'audio-interface'],
      'music': ['microphone', 'headphones', 'audio-interface', 'midi-keyboard']
    };
    
    const courseTags = course?.tags || [];
    const courseCategory = course?.category?.toLowerCase();
    
    for (const [key, value] of Object.entries(categoryMap)) {
      if (courseCategory?.includes(key) || courseTags.some(tag => tag.toLowerCase().includes(key))) {
        return value;
      }
    }
    
    return ['headphones', 'stylus', 'notebook'];
  };

  const getRelevantProducts = () => {
    if (!products.length || !enrollments.length) return products.slice(0, 8);
    
    const relevantCategories = new Set();
    enrollments.forEach(enrollment => {
      const categories = getCourseCategory(enrollment.course);
      categories.forEach(cat => relevantCategories.add(cat));
    });
    
    return products.filter(product => 
      relevantCategories.has(product.category?.toLowerCase())
    ).slice(0, 8);
  };

  const relevantProducts = getRelevantProducts();

  if (!relevantProducts.length) {
    return (
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Gear Up for Success
          </CardTitle>
          <p className="text-sm text-gray-600">
            Essential tools to enhance your learning experience
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ShoppingBag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products available</h3>
            <p className="text-gray-600 mb-4">Check back later for recommended learning tools</p>
            <Link href="/store">
              <Button>
                <ArrowRight className="w-4 h-4 mr-2" />
                Visit Store
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
              Gear Up for Success
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Essential tools to enhance your learning experience
            </p>
          </div>
          <Link href="/store">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              View All
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Horizontal scrolling container */}
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {relevantProducts.map((product) => {
              const ProductIcon = getProductIcon(product.category);
              const isOnSale = product.discountPrice && product.discountPrice < product.price;
              const finalPrice = isOnSale ? product.discountPrice : product.price;
              const discountPercent = isOnSale ? 
                Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;

              return (
                <div 
                  key={product._id}
                  className="flex-shrink-0 w-72 bg-white border border-gray-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-lg transition-all duration-200 group"
                >
                  {/* Product Image */}
                  <div className="relative mb-3">
                    <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {product.images?.[0] ? (
                        <img 
                          src={product.images[0]} 
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <ProductIcon className="w-16 h-16 text-gray-400" />
                      )}
                    </div>
                    {isOnSale && (
                      <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs">
                        -{discountPercent}%
                      </Badge>
                    )}
                    {product.rating && (
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        <span className="text-xs font-medium">{product.rating.toFixed(1)}</span>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-8 bg-white/90 backdrop-blur-sm hover:bg-white/100 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Product Info */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm line-clamp-2 group-hover:text-primary-600 transition-colors">
                        {product.title}
                      </h4>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                        {product.description}
                      </p>
                    </div>
                    
                    {/* Price */}
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-green-600">
                        {formatPrice(finalPrice)}
                      </span>
                      {isOnSale && (
                        <span className="text-sm text-gray-400 line-through">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>

                    {/* Category and Stock */}
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {product.category}
                      </Badge>
                      {product.stock > 0 ? (
                        <span className="text-xs text-green-600 font-medium">
                          In Stock
                        </span>
                      ) : (
                        <span className="text-xs text-red-600 font-medium">
                          Out of Stock
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-primary-600 hover:bg-primary-700 text-white text-xs"
                      >
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Scroll indicator */}
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gradient-to-l from-white to-transparent w-8 h-full pointer-events-none" />
        </div>
      </CardContent>
    </Card>
  );
};

export default GearUpForSuccess;
