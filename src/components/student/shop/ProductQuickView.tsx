'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, XCircle, Star, ShoppingCart, Package, Heart } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import type { Product } from './ProductCard';

interface ProductQuickViewProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  inCart: boolean;
  cartQty: number;
  onAddToCart: (productId: string, qty: number) => void;
  onUpdateQty: (productId: string, qty: number) => void;
  onRemoveFromCart: (productId: string) => void;
  language?: string;
  userId?: string;
  initialIsWishlisted?: boolean;
}

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
      ))}
    </div>
  );
}

export default function ProductQuickView({
  product, open, onClose, inCart, cartQty,
  onAddToCart, onUpdateQty, onRemoveFromCart, language, userId, initialIsWishlisted = false
}: ProductQuickViewProps) {
  const [activeImg, setActiveImg] = useState(0);
  const [localQty, setLocalQty] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted);
  
  // Keep local wishlist state synced when opening different products
  useEffect(() => {
    setIsWishlisted(initialIsWishlisted);
  }, [product?.id, initialIsWishlisted]);

  if (!product) return null;

  const name = language === 'ta' && product.name_ta ? product.name_ta : product.name;
  const disc = product.discounted_price;
  const discPct = disc ? Math.round((1 - disc / product.price) * 100) : 0;
  const isOutOfStock = product.stock_qty === 0;
  const isLowStock = !isOutOfStock && (product.low_stock_threshold ?? 5) >= product.stock_qty;
  const imgs = product.images?.length ? product.images : [];
  
  const handleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) {
      import('sonner').then(m => m.toast.error('Please login to wishlist products'));
      return;
    }

    const newValue = !isWishlisted;
    setIsWishlisted(newValue);

    const supabase = (await import('@/lib/supabase/client')).createClient();

    if (newValue) {
      const { error } = await supabase.from('wishlists').insert({ user_id: userId, product_id: product.id });
      if (error && error.code !== '23505') {
        setIsWishlisted(!newValue);
        import('sonner').then(m => m.toast.error('Failed to add to wishlist'));
      } else {
        import('sonner').then(m => m.toast.success('Added to wishlist'));
      }
    } else {
      const { error } = await supabase.from('wishlists').delete().eq('user_id', userId).eq('product_id', product.id);
      if (error) {
        setIsWishlisted(!newValue);
        import('sonner').then(m => m.toast.error('Failed to remove from wishlist'));
      } else {
        import('sonner').then(m => m.toast.success('Removed from wishlist'));
      }
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[780px] max-w-[96vw] max-h-[88vh] bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col outline-none"
          aria-describedby={undefined}
        >
          {/* sr-only title for accessibility */}
          <Dialog.Title className="sr-only">{name}</Dialog.Title>

          {/* Mac Titlebar */}
          <div className="flex-shrink-0 bg-gray-50 border-b border-gray-100 h-11 px-5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
            </div>
            <p className="text-[12px] text-gray-400 font-medium line-clamp-1 max-w-[380px] text-center">{name}</p>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body — two column */}
          <div className="flex flex-1 min-h-0">

            {/* LEFT — Image */}
            <div className="w-[360px] flex-shrink-0 bg-gray-100 flex flex-col">
              <div className="relative flex-1 overflow-hidden">
                {imgs[activeImg] ? (
                  <img src={imgs[activeImg]} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-14 h-14 text-gray-300" />
                  </div>
                )}
                {/* Discount badge */}
                {disc && discPct > 0 && (
                  <div className="absolute top-3 left-3 bg-[#FF5F57] text-white rounded-full px-2.5 py-1 text-[11px] font-bold">
                    −{discPct}%
                  </div>
                )}
                
                {/* Wishlist Button */}
                <button 
                  onClick={handleWishlist}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[rgba(0,0,0,0.6)] backdrop-blur-sm flex items-center justify-center z-20 group/wishlist transition-transform hover:scale-105"
                >
                  <Heart 
                    className={`h-[15px] w-[15px] transition-colors ${
                      isWishlisted 
                        ? 'text-[#FF5F57] fill-[#FF5F57]' 
                        : 'text-white opacity-70 group-hover/wishlist:opacity-100'
                    }`} 
                  />
                </button>
              </div>
              {/* Thumbnails */}
              {imgs.length > 1 && (
                <div className="flex gap-2 p-3 border-t border-gray-100 bg-white overflow-x-auto">
                  {imgs.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`w-14 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-colors ${i === activeImg ? 'border-gray-900' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT — Details */}
            <div className="flex-1 overflow-y-auto p-8 flex flex-col">

              {/* Category */}
              {product.product_categories?.name && (
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  {product.product_categories.name}
                </p>
              )}

              {/* Name */}
              <h2 className="text-[22px] font-bold text-gray-900 leading-snug">{name}</h2>

              {/* Rating */}
              {(product.avg_rating ?? 0) > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <Stars rating={product.avg_rating!} />
                  <span className="text-[13px] text-gray-500 font-medium">
                    {product.avg_rating?.toFixed(1)}
                  </span>
                  <span className="text-[13px] text-gray-400">
                    ({product.total_reviews} reviews)
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-end gap-3 mt-5">
                <span className="text-[32px] font-extrabold text-gray-900 leading-none">
                  {fmt(disc ?? product.price)}
                </span>
                {disc && (
                  <>
                    <span className="text-[17px] text-gray-400 line-through mb-0.5">{fmt(product.price)}</span>
                    <span className="text-[13px] font-bold text-[#FF5F57] mb-0.5">{discPct}% off</span>
                  </>
                )}
              </div>

              {/* Divider */}
              <div className="my-5 h-px bg-gray-100" />

              {/* Description */}
              {product.description && (
                <p className="text-[14px] text-gray-500 leading-relaxed line-clamp-4 mb-5">
                  {product.description}
                </p>
              )}

              {/* Stock status */}
              <div className="mb-5">
                {isOutOfStock ? (
                  <div className="inline-flex items-center gap-1.5 bg-red-50 text-[#FF5F57] rounded-full px-3 py-1.5">
                    <XCircle className="w-3.5 h-3.5" />
                    <span className="text-[12px] font-medium">Out of stock</span>
                  </div>
                ) : isLowStock ? (
                  <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 rounded-full px-3 py-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span className="text-[12px] font-medium">Only {product.stock_qty} left</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-600 rounded-full px-3 py-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="text-[12px] font-medium">In stock — {product.stock_qty} available</span>
                  </div>
                )}
              </div>

              {/* Qty controls */}
              {!isOutOfStock && (
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-[13px] text-gray-500 font-medium">
                    {inCart ? 'In cart:' : 'Quantity:'}
                  </span>
                  <div className="flex items-center bg-gray-100 rounded-xl border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => {
                        if (inCart) { cartQty <= 1 ? onRemoveFromCart(product.id) : onUpdateQty(product.id, cartQty - 1); }
                        else { setLocalQty(q => Math.max(1, q - 1)); }
                      }}
                      className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-200 font-bold text-lg transition-colors"
                    >−</button>
                    <span className="font-semibold text-[16px] text-gray-900 w-10 text-center">
                      {inCart ? cartQty : localQty}
                    </span>
                    <button
                      onClick={() => {
                        if (inCart) { onUpdateQty(product.id, cartQty + 1); }
                        else { setLocalQty(q => Math.min(product.stock_qty, q + 1)); }
                      }}
                      disabled={inCart ? cartQty >= product.stock_qty : localQty >= product.stock_qty}
                      className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-200 font-bold text-lg transition-colors disabled:opacity-30"
                    >+</button>
                  </div>
                </div>
              )}

              {/* Spacer to push button down */}
              <div className="flex-1" />

              {/* Add to Cart Button */}
              <button
                disabled={isOutOfStock}
                onClick={() => {
                  if (inCart) { onUpdateQty(product.id, cartQty + localQty); }
                  else { onAddToCart(product.id, localQty); setLocalQty(1); }
                }}
                className={`w-full py-3.5 rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-colors
                  ${isOutOfStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
              >
                <ShoppingCart className="w-4 h-4" />
                {isOutOfStock ? 'Out of Stock' : inCart ? 'Update Cart' : 'Add to Cart'}
              </button>

              {/* View full product page */}
              <a
                href={`/student/shop/${product.id}`}
                className="block text-center text-[13px] text-gray-400 hover:text-gray-700 mt-3 transition-colors"
              >
                View full details →
              </a>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
