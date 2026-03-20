'use client';

/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Store, Star } from 'lucide-react';
import PublicNavbar from '@/components/shared/PublicNavbar';
import PublicFooter from '@/components/shared/PublicFooter';
import AddToCartButton from '@/components/landing/AddToCartButton';

type StoreProduct = {
  id: string;
  name: string;
  slug: string | null;
  images: string[] | null;
  stock_qty: number | null;
  price: number | null;
  discounted_price: number | null;
  avg_rating: number | null;
  product_categories: { name: string; slug: string } | null;
};

type StoreReview = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
};

type StorePagePublicProps = {
  seller: {
    user_id: string;
    store_name: string | null;
    store_slug: string | null;
    logo_url: string | null;
    cover_url: string | null;
    description: string | null;
    avg_rating: number | null;
    total_reviews: number | null;
  };
  products: StoreProduct[];
  reviews: StoreReview[];
};

function lights() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
      <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
      <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
    </div>
  );
}

export default function StorePagePublic({ seller, products, reviews }: StorePagePublicProps) {
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      if (p.product_categories?.slug && p.product_categories?.name) {
        map.set(p.product_categories.slug, p.product_categories.name);
      }
    });
    return [{ slug: 'all', name: 'All' }, ...Array.from(map.entries()).map(([slug, name]) => ({ slug, name }))];
  }, [products]);

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return products;
    return products.filter((p) => p.product_categories?.slug === activeCategory);
  }, [activeCategory, products]);

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <PublicNavbar />

      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-24">
        <section className="overflow-hidden rounded-[24px] border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
          <div className="flex h-[44px] items-center justify-between border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
            {lights()}
            <p className="text-[12px] font-semibold text-[#6E6E73]">Storefront</p>
          </div>

          <div className="relative p-7">
            {seller.cover_url ? (
              <img src={seller.cover_url} alt={seller.store_name || 'Store'} className="h-[180px] w-full rounded-2xl object-cover" />
            ) : (
              <div className="h-[180px] w-full rounded-2xl bg-[linear-gradient(135deg,#FFFFFF_0%,#F3F7FF_60%,#E9F9EF_100%)]" />
            )}

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="h-[72px] w-[72px] overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white">
                {seller.logo_url ? (
                  <img src={seller.logo_url} alt={seller.store_name || 'Store logo'} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Store className="h-8 w-8 text-[#AEAEB2]" />
                  </div>
                )}
              </div>

              <div>
                <h1 className="text-[30px] font-extrabold tracking-[-0.02em] text-[#1D1D1F]">{seller.store_name || 'Store'}</h1>
                <p className="mt-1 text-[13px] text-[#6E6E73]">@{seller.store_slug || 'store'}</p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-[#6E6E73]">
                  <Star className="h-4 w-4 fill-[#FEBC2E] text-[#FEBC2E]" />
                  {Number(seller.avg_rating || 0).toFixed(1)} ({seller.total_reviews || 0} reviews)
                </p>
              </div>
            </div>

            {seller.description ? <p className="mt-4 max-w-4xl text-[14px] text-[#6E6E73]">{seller.description}</p> : null}
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory(cat.slug)}
                className={`rounded-full border px-4 py-1.5 text-[12px] font-semibold transition-colors ${
                  activeCategory === cat.slug
                    ? 'border-[#1D1D1F] bg-[#1D1D1F] text-white'
                    : 'border-[rgba(0,0,0,0.1)] bg-white text-[#6E6E73] hover:bg-[#F5F5F7]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {filtered.length ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((product) => (
                <div
                  key={product.id}
                  className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_6px_20px_rgba(0,0,0,0.08)]"
                >
                  <Link href={`/student/shop/${product.id}`} className="block aspect-square bg-[#F5F5F7]">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[12px] font-semibold text-[#AEAEB2]">No image</div>
                    )}
                  </Link>

                  <div className="p-4">
                    <p className="line-clamp-2 text-[14px] font-bold text-[#1D1D1F]">{product.name}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <p className="text-[14px] font-semibold text-[#1D1D1F]">Rs {product.discounted_price ?? product.price ?? 0}</p>
                      {product.discounted_price && product.price ? (
                        <p className="text-[12px] text-[#AEAEB2] line-through">Rs {product.price}</p>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[12px] text-[#6E6E73]">{product.product_categories?.name || 'General'}</p>
                    <div className="mt-3">
                      <AddToCartButton productId={product.id} stockQty={product.stock_qty || 0} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-10 text-center text-[14px] text-[#6E6E73]">
              No products found for this category.
            </div>
          )}
        </section>

        <section className="mt-10 rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-6 shadow-[0_6px_20px_rgba(0,0,0,0.08)]">
          <h2 className="text-[20px] font-bold text-[#1D1D1F]">Store reviews</h2>
          {reviews.length ? (
            <div className="mt-4 space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-2xl border border-[rgba(0,0,0,0.06)] bg-[#FAFAFB] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-semibold text-[#1D1D1F]">{review.profiles?.full_name || 'Learner'}</p>
                    <p className="text-[12px] text-[#6E6E73]">{new Date(review.created_at).toLocaleDateString()}</p>
                  </div>
                  <p className="mt-1 text-[12px] text-[#6E6E73]">Rating: {review.rating}/5</p>
                  {review.title ? <p className="mt-2 text-[13px] font-semibold text-[#1D1D1F]">{review.title}</p> : null}
                  {review.body ? <p className="mt-1 text-[13px] text-[#6E6E73]">{review.body}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-[13px] text-[#6E6E73]">No reviews yet.</p>
          )}
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
