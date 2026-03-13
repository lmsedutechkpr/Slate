'use client';

import { useState } from 'react';
import { Package, Eye, ShoppingCart, Star, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

export interface Product {
  id: string;
  name: string;
  name_ta?: string;
  slug?: string;
  description?: string;
  price: number;
  discounted_price?: number;
  images?: string[];
  stock_qty: number;
  low_stock_threshold?: number;
  total_sold?: number;
  avg_rating?: number;
  total_reviews?: number;
  related_course_tags?: string[];
  product_categories?: { id: string; name: string; slug: string; icon?: string };
}

interface ProductCardProps {
  product: Product;
  inCart: boolean;
  cartQty: number;
  onAddToCart: (productId: string, qty: number) => void;
  onUpdateQty: (productId: string, qty: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onQuickView: (product: Product) => void;
  variant: 'full' | 'compact';
  language?: string;
  initialIsWishlisted?: boolean;
  userId?: string;
  onRemoveWishlist?: () => void;
}

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

export default function ProductCard({
  product, inCart, cartQty, onAddToCart, onUpdateQty, onRemoveFromCart,
  onQuickView, variant, language, initialIsWishlisted = false, userId, onRemoveWishlist
}: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted);
  const supabase = createClient();

  const name = language === 'ta' && product.name_ta ? product.name_ta : product.name;
  const img = product.images?.[0];
  const isOutOfStock = product.stock_qty === 0;
  const isLowStock = !isOutOfStock && (product.low_stock_threshold ?? 5) >= product.stock_qty;
  const disc = product.discounted_price;
  const discPct = disc ? Math.round((1 - disc / product.price) * 100) : 0;

  const handleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) {
      toast.error('Please login to wishlist products');
      return;
    }

    if (onRemoveWishlist && isWishlisted) {
      // If we are on the wishlist page and it's already wishlisted, use the parent's optimistic removal
      onRemoveWishlist();
      return;
    }

    const newValue = !isWishlisted;
    setIsWishlisted(newValue);

    if (newValue) {
      const { error } = await supabase.from('wishlists').insert({ user_id: userId, product_id: product.id });
      if (error && error.code !== '23505') {
        setIsWishlisted(!newValue);
        toast.error('Failed to add to wishlist');
      } else {
        toast.success('Added to wishlist');
      }
    } else {
      const { error } = await supabase.from('wishlists').delete().eq('user_id', userId).eq('product_id', product.id);
      if (error) {
        setIsWishlisted(!newValue);
        toast.error('Failed to remove from wishlist');
      } else {
        toast.success('Removed from wishlist');
      }
    }
  };

  return (
    <div
      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:-translate-y-1 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col"
      onClick={() => onQuickView(product)}
    >
      {/* Mac Titlebar */}
      <div className="bg-gray-50 border-b border-gray-100 px-3 py-2 flex items-center gap-1.5 flex-shrink-0">
        <div className="h-1.5 w-1.5 rounded-full bg-[#FF5F57]" />
        <div className="h-1.5 w-1.5 rounded-full bg-[#FEBC2E]" />
        <div className="h-1.5 w-1.5 rounded-full bg-[#28C840]" />
      </div>

      {/* Image */}
      <div className={`relative bg-gray-100 overflow-hidden flex-shrink-0 ${variant === 'full' ? 'aspect-square' : 'h-[140px]'}`}>
        {img ? (
          <img src={img} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-9 h-9 text-gray-300" />
          </div>
        )}

        {/* Discount badge */}
        {disc && discPct > 0 && (
          <div className="absolute top-2 left-2 bg-[#FF5F57] text-white rounded-full px-2 py-0.5 text-[10px] font-bold">
            −{discPct}%
          </div>
        )}

        {/* Quick view */}
        <button
          onClick={(e) => { e.stopPropagation(); onQuickView(product); }}
          className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Eye className="w-3.5 h-3.5 text-white" />
        </button>

        {/* Wishlist Button */}
        <button 
          onClick={handleWishlist}
          className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-[rgba(0,0,0,0.6)] backdrop-blur-sm flex items-center justify-center z-20 group/wishlist"
        >
          <Heart 
            className={`h-[13px] w-[13px] transition-colors ${
              isWishlisted 
                ? 'text-[#FF5F57] fill-[#FF5F57]' 
                : 'text-white opacity-70 group-hover/wishlist:opacity-100'
            }`} 
          />
        </button>

        {/* Stock badge */}
        {isOutOfStock && (
          <div className="absolute bottom-0 left-0 bg-[#FF5F57]/90 text-white text-[10px] rounded-r-lg px-2 py-1">Out of Stock</div>
        )}
        {isLowStock && !isOutOfStock && (
          <div className="absolute bottom-0 left-0 bg-[#FEBC2E]/90 text-gray-900 text-[10px] rounded-r-lg px-2 py-1">
            Only {product.stock_qty} left
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1">
        {variant === 'full' && product.product_categories?.name && (
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">{product.product_categories.name}</p>
        )}

        <p className={`font-semibold text-gray-900 ${variant === 'full' ? 'text-[14px] line-clamp-2' : 'text-[12px] line-clamp-1'}`}>
          {name}
        </p>

        {variant === 'full' && (product.avg_rating ?? 0) > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            <Star className="w-3 h-3 text-[#FEBC2E] fill-[#FEBC2E]" />
            <span className="text-[11px] text-amber-500 font-semibold">{product.avg_rating?.toFixed(1)}</span>
            <span className="text-[11px] text-gray-400">({product.total_reviews})</span>
          </div>
        )}

        {/* Price */}
        <div className="mt-2 flex items-center gap-2">
          <span className={`font-bold text-gray-900 ${variant === 'full' ? 'text-[16px]' : 'text-[14px]'}`}>
            {fmt(disc ?? product.price)}
          </span>
          {disc && (
            <span className="text-[12px] text-gray-400 line-through">{fmt(product.price)}</span>
          )}
        </div>

        {/* Cart button */}
        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
          {isOutOfStock ? (
            <button disabled className="w-full bg-gray-100 text-gray-400 text-[12px] rounded-xl px-4 py-2 cursor-not-allowed">
              Out of Stock
            </button>
          ) : inCart ? (
            <div className="flex items-center justify-between bg-gray-100 rounded-xl px-3 py-2">
              <button
                onClick={() => cartQty <= 1 ? onRemoveFromCart(product.id) : onUpdateQty(product.id, cartQty - 1)}
                className="text-gray-700 font-bold text-lg leading-none hover:text-gray-900"
              >−</button>
              <span className="font-semibold text-[14px] text-gray-900">{cartQty}</span>
              <button
                onClick={() => onUpdateQty(product.id, cartQty + 1)}
                disabled={cartQty >= product.stock_qty}
                className="text-gray-700 font-bold text-lg leading-none hover:text-gray-900 disabled:opacity-40"
              >+</button>
            </div>
          ) : (
            <button
              onClick={() => onAddToCart(product.id, 1)}
              className="w-full bg-gray-900 text-white font-semibold text-[13px] rounded-xl px-4 py-2 hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
