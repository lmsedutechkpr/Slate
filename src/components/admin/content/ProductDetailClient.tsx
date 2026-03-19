'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { moderateContentAction } from '@/app/actions/admin';
import ReviewPanel from './ReviewPanel';
import ApprovalActionBar from './ApprovalActionBar';
import type { ProductItem } from './types';

function currency(n?: number | null) {
  return `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
}

export default function ProductDetailClient({
  product,
  adminId,
}: {
  product: ProductItem;
  adminId: string;
}) {
  const router = useRouter();
  const [activeImage, setActiveImage] = useState(product.images?.[0] || null);
  const [actionLoading, setActionLoading] = useState(false);

  const seller = product.seller_profiles;
  const sellerName = seller?.store_name || seller?.profiles?.full_name || 'Seller';
  const isPending = (product.status || '').toLowerCase() === 'pending';

  const finalPrice = product.discounted_price || product.price || 0;
  const originalPrice = product.price || 0;
  const discountPct = originalPrice > finalPrice && originalPrice > 0
    ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
    : 0;

  const grossRevenue = finalPrice * (product.total_sold || 0);
  const commissionRate = seller?.commission_rate || 85;
  const sellerNet = grossRevenue * (commissionRate / 100);
  const platformFee = grossRevenue - sellerNet;

  const doAction = async (action: 'approve' | 'reject' | 'revoke' | 'pending', note?: string) => {
    setActionLoading(true);
    const result = await moderateContentAction({
      itemId: product.id,
      adminId,
      type: 'product',
      action,
      note,
    });
    setActionLoading(false);

    if (!result.success) {
      toast.error(result.error || 'Action failed');
      return;
    }

    if (action === 'approve') toast.success('Product approved and live!');
    if (action === 'reject') toast.success('Product rejected. Creator notified.');
    if (action === 'revoke') toast.success('Product approval revoked.');
    if (action === 'pending') toast.success('Product moved back to pending review.');

    router.refresh();
  };

  return (
    <div className="pb-24 font-[DM_Sans] lg:pb-0">
      <button
        type="button"
        onClick={() => router.push('/admin/products')}
        className="mb-4 inline-flex items-center gap-2 text-[13px] font-semibold text-[#1D1D1F]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </button>

      <h1 className="mb-4 text-[26px] font-bold text-[#1D1D1F]">Product Review</h1>

      {isPending ? (
        <ReviewPanel
          type="product"
          submittedAt={product.created_at}
          creatorName={sellerName}
          onApprove={() => doAction('approve')}
          onReject={() => doAction('reject', 'Please update product details and resolve review feedback before resubmission.')}
        />
      ) : null}

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1">
          <div className="mb-5 overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
            <div className="border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-4 py-3 text-[12px] font-semibold text-[#6E6E73]">
              Product Overview
            </div>

            <div className="p-6">
              <div className="relative h-[220px] w-full overflow-hidden rounded-2xl bg-[#F5F5F7] p-2">
                {activeImage ? (
                  <Image
                    src={activeImage}
                    alt={product.name}
                    fill
                    className="object-contain object-center"
                  />
                ) : null}
              </div>

              {(product.images || []).length > 1 ? (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {(product.images || []).map((img) => (
                    <button
                      type="button"
                      key={img}
                      onClick={() => setActiveImage(img)}
                      className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border ${
                        img === activeImage ? 'border-[#1D1D1F]' : 'border-transparent'
                      }`}
                    >
                      <Image src={img} alt={product.name} fill className="object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}

              <h2 className="mt-4 text-[24px] font-extrabold text-[#1D1D1F]">{product.name}</h2>
              {product.name_ta ? <p className="mt-1 text-[13px] text-[#6E6E73]">தமிழ்: {product.name_ta}</p> : null}

              <p className="mt-4 text-[14px] leading-relaxed text-[#1D1D1F]">{product.description || 'No description provided.'}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#F5F5F7] px-3 py-1 text-[12px] text-[#6E6E73]">
                  {product.product_categories?.name || 'General'}
                </span>
                {(product.tags || []).map((tag) => (
                  <span key={tag} className="rounded-full bg-[#F5F5F7] px-3 py-1 text-[12px] text-[#6E6E73]">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#F5F5F7] p-3">
                  <p className="text-[11px] text-[#AEAEB2]">SKU</p>
                  <p className="text-[13px] font-semibold text-[#1D1D1F]">{product.sku || 'Not set'}</p>
                </div>
                <div className="rounded-xl bg-[#F5F5F7] p-3">
                  <p className="text-[11px] text-[#AEAEB2]">Weight</p>
                  <p className="text-[13px] font-semibold text-[#1D1D1F]">{product.weight || 'Not set'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-5 overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
            <div className="border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-4 py-3 text-[12px] font-semibold text-[#6E6E73]">
              Stock + Pricing
            </div>
            <div className="grid gap-3 p-4 md:grid-cols-2">
              <div className="rounded-xl bg-[#F5F5F7] p-4">
                <p className="text-[11px] text-[#AEAEB2]">Current Price</p>
                <p className="text-[22px] font-extrabold text-[#1D1D1F]">{currency(finalPrice)}</p>
                {discountPct > 0 ? (
                  <p className="mt-1 text-[12px] text-[#28C840]">{discountPct}% off from {currency(originalPrice)}</p>
                ) : null}
              </div>

              <div className="rounded-xl bg-[#F5F5F7] p-4">
                <p className="text-[11px] text-[#AEAEB2]">Stock</p>
                <p className="text-[22px] font-extrabold text-[#1D1D1F]">{product.stock_qty || 0}</p>
                <p className="mt-1 text-[12px] text-[#6E6E73]">Low stock threshold: {product.low_stock_threshold || 0}</p>
              </div>

              <div className="rounded-xl bg-[#F5F5F7] p-4">
                <p className="text-[11px] text-[#AEAEB2]">Gross Revenue</p>
                <p className="text-[18px] font-bold text-[#1D1D1F]">{currency(grossRevenue)}</p>
              </div>

              <div className="rounded-xl bg-[#F5F5F7] p-4">
                <p className="text-[11px] text-[#AEAEB2]">Seller Net / Platform Fee</p>
                <p className="text-[13px] text-[#1D1D1F]">{currency(sellerNet)} / {currency(platformFee)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[340px]">
          <ApprovalActionBar
            item={product}
            type="product"
            loading={actionLoading}
            onApprove={(note) => doAction('approve', note)}
            onReject={(reason) => doAction('reject', reason)}
            onRevoke={(reason) => doAction('revoke', reason)}
            onMarkPending={() => doAction('pending')}
          />

          <div className="mt-4 overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
            <div className="border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-4 py-3 text-[12px] font-semibold text-[#6E6E73]">
              Seller
            </div>
            <div className="p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="relative h-11 w-11 overflow-hidden rounded-full bg-[#F5F5F7]">
                  {seller?.profiles?.avatar_url ? (
                    <Image src={seller.profiles.avatar_url} alt={sellerName} fill className="object-cover" />
                  ) : null}
                </div>
                <div>
                  <p className="text-[15px] font-bold text-[#1D1D1F]">{sellerName}</p>
                  <p className="text-[12px] text-[#6E6E73]">{seller?.store_slug || 'Storefront'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#F5F5F7] p-3">
                  <p className="text-[14px] font-bold text-[#1D1D1F]">{seller?.total_sales || 0}</p>
                  <p className="text-[11px] text-[#6E6E73]">Sales</p>
                </div>
                <div className="rounded-xl bg-[#F5F5F7] p-3">
                  <p className="text-[14px] font-bold text-[#FEBC2E]">{(seller?.avg_rating || 0).toFixed(1)}★</p>
                  <p className="text-[11px] text-[#6E6E73]">Rating</p>
                </div>
                <div className="rounded-xl bg-[#F5F5F7] p-3">
                  <p className="text-[14px] font-bold text-[#1D1D1F]">{seller?.commission_rate || 85}%</p>
                  <p className="text-[11px] text-[#6E6E73]">Share</p>
                </div>
                <div className="rounded-xl bg-[#F5F5F7] p-3">
                  <p className="text-[14px] font-bold text-[#1D1D1F]">{product.total_reviews || 0}</p>
                  <p className="text-[11px] text-[#6E6E73]">Reviews</p>
                </div>
              </div>

              {seller?.user_id ? (
                <button
                  type="button"
                  onClick={() => router.push(`/admin/users/${seller.user_id}`)}
                  className="mt-3 text-[12px] font-medium text-[#1D1D1F]"
                >
                  View Profile {'->'}
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
            <div className="border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-4 py-3 text-[12px] font-semibold text-[#6E6E73]">
              Product Stats
            </div>
            <div className="grid grid-cols-2 gap-3 p-4">
              <div className="rounded-xl bg-[#F5F5F7] p-3">
                <p className="text-[14px] font-bold text-[#1D1D1F]">{product.total_sold || 0}</p>
                <p className="text-[11px] text-[#6E6E73]">Total Sold</p>
              </div>
              <div className="rounded-xl bg-[#F5F5F7] p-3">
                <p className="text-[14px] font-bold text-[#FEBC2E]">{(product.avg_rating || 0).toFixed(1)}★</p>
                <p className="text-[11px] text-[#6E6E73]">Avg Rating</p>
              </div>
              <div className="rounded-xl bg-[#F5F5F7] p-3">
                <p className="text-[14px] font-bold text-[#1D1D1F]">{product.total_reviews || 0}</p>
                <p className="text-[11px] text-[#6E6E73]">Reviews</p>
              </div>
              <div className="rounded-xl bg-[#F5F5F7] p-3">
                <p className="text-[14px] font-bold text-[#1D1D1F]">{product.stock_qty || 0}</p>
                <p className="text-[11px] text-[#6E6E73]">Stock Qty</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
