'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import StoreSettingsForm from './StoreSettingsForm';
import StorePreview from './StorePreview';
import StoreStatsCard from './StoreStatsCard';
import StoreURLCard from './StoreURLCard';
import QuickActionsCard from './QuickActionsCard';
import StoreReviews from './StoreReviews';

interface Props {
  sellerProfile: any;
  products: any[];
  reviews: any[];
  userId: string;
}

export default function StorePageClient({ sellerProfile, products, reviews, userId }: Props) {
  // Local state for live preview (only save on button click)
  const [localStore, setLocalStore] = useState({
    store_name: sellerProfile?.store_name || '',
    store_name_ta: sellerProfile?.store_name_ta || '',
    store_slug: sellerProfile?.store_slug || '',
    store_description: sellerProfile?.store_description || '',
    business_type: sellerProfile?.business_type || 'individual',
    banner_url: sellerProfile?.banner_url || '',
    logo_url: sellerProfile?.store_logo_url || '',
    contact_email: sellerProfile?.contact_email || '',
    social_links: sellerProfile?.social_links || {},
  });

  const avgRating = sellerProfile?.avg_rating ?? 0;
  const totalSales = sellerProfile?.total_sales ?? 0;
  const totalRevenue = sellerProfile?.total_revenue ?? 0;
  const isStoreActive = sellerProfile?.status === 'active' || sellerProfile?.status === 'approved';

  return (
    <div className="mx-auto max-w-6xl pb-10 font-[DM_Sans]">
      {/* ─── PAGE HEADER ─── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[26px] font-bold text-[#1D1D1F]">My Store</h1>
          <p className="mt-1 text-[13px] text-[#6E6E73]">Manage your public store page</p>
        </div>
        <button
          onClick={() => {
            if (localStore.store_slug) {
              window.open(`/store/${localStore.store_slug}`, '_blank');
            }
          }}
          disabled={!localStore.store_slug}
          className="flex items-center bg-[#1D1D1F] text-white rounded-full px-5 py-2.5 text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ExternalLink className="w-[13px] h-[13px] mr-2" />
          View Live Store →
        </button>
      </div>

      {/* ─── TWO COLUMN LAYOUT ─── */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT COLUMN */}
        <div className="flex-1 min-w-0 space-y-5">
          <StoreSettingsForm
            sellerProfile={sellerProfile}
            userId={userId}
            localStore={localStore}
            setLocalStore={setLocalStore}
            isStoreActive={isStoreActive}
          />
          <StorePreview
            localStore={localStore}
            products={products}
            reviews={reviews}
            avgRating={avgRating}
          />
        </div>

        {/* RIGHT COLUMN — sticky on desktop */}
        <div className="w-full lg:w-[300px] flex-shrink-0">
          <div className="lg:sticky lg:top-6 space-y-4">
            {/* On mobile show URL card first for easy sharing */}
            <div className="block lg:hidden">
              <StoreURLCard storeSlug={localStore.store_slug} />
            </div>
            <StoreStatsCard
              totalSales={totalSales}
              totalRevenue={totalRevenue}
              avgRating={avgRating}
              productCount={products.length}
            />
            <div className="hidden lg:block">
              <StoreURLCard storeSlug={localStore.store_slug} />
            </div>
            <QuickActionsCard />
          </div>
        </div>
      </div>

      {/* ─── REVIEWS SECTION (full width below) ─── */}
      <div className="mt-6">
        <StoreReviews reviews={reviews} avgRating={avgRating} />
      </div>
    </div>
  );
}
