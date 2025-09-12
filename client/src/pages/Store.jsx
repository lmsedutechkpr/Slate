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
import { getSocket } from '@/lib/realtime.js';

const Store = () => {
  const { accessToken, authenticatedFetch } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term to avoid refetch on every keystroke
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearchTerm(searchTerm), 400);
    return () => clearTimeout(id);
  }, [searchTerm]);

  // Fetch products with real-time updates
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products', { search: debouncedSearchTerm, category: selectedCategory, priceRange, sortBy }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
      if (priceRange && priceRange !== 'all') {
        const [min, max] = priceRange.split('-');
        if (min) params.append('minPrice', min);
        if (max) params.append('maxPrice', max);
      }
      if (sortBy && sortBy !== 'default') {
        const [field, order] = sortBy.split('-');
        params.append('sortBy', field);
        params.append('sortOrder', order);
      }
      
      const response = await fetch(buildApiUrl(`/api/products?${params.toString()}`));
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Fetch product categories with real-time updates
  const { data: categoriesData } = useQuery({
    queryKey: ['/api/products/categories'],
    queryFn: async () => {
      const response = await fetch(buildApiUrl('/api/products/categories'));
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
    refetchInterval: 30000,
  });

  // Trending products
  const { data: trendingData, refetch: refetchTrending } = useQuery({
    queryKey: ['/api/products/trending'],
    queryFn: async () => {
      const res = await fetch(buildApiUrl('/api/products/trending'));
      if (!res.ok) throw new Error('Failed to load trending');
      return res.json();
    },
    refetchInterval: 30000,
  });

  // Bundles
  const { data: bundlesData, refetch: refetchBundles } = useQuery({
    queryKey: ['/api/products/bundles'],
    queryFn: async () => {
      const res = await fetch(buildApiUrl('/api/products/bundles'));
      if (!res.ok) throw new Error('Failed to load bundles');
      return res.json();
    },
    refetchInterval: 30000,
  });

  // Fetch recommended products with real-time updates
  const { data: recommendationsData } = useQuery({
    queryKey: ['/api/recommendations'],
    queryFn: async () => {
      const response = await authenticatedFetch(buildApiUrl('/api/recommendations'));
      if (!response.ok) return { products: [] };
      return response.json();
    },
    enabled: !!accessToken,
    refetchInterval: 30000,
  });

  const products = productsData?.products || [];
  const categories = categoriesData?.categories || [];
  const recommendedProducts = recommendationsData?.products || [];
  const trending = trendingData?.products || [];
  const bundles = bundlesData?.bundles || [];

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

  // Realtime updates for bundles/products
  useEffect(() => {
    const socket = getSocket(accessToken);
    if (!socket) return;
    const handler = () => { refetchTrending(); refetchBundles(); };
    socket.on('admin:products:update', handler);
    socket.on('admin:inventory:low', handler);
    return () => { try { socket.off('admin:products:update', handler); socket.off('admin:inventory:low', handler); } catch {} };
  }, [accessToken, refetchTrending, refetchBundles]);

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
          <TabsList className="grid grid-cols-5 w-fit bg-white shadow-sm">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700">
              All Products
            </TabsTrigger>
            <TabsTrigger value="recommended" className="data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700">
              Recommended ({recommendedProducts.length})
            </TabsTrigger>
            <TabsTrigger value="trending" className="data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700">
              Trending
            </TabsTrigger>
            <TabsTrigger value="bundles" className="data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700">
              Bundles
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

          {/* Trending */}
          <TabsContent value="trending" className="space-y-6">
            {trending.length === 0 ? (
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-12 text-center">
                  <TrendingUp className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No trending products</h3>
                  <p className="text-gray-600 mb-4">Check back later</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {trending.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Bundles */}
          <TabsContent value="bundles" className="space-y-6">
            {bundles.length === 0 ? (
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-12 text-center">
                  <Gift className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No bundles available</h3>
                  <p className="text-gray-600 mb-4">Bundles appear here when available</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {bundles.map((b) => (
                  <Card key={b._id} className="border-0 shadow-sm bg-white">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">{b.title}</CardTitle>
                      <CardDescription>{b.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-600 mb-2">{b.courseId?.title ? `For course: ${b.courseId.title}` : 'General bundle'}</div>
                      <ul className="text-sm list-disc pl-4 mb-3">
                        {(b.products || []).map((p, idx) => (
                          <li key={idx}>{p.productId?.title} × {p.quantity}</li>
                        ))}
                      </ul>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-900">{formatPrice(b.discountPrice ?? b.price)}</span>
                        {b.discountPrice != null && (
                          <span className="text-sm text-gray-500 line-through">{formatPrice(b.price)}</span>
                        )}
                      </div>
                      <Button className="mt-3 w-full">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add Bundle to Cart
                      </Button>
                    </CardContent>
                  </Card>
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
