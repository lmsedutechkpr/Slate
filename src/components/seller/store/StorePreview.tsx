'use client';

import { Star, ExternalLink } from 'lucide-react';

interface Props {
  localStore: {
    store_name: string;
    store_slug: string;
    store_description: string;
    banner_url: string;
    logo_url: string;
  };
  products: any[];
  reviews: any[];
  avgRating: number;
}

export default function StorePreview({ localStore, products, reviews, avgRating }: Props) {
  const initials = localStore.store_name
    ? localStore.store_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'ST';

  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
      {/* TITLEBAR */}
      <div className="flex h-11 items-center justify-between border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
            <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
            <div className="h-2 w-2 rounded-full bg-[#28C840]" />
          </div>
          <span className="ml-1 font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">Store Preview</span>
        </div>
        {localStore.store_slug && (
          <button
            onClick={() => window.open(`/store/${localStore.store_slug}`, '_blank')}
            className="flex items-center gap-1 text-[13px] text-[#6E6E73] hover:text-[#1D1D1F] transition-colors cursor-pointer"
          >
            Open Full Preview
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* PREVIEW CONTENT */}
      <div className="overflow-hidden">
        {/* BANNER */}
        <div className="h-[120px] overflow-hidden">
          {localStore.banner_url ? (
            <img src={localStore.banner_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-[#F5F5F7] to-[#AEAEB2]" />
          )}
        </div>

        {/* STORE HEADER */}
        <div className="p-5 relative">
          {/* Logo */}
          <div className="w-10 h-10 rounded-xl border-2 border-white absolute -top-5 left-5 overflow-hidden bg-[#F5F5F7] shadow-sm">
            {localStore.logo_url ? (
              <img src={localStore.logo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#1D1D1F] text-white text-[11px] font-bold">
                {initials}
              </div>
            )}
          </div>

          <div className="mt-6">
            <h3 className="font-[DM_Sans] text-[18px] font-extrabold text-[#1D1D1F]">
              {localStore.store_name || 'Your Store Name'}
            </h3>
            {localStore.store_description && (
              <p className="text-[12px] text-[#6E6E73] line-clamp-2 mt-1">{localStore.store_description}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              {avgRating > 0 && (
                <span className="flex items-center gap-1 text-[12px] text-[#AEAEB2]">
                  <Star className="w-3 h-3 text-[#FEBC2E] fill-[#FEBC2E]" />
                  {avgRating.toFixed(1)}
                </span>
              )}
              <span className="text-[12px] text-[#AEAEB2]">{products.length} products</span>
            </div>
          </div>
        </div>

        {/* PRODUCTS MINI GRID */}
        {products.length > 0 && (
          <div className="px-4 pb-2">
            <p className="font-[DM_Sans] text-[12px] font-semibold text-[#1D1D1F] mb-3">
              Products ({products.length})
            </p>
            <div className="grid grid-cols-3 gap-2">
              {products.slice(0, 6).map(product => (
                <div key={product.id}>
                  <div className="aspect-square rounded-xl overflow-hidden bg-[#F5F5F7]">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
                    )}
                  </div>
                  <p className="text-[10px] text-[#1D1D1F] line-clamp-1 mt-1">{product.name}</p>
                  <p className="font-[DM_Sans] text-[11px] font-bold text-[#1D1D1F]">
                    ₹{(product.discounted_price ?? product.price ?? 0).toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REVIEWS STRIP */}
        {reviews.length > 0 && (
          <div className="px-4 pb-4">
            <p className="font-[DM_Sans] text-[12px] font-semibold text-[#1D1D1F] mb-2">
              Reviews ({reviews.length}) <Star className="inline w-3 h-3 text-[#FEBC2E] fill-[#FEBC2E] -mt-0.5" /> {avgRating.toFixed(1)}
            </p>
            <div className="space-y-2">
              {reviews.slice(0, 2).map((review: any) => {
                const reviewer = Array.isArray(review.profiles) ? review.profiles[0] : review.profiles;
                return (
                  <div key={review.id} className="bg-[#F5F5F7] rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-2.5 h-2.5 ${i < review.rating ? 'text-[#FEBC2E] fill-[#FEBC2E]' : 'text-[#AEAEB2]'}`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-[#6E6E73]">{reviewer?.full_name || 'Customer'}</span>
                    </div>
                    <p className="text-[11px] text-[#1D1D1F] line-clamp-1 mt-1">{review.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
