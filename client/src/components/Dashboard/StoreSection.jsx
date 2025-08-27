import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Gift } from 'lucide-react';

const StoreSection = ({ products = [] }) => {
  if (!products.length) {
    return null;
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <Card className="card-hover">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Study Accessories
          </CardTitle>
          <Link href="/store">
            <button 
              className="text-primary-600 text-sm hover:text-primary-700"
              data-testid="link-view-store"
            >
              View Store
            </button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {products.slice(0, 2).map((product) => (
          <div 
            key={product._id}
            className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors cursor-pointer"
            data-testid={`product-card-${product._id}`}
          >
            {/* Product image */}
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
              {product.images?.[0] ? (
                <img 
                  src={product.images[0]} 
                  alt={product.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <ShoppingCart className="h-6 w-6 text-gray-400" />
              )}
            </div>
            
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">
                {product.title}
              </h4>
              <p className="text-xs text-gray-500 mb-1">
                {product.description}
              </p>
              <div className="flex items-center justify-between">
                <span 
                  className="text-sm font-semibold text-green-600"
                  data-testid={`price-${product._id}`}
                >
                  {formatPrice(product.price)}
                </span>
                <Button 
                  size="sm"
                  className="text-xs bg-primary-600 text-white px-2 py-1 rounded hover:bg-primary-700 transition-colors"
                  data-testid={`button-add-to-cart-${product._id}`}
                >
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>
        ))}
        
        
      </CardContent>
    </Card>
  );
};

export default StoreSection;
