'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  ShoppingCart, ChevronRight, ChevronLeft, Star, CheckCircle2,
  AlertCircle, XCircle, Share2, Package, MessageSquare, X, ZoomIn, Heart
} from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/store/useCartStore';
import { useUIStore } from '@/store/useUIStore';
import { format } from 'date-fns';
import * as Dialog from '@radix-ui/react-dialog';

interface Category { id: string; name: string; slug: string; icon?: string; }
interface Product {
  id: string; name: string; name_ta?: string; slug: string;
  description?: string; description_ta?: string;
  price: number; discounted_price?: number;
  images?: string[]; tags?: string[];
  stock_qty: number; low_stock_threshold?: number;
  avg_rating?: number; total_reviews?: number; total_sold?: number;
  product_categories?: Category;
}
interface Review {
  id: string; rating: number; title?: string; body?: string;
  created_at: string; reviewer_id: string;
  profiles?: { full_name?: string; avatar_url?: string };
}
interface RelatedProduct {
  id: string; name: string; slug: string;
  price: number; discounted_price?: number; images?: string[];
  avg_rating?: number; product_categories?: { name: string };
}
interface MyReview { id: string; rating: number; title?: string; body?: string; }

interface ProductDetailClientProps {
  product: Product;
  reviews: Review[];
  myReview?: MyReview | null;
  relatedProducts: RelatedProduct[];
  cartQty: number;
  userId: string;
  language?: string;
  initialIsWishlisted?: boolean;
}

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN'); }

function StarRow({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5';
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`${cls} ${s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
      ))}
    </div>
  );
}

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[13px] text-gray-500 w-6 flex-shrink-0">{label}★</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[12px] text-gray-400 w-5 text-right">{count}</span>
    </div>
  );
}

function ClickableStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(s => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
        >
          <Star className={`w-7 h-7 transition-colors ${s <= (hover || value) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
        </button>
      ))}
    </div>
  );
}

export default function ProductDetailClient({
  product, reviews: initialReviews, myReview: initialMyReview,
  relatedProducts, cartQty: initialCartQty, userId, language, initialIsWishlisted = false
}: ProductDetailClientProps) {
  const supabase = createClient();
  const router = useRouter();
  const { setCount } = useCartStore();
  const { setCartDrawerOpen } = useUIStore();

  const [activeImg, setActiveImg] = useState(0);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [qty, setQty] = useState(Math.max(1, initialCartQty));
  const [inCart, setInCart] = useState(initialCartQty > 0);
  const [cartQty, setCartQty] = useState(initialCartQty);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [myReview, setMyReview] = useState<MyReview | null>(initialMyReview ?? null);
  const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted);

  // Review form state
  const [reviewRating, setReviewRating] = useState(myReview?.rating ?? 0);
  const [reviewTitle, setReviewTitle] = useState(myReview?.title ?? '');
  const [reviewBody, setReviewBody] = useState(myReview?.body ?? '');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const name = language === 'ta' && product.name_ta ? product.name_ta : product.name;
  const desc = language === 'ta' && product.description_ta ? product.description_ta : product.description;
  const disc = product.discounted_price;
  const discPct = disc ? Math.round((1 - disc / product.price) * 100) : 0;
  const isOutOfStock = product.stock_qty === 0;
  const isLowStock = !isOutOfStock && (product.low_stock_threshold ?? 5) >= product.stock_qty;
  const imgs = product.images?.length ? product.images : [];

  const addToCart = useCallback(async () => {
    setInCart(true); setCartQty(qty);
    toast.success('Added to cart');
    // Check if row exists, then insert or update
    const { data: existing } = await supabase.from('cart_items').select('id').eq('user_id', userId).eq('product_id', product.id).maybeSingle();
    if (existing?.id) {
      const { error } = await supabase.from('cart_items').update({ quantity: qty }).eq('id', existing.id);
      if (error) { toast.error('Failed to save cart'); }
    } else {
      const { error } = await supabase.from('cart_items').insert({ user_id: userId, product_id: product.id, quantity: qty });
      if (error) { toast.error('Failed to save cart'); }
    }
  }, [supabase, userId, product.id, qty]);

  const updateQtyFn = useCallback(async (newQty: number) => {
    if (newQty <= 0) {
      setInCart(false); setCartQty(0); setQty(1);
      toast.success('Removed from cart');
      await supabase.from('cart_items').delete().eq('user_id', userId).eq('product_id', product.id);
    } else {
      setCartQty(newQty);
      const { data: existing } = await supabase.from('cart_items').select('id').eq('user_id', userId).eq('product_id', product.id).maybeSingle();
      if (existing?.id) { await supabase.from('cart_items').update({ quantity: newQty }).eq('id', existing.id); }
    }
  }, [supabase, userId, product.id]);

  const handleWishlist = async () => {
    if (!userId) {
      toast.error('Please login to wishlist products');
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

  const submitReview = async () => {
    if (reviewRating === 0) { toast.error('Please select a rating'); return; }
    setSubmittingReview(true);
    try {
      if (myReview) {
        // Update existing
        const { error } = await supabase.from('reviews').update({
          rating: reviewRating, title: reviewTitle || null, body: reviewBody || null,
        }).eq('id', myReview.id);
        if (error) throw error;
        setMyReview({ ...myReview, rating: reviewRating, title: reviewTitle, body: reviewBody });
        setReviews(prev => prev.map(r => r.id === myReview.id
          ? { ...r, rating: reviewRating, title: reviewTitle, body: reviewBody }
          : r));
        toast.success('Review updated!');
      } else {
        // New review
        const { data, error } = await supabase.from('reviews').insert({
          reviewer_id: userId, target_type: 'product', product_id: product.id,
          rating: reviewRating, title: reviewTitle || null, body: reviewBody || null,
          is_approved: true,
        }).select('id, rating, title, body, created_at, reviewer_id').single();
        if (error) throw error;
        setMyReview({ id: data.id, rating: reviewRating, title: reviewTitle, body: reviewBody });
        setReviews(prev => [data as any, ...prev]);
        toast.success('Review submitted! Thank you 🎉');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const breakdown = [5,4,3,2,1].map(star => ({
    star, count: reviews.filter(r => Math.round(r.rating) === star).length,
  }));

  return (
    <div className="pb-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[13px] text-gray-400 mb-4 flex-wrap">
        <Link href="/student/dashboard" className="hover:text-gray-700 transition-colors">Dashboard</Link>
        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
        <Link href="/student/shop" className="hover:text-gray-700 transition-colors">Shop</Link>
        {product.product_categories?.name && (
          <>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            <Link
              href={`/student/shop?category=${product.product_categories.slug}`}
              className="hover:text-gray-700 transition-colors"
            >
              {product.product_categories.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="text-gray-700 font-medium line-clamp-1">{name}</span>
      </nav>

      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-800 mb-5 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Shop
      </button>

      {/* Main product section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
        {/* LEFT — Images */}
        <div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-100 px-4 py-2.5 flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
            </div>
            <div
              className="relative aspect-square bg-gray-100 overflow-hidden cursor-zoom-in group"
              onClick={() => imgs[activeImg] && setLightboxImg(imgs[activeImg])}
            >
              {imgs[activeImg] ? (
                <>
                  <img src={imgs[activeImg]} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-2.5">
                      <ZoomIn className="w-5 h-5 text-gray-700" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-16 h-16 text-gray-300" />
                </div>
              )}
              {disc && discPct > 0 && (
                <div className="absolute top-4 left-4 bg-[#FF5F57] text-white rounded-full px-3 py-1 text-[12px] font-bold pointer-events-none">−{discPct}%</div>
              )}
            </div>
          </div>
          {imgs.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {imgs.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  className={`w-14 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all
                    ${i === activeImg ? 'border-gray-900 shadow-md' : 'border-gray-200 opacity-60 hover:opacity-100'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — Info + Purchase */}
        <div className="flex flex-col">
          {product.product_categories?.name && (
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
              {product.product_categories.name}
            </span>
          )}
          <h1 className="text-[26px] font-bold text-gray-900 leading-tight mb-3">{name}</h1>

          {(product.avg_rating ?? 0) > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <StarRow rating={product.avg_rating!} size="sm" />
              <span className="text-[14px] font-semibold text-amber-500">{product.avg_rating?.toFixed(1)}</span>
              <a href="#reviews" className="text-[14px] text-gray-400 hover:text-gray-700 transition-colors">({reviews.length} reviews)</a>
              {(product.total_sold ?? 0) > 0 && <span className="text-[13px] text-gray-400">· {product.total_sold} sold</span>}
            </div>
          )}

          <div className="flex items-end gap-3 mb-4">
            <span className="text-[34px] font-extrabold text-gray-900 leading-none">{fmt(disc ?? product.price)}</span>
            {disc && (
              <>
                <span className="text-[17px] text-gray-400 line-through mb-1">{fmt(product.price)}</span>
                <span className="text-[12px] font-bold text-[#FF5F57] mb-1.5 bg-red-50 px-2 py-0.5 rounded-full">{discPct}% off</span>
              </>
            )}
          </div>

          <div className="mb-4">
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1.5 bg-red-50 text-[#FF5F57] rounded-full px-3 py-1.5 text-[12px] font-medium">
                <XCircle className="w-3.5 h-3.5" /> Out of stock
              </span>
            ) : isLowStock ? (
              <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 rounded-full px-3 py-1.5 text-[12px] font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> Only {product.stock_qty} left
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-600 rounded-full px-3 py-1.5 text-[12px] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> In stock — {product.stock_qty} available
              </span>
            )}
          </div>

          <div className="h-px bg-gray-100 mb-4" />

          {desc && <p className="text-[15px] text-gray-600 leading-relaxed mb-5">{desc}</p>}

          {!!product.tags?.length && (
            <div className="flex flex-wrap gap-2 mb-5">
              {product.tags.map(tag => (
                <span key={tag} className="text-[12px] text-gray-500 bg-gray-100 rounded-full px-3 py-1">{tag}</span>
              ))}
            </div>
          )}

          {!isOutOfStock && (
            <div className="space-y-3">
              {!inCart ? (
                <>
                  <div className="flex items-center gap-4">
                    <span className="text-[14px] text-gray-600 font-medium">Qty:</span>
                    <div className="flex items-center bg-gray-100 rounded-xl border border-gray-200 overflow-hidden">
                      <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-200 font-bold text-lg transition-colors">−</button>
                      <span className="font-semibold text-[16px] text-gray-900 w-10 text-center">{qty}</span>
                      <button onClick={() => setQty(q => Math.min(product.stock_qty, q + 1))} className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-200 font-bold text-lg transition-colors">+</button>
                    </div>
                  </div>
                  <button onClick={addToCart} className="w-full bg-gray-900 text-white font-bold text-[15px] rounded-xl py-4 flex items-center justify-center gap-2.5 hover:bg-gray-800 transition-colors">
                    <ShoppingCart className="w-5 h-5" /> Add to Cart
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <span className="text-[14px] text-gray-600 font-medium">In cart:</span>
                    <div className="flex items-center bg-gray-100 rounded-xl border border-gray-200 overflow-hidden">
                      <button onClick={() => updateQtyFn(cartQty - 1)} className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-200 font-bold text-lg transition-colors">−</button>
                      <span className="font-semibold text-[16px] text-gray-900 w-10 text-center">{cartQty}</span>
                      <button onClick={() => updateQtyFn(cartQty + 1)} disabled={cartQty >= product.stock_qty} className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-200 font-bold text-lg transition-colors disabled:opacity-30">+</button>
                    </div>
                  </div>
                  <button onClick={() => setCartDrawerOpen(true)} className="w-full bg-gray-900 text-white font-bold text-[15px] rounded-xl py-4 flex items-center justify-center gap-2.5 hover:bg-gray-800 transition-colors">
                    <ShoppingCart className="w-5 h-5" /> Update Cart
                  </button>
                </>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }}
              className="flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-gray-700 transition-colors"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
            <button
              onClick={handleWishlist}
              className={`flex items-center gap-1.5 text-[13px] transition-colors ${
                isWishlisted ? 'text-[#FF5F57]' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#FF5F57]' : ''}`} /> 
              {isWishlisted ? 'Saved' : 'Wishlist'}
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div id="reviews" className="mb-10">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
            <span className="ml-3 text-[13px] font-medium text-gray-500">Customer Reviews</span>
          </div>
          <div className="p-6">
            {reviews.length === 0 && !myReview ? (
              <div className="flex flex-col items-center py-8 text-center">
                <MessageSquare className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-[16px] font-semibold text-gray-700">No reviews yet</p>
                <p className="text-[14px] text-gray-400 mt-1">Be the first to review this product below</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
                <div>
                  <div className="text-center mb-5">
                    <div className="text-[52px] font-extrabold text-gray-900 leading-none">{(product.avg_rating ?? 0).toFixed(1)}</div>
                    <div className="flex justify-center mt-1"><StarRow rating={product.avg_rating ?? 0} size="lg" /></div>
                    <p className="text-[13px] text-gray-400 mt-2">{reviews.length} reviews</p>
                  </div>
                  <div className="space-y-2">
                    {breakdown.map(({ star, count }) => (
                      <RatingBar key={star} label={String(star)} count={count} total={reviews.length} />
                    ))}
                  </div>
                </div>
                <div className="space-y-5">
                  {reviews.map(review => {
                    const profile = Array.isArray(review.profiles) ? (review.profiles as any)[0] : review.profiles;
                    return (
                      <div key={review.id} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                        <div className="flex items-start gap-3 mb-2">
                          {profile?.avatar_url ? (
                            <img src={profile.avatar_url} className="w-9 h-9 rounded-full object-cover flex-shrink-0" alt="" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-[13px] font-bold text-gray-600 flex-shrink-0">
                              {(profile?.full_name ?? '?').charAt(0)}
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[14px] font-semibold text-gray-900">{profile?.full_name ?? 'Anonymous'}</span>
                              <span className="text-[12px] text-gray-400">{format(new Date(review.created_at), 'MMM d, yyyy')}</span>
                            </div>
                            <StarRow rating={review.rating} size="sm" />
                          </div>
                        </div>
                        {review.title && <p className="text-[14px] font-semibold text-gray-800 mb-1">{review.title}</p>}
                        {review.body && <p className="text-[14px] text-gray-600 leading-relaxed">{review.body}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Write / Edit a Review */}
      <div className="mb-10">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
              <span className="ml-3 text-[13px] font-medium text-gray-500">{myReview ? 'Your Review' : 'Write a Review'}</span>
            </div>
            <button
              onClick={() => setShowReviewForm(v => !v)}
              className="text-[13px] font-medium text-gray-700 border border-gray-200 rounded-full px-4 py-1.5 hover:bg-gray-100 transition-colors"
            >
              {showReviewForm ? 'Cancel' : myReview ? 'Edit Review' : 'Write a Review'}
            </button>
          </div>

          {/* Show existing review summary when form is closed */}
          {myReview && !showReviewForm && (
            <div className="p-5">
              <div className="flex items-center gap-2 mb-1.5">
                <StarRow rating={myReview.rating} size="sm" />
                <span className="text-[13px] text-gray-500">{['','Poor','Fair','Good','Very Good','Excellent'][myReview.rating]}</span>
              </div>
              {myReview.title && <p className="text-[14px] font-semibold text-gray-800 mb-1">{myReview.title}</p>}
              {myReview.body && <p className="text-[14px] text-gray-600">{myReview.body}</p>}
            </div>
          )}

          {/* Review form — shown only when toggled */}
          {(!myReview || showReviewForm) && showReviewForm && (
          <div className="p-6">
            <div className="max-w-lg">
              <p className="text-[14px] text-gray-600 mb-4">
                {myReview ? 'Update your review below.' : 'Share your experience. Only one review per product allowed.'}
              </p>

              {/* Star selector */}
              <div className="mb-4">
                <label className="text-[13px] font-medium text-gray-700 block mb-2">Your Rating</label>
                <ClickableStars value={reviewRating} onChange={setReviewRating} />
                <p className="text-[12px] text-gray-400 mt-1">
                  {reviewRating === 0 ? 'Click to rate' : ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewRating]}
                </p>
              </div>

              {/* Title */}
              <div className="mb-3">
                <label className="text-[13px] font-medium text-gray-700 block mb-1">Title (optional)</label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={e => setReviewTitle(e.target.value)}
                  placeholder="Summarize your review..."
                  maxLength={100}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>

              {/* Body */}
              <div className="mb-5">
                <label className="text-[13px] font-medium text-gray-700 block mb-1">Review (optional)</label>
                <textarea
                  value={reviewBody}
                  onChange={e => setReviewBody(e.target.value)}
                  placeholder="Tell others about your experience..."
                  rows={4}
                  maxLength={1000}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors resize-none"
                />
              </div>

              <button
                onClick={async () => { await submitReview(); setShowReviewForm(false); }}
                disabled={submittingReview || reviewRating === 0}
                className="bg-gray-900 text-white font-semibold text-[14px] rounded-xl px-6 py-3 hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submittingReview ? 'Submitting...' : myReview ? 'Update Review' : 'Submit Review'}
              </button>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-[18px] font-bold text-gray-900 mb-4">Related Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map(rp => {
              const rImg = rp.images?.[0];
              const rDisc = rp.discounted_price;
              return (
                <Link key={rp.id} href={`/student/shop/${rp.id}`}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5 transition-all group">
                  <div className="bg-gray-50 border-b border-gray-100 px-3 py-2 flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#FF5F57]" />
                    <div className="h-1.5 w-1.5 rounded-full bg-[#FEBC2E]" />
                    <div className="h-1.5 w-1.5 rounded-full bg-[#28C840]" />
                  </div>
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    {rImg
                      ? <img src={rImg} alt={rp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-gray-300" /></div>}
                  </div>
                  <div className="p-3">
                    <p className="text-[13px] font-semibold text-gray-900 line-clamp-2 leading-snug mb-1">{rp.name}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-bold text-gray-900">{fmt(rDisc ?? rp.price)}</span>
                      {rDisc && <span className="text-[12px] text-gray-400 line-through">{fmt(rp.price)}</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImg && (
        <Dialog.Root open={!!lightboxImg} onOpenChange={o => !o && setLightboxImg(null)}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm" onClick={() => setLightboxImg(null)} />
            <Dialog.Content
              className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none"
              aria-describedby={undefined}
            >
              <Dialog.Title className="sr-only">Image Preview</Dialog.Title>
              <div className="relative max-w-5xl max-h-[90vh] w-full">
                <img
                  src={lightboxImg}
                  alt="Full size"
                  className="w-full h-full object-contain rounded-xl shadow-2xl"
                  style={{ maxHeight: '88vh' }}
                />
                <button
                  onClick={() => setLightboxImg(null)}
                  className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors shadow-lg"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      {/* Global Cart Drawer */}
      {/* Imported via CartDrawer and connected through UIStore */}
    </div>
  );
}
