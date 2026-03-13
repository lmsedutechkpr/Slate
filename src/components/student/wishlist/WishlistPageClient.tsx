'use client';

import { useState } from 'react';
import { BookOpen, ShoppingBag, HeartOff, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import CourseCatalogCard, { type CatalogCourse } from '@/components/courses/CourseCatalogCard';
import ProductCard, { type Product } from '@/components/student/shop/ProductCard';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useCartStore } from '@/store/useCartStore';

interface WishlistPageClientProps {
  courses: CatalogCourse[];
  products: Product[];
  enrolledCourseIds: string[];
  cartItems: { product_id: string; quantity: number }[];
  userId: string;
  language?: string;
}

export default function WishlistPageClient({
  courses,
  products,
  enrolledCourseIds,
  cartItems,
  userId,
  language = 'en',
}: WishlistPageClientProps) {
  const [tab, setTab] = useState<'courses'|'products'>('courses');
  
  // Local state for optimistic wishlist removal
  const [localCourses, setLocalCourses] = useState(courses);
  const [localProducts, setLocalProducts] = useState(products);
  
  // Cart state for products
  const [cartMap, setCartMap] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    cartItems.forEach(ci => { map[ci.product_id] = ci.quantity; });
    return map;
  });
  
  const { setCount } = useCartStore();
  const supabase = createClient();

  const addToCart = async (productId: string, qty: number) => {
    if (!userId) { toast.error('Please log in'); return; }
    
    // Optimistic UI updates cart count in navbar
    const store = useCartStore.getState();
    store.increment();

    const newQty = (cartMap[productId] || 0) + qty;
    setCartMap(prev => ({ ...prev, [productId]: newQty }));
    
    const { error } = await supabase.from('cart_items').upsert(
      { user_id: userId, product_id: productId, quantity: newQty },
      { onConflict: 'user_id,product_id' }
    );
    
    if (error) toast.error('Failed to add to cart');
    else toast.success('Added to cart');
  };

  const updateQty = async (productId: string, qty: number) => {
    if (!userId) return;
    setCartMap(prev => ({ ...prev, [productId]: qty }));
    const { error } = await supabase.from('cart_items').update({ quantity: qty }).eq('user_id', userId).eq('product_id', productId);
    if (error) toast.error('Failed to update quantity');
  };

  const removeFromCart = async (productId: string) => {
    if (!userId) return;
    
    // Update local cart state
    setCartMap(prev => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });

    const store = useCartStore.getState();
    // Re-fetch count or decrement by the correct amount that was in the cart
    const qtyToRemove = cartMap[productId] || 1;
    store.setCount(Math.max(0, store.count - qtyToRemove));

    const { error } = await supabase.from('cart_items').delete().eq('user_id', userId).eq('product_id', productId);
    if (error) toast.error('Failed to remove item');
  };

  const handleProductWishlistToggle = async (productId: string) => {
    // Since this is the wishlist page, toggling means removing from wishlist
    setLocalProducts(prev => prev.filter(p => p.id !== productId));
    const { error } = await supabase.from('wishlists').delete().eq('user_id', userId).eq('product_id', productId);
    if (error) toast.error('Failed to remove from wishlist');
  };

  const handleCourseWishlistToggle = async (courseId: string) => {
    setLocalCourses(prev => prev.filter(c => c.id !== courseId));
    const { error } = await supabase.from('wishlists').delete().eq('user_id', userId).eq('course_id', courseId);
    if (error) toast.error('Failed to remove from wishlist');
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-2">
        <Link href="/student/dashboard" className="hover:text-gray-900 transition-colors">Dashboard</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-900 font-medium">Wishlist</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Your Wishlist</h1>
          <p className="text-[14px] text-gray-500 mt-1">
            Keep track of the courses and gear you want to get next.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-200/50 p-1 rounded-xl w-fit">
          <button
            onClick={() => setTab('courses')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 ${
              tab === 'courses' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Courses ({courses.length})
          </button>
          <button
            onClick={() => setTab('products')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 ${
              tab === 'products' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Gear ({localProducts.length})
          </button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="min-h-[400px]">
        {tab === 'courses' && (
          localCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {localCourses.map(course => (
                <CourseCatalogCard 
                  key={course.id}
                    course={course}
                    initialIsEnrolled={enrolledCourseIds.includes(course.id)}
                  initialIsWishlisted={true}
                  userId={userId}
                  isStudentView={true}
                  onRemoveWishlist={() => handleCourseWishlistToggle(course.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState tab="courses" Icon={BookOpen} title="No saved courses" subtitle="Explore the catalog to find courses you'd like to take." />
          )
        )}

        {tab === 'products' && (
          localProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 lg:gap-5 gap-4">
              {localProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  inCart={!!cartMap[product.id]}
                  cartQty={cartMap[product.id] ?? 0}
                  onAddToCart={addToCart}
                  onUpdateQty={updateQty}
                  onRemoveFromCart={removeFromCart}
                  onQuickView={() => {}} // Could wire up a quick view drawer if desired
                  variant="compact"
                  language={language}
                  initialIsWishlisted={true}
                  userId={userId}
                  onRemoveWishlist={() => handleProductWishlistToggle(product.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState tab="products" Icon={ShoppingBag} title="No saved gear" subtitle="Check out our shop to find tech accessories for your learning journey." />
          )
        )}
      </div>
    </div>
  );
}

function EmptyState({ tab, Icon, title, subtitle }: { tab: string; Icon: any; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 border-dashed rounded-2xl text-center px-4">
      <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
        <HeartOff className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-[16px] font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-[14px] text-gray-500 max-w-[280px]">{subtitle}</p>
    </div>
  );
}
