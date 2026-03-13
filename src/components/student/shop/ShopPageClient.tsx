'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Search, ShoppingBag, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { useUIStore } from '@/store/useUIStore';
import ProductCard, { type Product } from './ProductCard';
import ProductQuickView from './ProductQuickView';
import CartDrawer from './CartDrawer';
import type { CartItemType } from './CartItem';

interface Category { id: string; name: string; slug: string; icon?: string; }

interface ShopPageClientProps {
  products: Product[];
  categories: Category[];
  cartItems: CartItemType[];
  enrolledTags: string[];
  userId: string;
  language?: string;
  initialWishlistedIds?: string[];
}

type SortOption = 'best_selling' | 'price_asc' | 'price_desc' | 'highest_rated';

export default function ShopPageClient({
  products, categories, cartItems: initialCart, enrolledTags, userId, language, initialWishlistedIds = []
}: ShopPageClientProps) {
  const supabase = createClient();
  const { setCount } = useCartStore();
  const { cartDrawerOpen, setCartDrawerOpen } = useUIStore();

  const searchParams = useSearchParams();
  const [cart, setCart] = useState<CartItemType[]>(initialCart);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [searchQ, setSearchQ] = useState('');
  const [activeCat, setActiveCat] = useState<string>(() => searchParams.get('category') ?? 'all');
  const [sort, setSort] = useState<SortOption>('best_selling');

  // Sync activeCat when URL param changes (e.g. back navigation)
  useEffect(() => {
    const cat = searchParams.get('category') ?? 'all';
    setActiveCat(cat);
  }, [searchParams]);

  // Sync cart count to store
  useEffect(() => {
    const total = cart.reduce((s, ci) => s + ci.quantity, 0);
    setCount(total);
  }, [cart, setCount]);

  // Realtime cart sync
  useEffect(() => {
    const channel = supabase
      .channel('shop-cart')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'cart_items',
        filter: `user_id=eq.${userId}`
      }, async () => {
        const { data } = await supabase
          .from('cart_items')
          .select('id, quantity, product_id, products(id, name, price, discounted_price, images, stock_qty)')
          .eq('user_id', userId);
        if (data) setCart(data as any);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, userId]);

  const addToCart = useCallback(async (productId: string, qty: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Optimistic update
    setCart(prev => {
      const existing = prev.find(ci => ci.product_id === productId);
      if (existing) {
        return prev.map(ci => ci.product_id === productId ? { ...ci, quantity: ci.quantity + qty } : ci);
      }
      return [...prev, {
        id: `temp-${productId}`, quantity: qty, product_id: productId,
        products: { id: product.id, name: product.name, price: product.price, discounted_price: product.discounted_price, images: product.images, stock_qty: product.stock_qty }
      }];
    });
    toast.success('Added to cart');

    // No unique constraint on cart_items — select first, then insert or update
    const { data: existing } = await supabase.from('cart_items')
      .select('id, quantity').eq('user_id', userId).eq('product_id', productId).maybeSingle();
    if (existing?.id) {
      const { error } = await supabase.from('cart_items').update({ quantity: existing.quantity + qty }).eq('id', existing.id);
      if (error) toast.error('Failed to save cart');
    } else {
      const { error } = await supabase.from('cart_items').insert({ user_id: userId, product_id: productId, quantity: qty });
      if (error) toast.error('Failed to save cart');
    }
  }, [products, supabase, userId]);

  const updateQty = useCallback(async (productId: string, newQty: number) => {
    if (newQty <= 0) { removeFromCart(productId); return; }
    setCart(prev => prev.map(ci => ci.product_id === productId ? { ...ci, quantity: newQty } : ci));
    const { data: existing } = await supabase.from('cart_items')
      .select('id').eq('user_id', userId).eq('product_id', productId).maybeSingle();
    if (existing?.id) await supabase.from('cart_items').update({ quantity: newQty }).eq('id', existing.id);
  }, [supabase, userId]);

  const removeFromCart = useCallback(async (productId: string) => {
    setCart(prev => prev.filter(ci => ci.product_id !== productId));
    toast.success('Removed from cart');
    await supabase.from('cart_items').delete()
      .eq('user_id', userId).eq('product_id', productId);
  }, [supabase, userId]);

  const recommended = useMemo(() => {
    if (!enrolledTags.length) return [];
    return products.filter(p =>
      (p.related_course_tags || []).some(t => enrolledTags.includes(t))
    ).slice(0, 4);
  }, [products, enrolledTags]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (activeCat !== 'all') list = list.filter(p => p.product_categories?.slug === activeCat);
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    switch (sort) {
      case 'price_asc': list.sort((a, b) => (a.discounted_price ?? a.price) - (b.discounted_price ?? b.price)); break;
      case 'price_desc': list.sort((a, b) => (b.discounted_price ?? b.price) - (a.discounted_price ?? a.price)); break;
      case 'highest_rated': list.sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0)); break;
    }
    return list;
  }, [products, activeCat, searchQ, sort]);

  const cartMap = useMemo(() => {
    const m: Record<string, number> = {};
    cart.forEach(ci => { m[ci.product_id] = ci.quantity; });
    return m;
  }, [cart]);

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px] text-gray-400 mb-4">
        <Link href="/student/dashboard" className="hover:text-gray-700 transition-colors">Dashboard</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-700 font-medium">Shop</span>
      </div>

      <div className="mb-5">
        <h1 className="text-[26px] font-bold text-gray-900">Shop</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">Tech accessories for learners</p>
      </div>

      {/* Recommended strip */}
      {recommended.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[15px] font-semibold text-gray-900">Recommended for You</span>
            <span className="text-[12px] text-gray-400">Based on your enrolled courses</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {recommended.map(p => (
              <div key={p.id} className="w-[190px] flex-shrink-0">
                <ProductCard
                  product={p} inCart={!!cartMap[p.id]} cartQty={cartMap[p.id] ?? 0}
                  onAddToCart={addToCart} onUpdateQty={updateQty} onRemoveFromCart={removeFromCart}
                  onQuickView={setQuickViewProduct} variant="compact" language={language}
                  userId={userId} initialIsWishlisted={initialWishlistedIds.includes(p.id)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sticky filter area */}
      <div className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm pt-2 pb-3 -mx-6 px-6 border-b border-gray-100 mb-5">
        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2">
          {[{ id: 'all', name: 'All', slug: 'all' }, ...categories].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.slug)}
              className={`rounded-full px-3.5 py-1.5 text-[12px] whitespace-nowrap transition-all flex-shrink-0
                ${activeCat === cat.slug
                  ? 'bg-gray-900 text-white font-semibold'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-400 hover:text-gray-900'
                }`}
            >
              {(cat as any).icon && <span className="mr-1">{(cat as any).icon}</span>}
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search + Sort */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortOption)}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-[13px] text-gray-700 focus:outline-none focus:border-gray-400 w-[160px] cursor-pointer"
          >
            <option value="best_selling">Best Selling</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="highest_rated">Highest Rated</option>
          </select>
          <span className="text-[12px] text-gray-400 whitespace-nowrap">{filtered.length} products</span>
        </div>
      </div>

      {/* Product grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm py-16 flex flex-col items-center text-center">
          <div className="flex items-center gap-1.5 mb-5">
            <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
            <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
            <div className="h-2 w-2 rounded-full bg-[#28C840]" />
          </div>
          <ShoppingBag className="w-10 h-10 text-gray-300 mb-4" />
          <p className="text-[18px] font-semibold text-gray-700">No products found</p>
          <p className="text-[14px] text-gray-400 mt-2">Try a different category or search term</p>
          <button
            onClick={() => { setActiveCat('all'); setSearchQ(''); }}
            className="mt-5 text-[13px] text-gray-500 border border-gray-200 rounded-full px-5 py-2 hover:bg-gray-50 transition-colors"
          >Clear filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(p => (
            <ProductCard
              key={p.id} product={p}
              inCart={!!cartMap[p.id]} cartQty={cartMap[p.id] ?? 0}
              onAddToCart={addToCart} onUpdateQty={updateQty} onRemoveFromCart={removeFromCart}
              onQuickView={setQuickViewProduct} variant="full" language={language}
              initialIsWishlisted={initialWishlistedIds.includes(p.id)} userId={userId}
            />
          ))}
        </div>
      )}

      <ProductQuickView
        product={quickViewProduct}
        open={!!quickViewProduct && !cartDrawerOpen}
        onClose={() => setQuickViewProduct(null)}
        inCart={quickViewProduct ? !!cartMap[quickViewProduct.id] : false}
        cartQty={quickViewProduct ? (cartMap[quickViewProduct.id] ?? 0) : 0}
        onAddToCart={addToCart} onUpdateQty={updateQty} onRemoveFromCart={removeFromCart}
        language={language}
        userId={userId}
        initialIsWishlisted={quickViewProduct ? initialWishlistedIds.includes(quickViewProduct.id) : false}
      />

      <CartDrawer
        open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)}
        cartItems={cart} onUpdateQty={updateQty} onRemove={removeFromCart}
      />
    </div>
  );
}
