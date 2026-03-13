"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Star, Package, Heart } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface RecommendedProduct {
  id?: string;
  product_id?: string; // from v_user_recommendations fallback
  name?: string;
  name_ta?: string | null;
  slug?: string;
  images?: string[];
  price?: number;
  stock?: number;
  rating?: number;
  reason?: string;
}

interface RecommendedProductsProps {
  products: any[];
  initialWishlistedIds?: string[];
  userId?: string;
}

export default function RecommendedProducts({ products, initialWishlistedIds = [], userId }: RecommendedProductsProps) {
  const router = useRouter();
  const incrementCart = useCartStore((s) => s.increment);
  const supabase = createClient();
  const [wishlistedIds, setWishlistedIds] = useState<string[]>(initialWishlistedIds);

  if (!products || products.length === 0) return null;

  const handleAddToCart = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    if (!userId) return;

    incrementCart();
    await supabase
      .from("cart_items")
      .upsert({ user_id: userId, product_id: productId, quantity: 1 }, { onConflict: "user_id,product_id" });
    toast.success("Added to cart!");
  };

  const toggleWishlist = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    if (!userId) return toast.error("Please log in");

    const isWished = wishlistedIds.includes(productId);
    const newWishedIds = isWished 
      ? wishlistedIds.filter(id => id !== productId)
      : [...wishlistedIds, productId];
      
    setWishlistedIds(newWishedIds);

    if (!isWished) {
      const { error } = await supabase.from("wishlists").insert({ user_id: userId, product_id: productId });
      if (error && error.code !== "23505") {
        setWishlistedIds(wishlistedIds);
        toast.error("Failed to wishlist");
      } else toast.success("Added to wishlist");
    } else {
      const { error } = await supabase.from("wishlists").delete().eq("user_id", userId).eq("product_id", productId);
      if (error) {
        setWishlistedIds(wishlistedIds);
        toast.error("Failed to remove");
      } else toast.success("Removed from wishlist");
    }
  };

  return (
    <div className="mt-8">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-gray-900">Gear for You</h2>
          <p className="text-[12px] text-gray-400 mt-0.5">Based on your courses</p>
        </div>
        <button
          onClick={() => router.push("/student/shop")}
          className="text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          Shop →
        </button>
      </div>

      {/* Cards — horizontal scroll on mobile, grid on desktop */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
        {products.map((product, index) => {
          const actualId = product.id || product.product_id;
          if (!actualId) return null; // Defensive check
          
          let imageSrc = null;
          if (Array.isArray(product.images) && product.images.length > 0) {
            imageSrc = product.images[0];
          } else if (typeof product.images === 'string') {
            try {
              const parsed = JSON.parse(product.images);
              if (Array.isArray(parsed) && parsed.length > 0) imageSrc = parsed[0];
            } catch (e) {
              imageSrc = product.images;
            }
          }

          const priceStr = typeof product.price === "number"
            ? `₹${product.price.toLocaleString("en-IN")}`
            : "—";

          return (
            <div
              key={`${actualId}-${index}`}
              onClick={() => router.push(`/student/shop/${actualId}`)}
              className="group relative flex-shrink-0 w-[200px] lg:w-auto snap-start bg-white border border-gray-200 rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-gray-300"
            >
              {/* Image area */}
              <div className="relative w-full h-[140px] bg-gray-100 overflow-hidden">
                {imageSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageSrc}
                    alt={product.name || 'Product'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                    <Package className="w-8 h-8 text-gray-300" />
                    <span className="text-[10px] text-gray-300">No image</span>
                  </div>
                )}

                {/* Wishlist Button */}
                <button 
                  onClick={(e) => actualId && toggleWishlist(e, actualId)}
                  className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-[rgba(0,0,0,0.6)] backdrop-blur-sm flex items-center justify-center z-20 group/wishlist"
                >
                  <Heart 
                    className={`h-[13px] w-[13px] transition-colors ${
                      wishlistedIds.includes(actualId)
                        ? 'text-[#FF5F57] fill-[#FF5F57]' 
                        : 'text-white opacity-70 group-hover/wishlist:opacity-100'
                    }`} 
                  />
                </button>

                {/* Rating badge */}
                {(product.rating || product.avg_rating) > 0 ? (
                  <div className="absolute top-2 left-2 flex items-center gap-0.5 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 shadow-sm">
                    <Star className="w-2.5 h-2.5 fill-[#FEBC2E] text-[#FEBC2E]" />
                    <span className="text-[10px] font-bold text-gray-800">{Number(product.rating || product.avg_rating).toFixed(1)}</span>
                  </div>
                ) : null}
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="text-[13px] font-semibold text-gray-900 line-clamp-2 leading-snug">
                  {product.name}
                </h3>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[14px] font-bold text-gray-900">{priceStr}</span>
                  <button
                    onClick={(e) => actualId && handleAddToCart(e, actualId)}
                    className="flex items-center gap-1 bg-gray-900 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-full hover:bg-gray-700 transition-colors"
                  >
                    <ShoppingCart className="w-3 h-3" />
                    Add
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
