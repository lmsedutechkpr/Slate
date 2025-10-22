import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth.js';
import { buildApiUrl } from '../lib/utils.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingSpinner from '../components/Common/LoadingSpinner.jsx';
import { 
  Search, 
  ShoppingCart, 
  Star, 
  Filter, 
  Package, 
  Gift, 
  Headphones, 
  Smartphone, 
  Monitor,
  TrendingUp,
  Award,
  Eye,
  Zap
} from 'lucide-react';

const Store = () => {
  const { accessToken, authenticatedFetch } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Comprehensive dummy data for student store
  const dummyProductsData = {
    products: [
      {
        _id: '1',
        name: 'Wireless Bluetooth Headphones',
        description: 'High-quality noise-canceling headphones perfect for online learning. Features 30-hour battery life and crystal-clear audio.',
        price: 89.99,
        originalPrice: 119.99,
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
        category: 'Audio',
        brand: 'TechSound',
        rating: 4.5,
        reviews: 128,
        inStock: true,
        discount: 25,
        tags: ['wireless', 'noise-canceling', 'long-battery']
      },
      {
        _id: '2',
        name: 'Ergonomic Study Chair',
        description: 'Comfortable chair designed for long study sessions. Adjustable height and lumbar support included.',
        price: 199.99,
        originalPrice: 249.99,
        imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
        category: 'Furniture',
        brand: 'ComfortPlus',
        rating: 4.8,
        reviews: 89,
        inStock: true,
        discount: 20,
        tags: ['ergonomic', 'adjustable', 'lumbar-support']
      },
      {
        _id: '3',
        name: 'Mechanical Keyboard',
        description: 'RGB backlit mechanical keyboard with tactile switches. Perfect for coding and typing assignments.',
        price: 129.99,
        originalPrice: 159.99,
        imageUrl: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400&h=300&fit=crop',
        category: 'Accessories',
        brand: 'KeyMaster',
        rating: 4.6,
        reviews: 156,
        inStock: true,
        discount: 19,
        tags: ['mechanical', 'rgb', 'tactile']
      },
      {
        _id: '4',
        name: 'Gaming Mouse',
        description: 'High-precision gaming mouse with customizable buttons and RGB lighting. Great for design work.',
        price: 79.99,
        originalPrice: 99.99,
        imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=300&fit=crop',
        category: 'Accessories',
        brand: 'MousePro',
        rating: 4.4,
        reviews: 203,
        inStock: true,
        discount: 20,
        tags: ['gaming', 'precision', 'customizable']
      },
      {
        _id: '5',
        name: 'Monitor Stand',
        description: 'Adjustable monitor stand with built-in USB hub and cable management. Improves posture and workspace organization.',
        price: 59.99,
        originalPrice: 79.99,
        imageUrl: 'https://images.unsplash.com/photo-1587560699334-cc4ff634909a?w=400&h=300&fit=crop',
        category: 'Furniture',
        brand: 'DeskMaster',
        rating: 4.7,
        reviews: 67,
        inStock: true,
        discount: 25,
        tags: ['adjustable', 'usb-hub', 'cable-management']
      },
      {
        _id: '6',
        name: 'Blue Light Blocking Glasses',
        description: 'Stylish blue light blocking glasses to reduce eye strain during long study sessions. Available in multiple colors.',
        price: 39.99,
        originalPrice: 49.99,
        imageUrl: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&h=300&fit=crop',
        category: 'Health',
        brand: 'EyeCare',
        rating: 4.3,
        reviews: 94,
        inStock: true,
        discount: 20,
        tags: ['blue-light', 'eye-strain', 'stylish']
      },
      {
        _id: '7',
        name: 'Portable Laptop Stand',
        description: 'Lightweight and foldable laptop stand for better ergonomics. Perfect for studying anywhere.',
        price: 29.99,
        originalPrice: 39.99,
        imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=300&fit=crop',
        category: 'Accessories',
        brand: 'PortableTech',
        rating: 4.2,
        reviews: 78,
        inStock: true,
        discount: 25,
        tags: ['portable', 'foldable', 'ergonomic']
      },
      {
        _id: '8',
        name: 'Desk Lamp with USB',
        description: 'LED desk lamp with USB charging ports and adjustable brightness. Perfect for focused study sessions.',
        price: 49.99,
        originalPrice: 69.99,
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
        category: 'Lighting',
        brand: 'BrightStudy',
        rating: 4.6,
        reviews: 112,
        inStock: true,
        discount: 29,
        tags: ['led', 'usb-charging', 'adjustable']
      }
    ],
    categories: [
      { name: 'Audio', count: 1 },
      { name: 'Furniture', count: 2 },
      { name: 'Accessories', count: 3 },
      { name: 'Health', count: 1 },
      { name: 'Lighting', count: 1 }
    ],
    recommended: [
      {
        _id: '9',
        name: 'Student Study Bundle',
        description: 'Complete study setup including headphones, keyboard, and mouse. Save 30% with this bundle!',
        price: 199.99,
        originalPrice: 289.97,
        imageUrl: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=300&fit=crop',
        category: 'Bundle',
        brand: 'StudyPro',
        rating: 4.9,
        reviews: 45,
        inStock: true,
        discount: 31,
        tags: ['bundle', 'complete-setup', 'savings']
      }
    ]
  };

  // Debounce search term to avoid refetch on every keystroke
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearchTerm(searchTerm), 400);
    return () => clearTimeout(id);
  }, [searchTerm]);

  // Fetch products with real-time updates
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products', { search: debouncedSearchTerm, category: selectedCategory, priceRange, sortBy }],
    queryFn: async () => {
      // Return dummy data for demonstration
      return dummyProductsData;
    },
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Fetch product categories with real-time updates
  const { data: categoriesData } = useQuery({
    queryKey: ['/api/products/categories'],
    queryFn: async () => {
      // Return dummy data for demonstration
      return { categories: dummyProductsData.categories };
    },
    refetchInterval: 30000,
  });

  // Fetch recommended products with real-time updates
  const { data: recommendationsData } = useQuery({
    queryKey: ['/api/recommendations'],
    queryFn: async () => {
      // Return dummy data for demonstration
      return { products: dummyProductsData.recommended };
    },
    enabled: true, // Always enabled for dummy data
    refetchInterval: 30000,
  });

  const products = productsData?.products || [];
  const categories = categoriesData?.categories || [];
  const recommendedProducts = recommendationsData?.products || [];

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'headphones':
        return Headphones;
      case 'phone-accessories':
      case 'mobile':
        return Smartphone;
      case 'monitor':
      case 'display':
        return Monitor;
      default:
        return Package;
    }
  };

  const ProductCard = ({ product, isRecommended = false }) => {
    const CategoryIcon = getCategoryIcon(product.category);
    const discountPercentage = product.discountPrice 
      ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
      : 0;

    return (
      <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-200 group" data-testid={`product-card-${product._id}`}>
        <CardHeader className="p-6 pb-4">
          <div className="relative">
            {/* Product image */}
            <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
              {product.images && product.images[0] ? (
                <img 
                  src={product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <CategoryIcon className="w-16 h-16 text-gray-400" />
              )}
            </div>
            
            {/* Discount badge */}
            {discountPercentage > 0 && (
              <Badge className="absolute top-2 right-2 bg-red-500 text-white border-0">
                {discountPercentage}% OFF
              </Badge>
            )}
            
            {/* Recommended badge */}
            {isRecommended && (
              <Badge className="absolute top-2 left-2 bg-blue-500 text-white border-0">
                <TrendingUp className="w-3 h-3 mr-1" />
                Recommended
              </Badge>
            )}
          </div>
          
          <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-primary-600 transition-colors">
            {product.title}
          </CardTitle>
          <CardDescription className="line-clamp-2">
            {product.description}
          </CardDescription>
          
          {/* Rating */}
          {product.rating?.average > 0 && (
            <div className="flex items-center space-x-1 mt-3">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{product.rating.average.toFixed(1)}</span>
              <span className="text-sm text-gray-500">({product.rating.count})</span>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="p-6 pt-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {product.discountPrice ? (
                <>
                  <span className="text-xl font-bold text-green-600">
                    {formatPrice(product.discountPrice)}
                  </span>
                  <span className="text-sm text-gray-500 line-through">
                    {formatPrice(product.price)}
                  </span>
                </>
              ) : (
                <span className="text-xl font-bold text-gray-900">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
            <Badge variant="outline" className="capitalize border-gray-200">
              {product.category}
            </Badge>
          </div>
          
          {/* Stock status */}
          <div className="mb-4">
            {product.stock > 0 ? (
              <span className="text-sm text-green-600 font-medium">
                {product.stock > 10 ? 'In Stock' : `Only ${product.stock} left`}
              </span>
            ) : (
              <span className="text-sm text-red-600 font-medium">Out of Stock</span>
            )}
          </div>
          
          <Button 
            className="w-full"
            disabled={product.stock === 0}
            data-testid={`button-add-to-cart-${product._id}`}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (productsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Study Accessories Store</h1>
              <p className="text-gray-600 mt-1">Find the perfect accessories to enhance your learning experience</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live updates</span>
            </div>
          </div>
        </div>

        {/* Student Discount Banner */}
        <Card className="border-0 shadow-sm bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Gift className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-900">Student Discount Available!</h3>
                <p className="text-yellow-700">Get 20% off on all accessories with your student account. Discount automatically applied at checkout.</p>
              </div>
              <Badge className="bg-yellow-500 text-white border-0">
                <Zap className="w-3 h-3 mr-1" />
                20% OFF
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card className="border-0 shadow-sm bg-white mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search accessories by name, category, or brand..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-products"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category} className="capitalize">
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="0-1000">Under ₹1,000</SelectItem>
                    <SelectItem value="1000-3000">₹1,000 - ₹3,000</SelectItem>
                    <SelectItem value="3000-5000">₹3,000 - ₹5,000</SelectItem>
                    <SelectItem value="5000-">Above ₹5,000</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    <SelectItem value="rating-desc">Highest Rated</SelectItem>
                    <SelectItem value="createdAt-desc">Newest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-fit bg-white shadow-sm">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700">
              All Products
            </TabsTrigger>
            <TabsTrigger value="recommended" className="data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700">
              Recommended ({recommendedProducts.length})
            </TabsTrigger>
            <TabsTrigger value="categories" className="data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700">
              Categories
            </TabsTrigger>
          </TabsList>

          {/* All Products */}
          <TabsContent value="all" className="space-y-6">
            {products.length === 0 ? (
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-12 text-center">
                  <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
                  <Button onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setPriceRange('all');
                    setSortBy('default');
                  }}>
                    <Filter className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Recommended Products */}
          <TabsContent value="recommended" className="space-y-6">
            {recommendedProducts.length === 0 ? (
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-12 text-center">
                  <TrendingUp className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No recommendations yet</h3>
                  <p className="text-gray-600 mb-4">Complete your profile to get personalized product recommendations</p>
                  <Button onClick={() => window.location.href = '/profile'}>
                    <Award className="w-4 h-4 mr-2" />
                    Update Profile
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {recommendedProducts.map((product) => (
                  <ProductCard key={product._id} product={product} isRecommended={true} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Categories */}
          <TabsContent value="categories" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {categories.map((category) => {
                const CategoryIcon = getCategoryIcon(category);
                const categoryProducts = products.filter(p => p.category === category);
                
                return (
                  <Card 
                    key={category}
                    className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-200 cursor-pointer group"
                    onClick={() => setSelectedCategory(category)}
                    data-testid={`category-card-${category}`}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-primary-100 transition-colors">
                        <CategoryIcon className="w-6 h-6 text-primary-600" />
                      </div>
                      <h4 className="font-semibold capitalize text-gray-900">{category}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {categoryProducts.length} items
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Store;
