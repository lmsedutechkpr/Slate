import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingSpinner from '../components/Common/LoadingSpinner.jsx';
import { Search, ShoppingCart, Star, Filter, Package, Gift, Headphones, Smartphone, Monitor } from 'lucide-react';

const Store = () => {
  const { accessToken } = useAuth();
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

  // Fetch products
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
      
      const response = await fetch(`/api/products?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      return response.json();
    },
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  });

  // Fetch product categories
  const { data: categoriesData } = useQuery({
    queryKey: ['/api/products/categories'],
    queryFn: async () => {
      const response = await fetch('/api/products/categories');
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      return response.json();
    },
  });

  // Fetch recommended products
  const { data: recommendationsData } = useQuery({
    queryKey: ['/api/recommendations'],
    queryFn: async () => {
      const response = await fetch('/api/recommendations', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }
      
      return response.json();
    },
    enabled: !!accessToken,
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
      <Card className="card-hover" data-testid={`product-card-${product._id}`}>
        <CardHeader className="p-4">
          <div className="relative">
            {/* Product image */}
            <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              {product.images && product.images[0] ? (
                <img 
                  src={product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <CategoryIcon className="w-16 h-16 text-gray-400" />
              )}
            </div>
            
            {/* Discount badge */}
            {discountPercentage > 0 && (
              <Badge className="absolute top-2 right-2 bg-red-500 text-white">
                {discountPercentage}% OFF
              </Badge>
            )}
            
            {/* Recommended badge */}
            {isRecommended && (
              <Badge className="absolute top-2 left-2 bg-blue-500 text-white">
                Recommended
              </Badge>
            )}
          </div>
          
          <CardTitle className="text-lg font-semibold line-clamp-2">
            {product.title}
          </CardTitle>
          <CardDescription className="line-clamp-2">
            {product.description}
          </CardDescription>
          
          {/* Rating */}
          {product.rating?.average > 0 && (
            <div className="flex items-center space-x-1 mt-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{product.rating.average.toFixed(1)}</span>
              <span className="text-sm text-gray-500">({product.rating.count})</span>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="p-4 pt-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {product.discountPrice ? (
                <>
                  <span className="text-lg font-bold text-green-600">
                    {formatPrice(product.discountPrice)}
                  </span>
                  <span className="text-sm text-gray-500 line-through">
                    {formatPrice(product.price)}
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
            <Badge variant="outline" className="capitalize">
              {product.category}
            </Badge>
          </div>
          
          {/* Stock status */}
          <div className="mb-4">
            {product.stock > 0 ? (
              <span className="text-sm text-green-600">
                {product.stock > 10 ? 'In Stock' : `Only ${product.stock} left`}
              </span>
            ) : (
              <span className="text-sm text-red-600">Out of Stock</span>
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
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Study Accessories Store</h1>
        <p className="text-gray-600">Find the perfect accessories to enhance your learning experience</p>
      </div>

      {/* Student Discount Banner */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6 mb-8">
        <div className="flex items-center space-x-3">
          <Gift className="h-8 w-8 text-yellow-600" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-900">Student Discount Available!</h3>
            <p className="text-yellow-700">Get 20% off on all accessories with your student account. Discount automatically applied at checkout.</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search accessories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-products"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
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
      </div>

      {/* Product Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-fit">
          <TabsTrigger value="all" data-testid="tab-all-products">
            All Products
          </TabsTrigger>
          <TabsTrigger value="recommended" data-testid="tab-recommended-products">
            Recommended ({recommendedProducts.length})
          </TabsTrigger>
          <TabsTrigger value="categories" data-testid="tab-categories">
            Categories
          </TabsTrigger>
        </TabsList>

        {/* All Products */}
        <TabsContent value="all" className="space-y-6">
          {products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
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
            <div className="text-center py-12">
              <Filter className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations yet</h3>
              <p className="text-gray-600 mb-4">Complete your profile to get personalized product recommendations</p>
              <Button onClick={() => window.location.href = '/profile'}>
                Update Profile
              </Button>
            </div>
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((category) => {
              const CategoryIcon = getCategoryIcon(category);
              const categoryProducts = products.filter(p => p.category === category);
              
              return (
                <Card 
                  key={category}
                  className="cursor-pointer card-hover"
                  onClick={() => setSelectedCategory(category)}
                  data-testid={`category-card-${category}`}
                >
                  <CardContent className="p-4 text-center">
                    <CategoryIcon className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                    <h4 className="font-medium capitalize">{category}</h4>
                    <p className="text-sm text-gray-500">
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
  );
};

export default Store;
