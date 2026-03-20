/* eslint-disable @typescript-eslint/no-explicit-any */
import Image from 'next/image';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import PublicNavbar from '@/components/shared/PublicNavbar';
import PublicFooter from '@/components/shared/PublicFooter';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Sellers - Slate',
  description: 'Browse all seller storefronts on Slate LMS.',
};

export default async function PublicSellersPage() {
  const admin = createAdminClient();

  const { data: sellersRaw } = await admin
    .from('seller_profiles')
    .select(
      `
      user_id,store_name,store_slug,logo_url,description,avg_rating,total_reviews,
      profiles!user_id(full_name,avatar_url)
    `,
    )
    .order('total_reviews', { ascending: false })
    .limit(200);

  const sellers = (sellersRaw || []) as any[];

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      <main className="mx-auto w-full max-w-6xl px-6 pb-12 pt-24 sm:px-8">
        <div className="mb-7">
          <h1 className="text-[32px] font-extrabold text-[#1D1D1F]">All Sellers</h1>
          <p className="mt-1 text-[13px] text-[#6E6E73]">{sellers.length} public storefronts</p>
        </div>

        {sellers.length ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sellers.map((seller) => {
              const display = seller.store_name || seller.profiles?.full_name || 'Storefront';
              const initials = String(display).charAt(0).toUpperCase();
              const publicHandle = seller.store_slug || seller.user_id;

              return (
                <Link
                  key={seller.user_id}
                  href={`/store/${publicHandle}`}
                  className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-transform hover:-translate-y-[2px]"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-full bg-[#F5F5F7]">
                      {seller.logo_url || seller.profiles?.avatar_url ? (
                        <Image src={seller.logo_url || seller.profiles?.avatar_url} alt={display} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[14px] font-bold text-[#1D1D1F]">{initials}</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-[#1D1D1F]">{display}</p>
                      <p className="truncate text-[12px] text-[#6E6E73]">@{publicHandle}</p>
                    </div>
                  </div>

                  <p className="mt-3 line-clamp-2 text-[12px] text-[#6E6E73]">{seller.description || 'Explore products curated for learners.'}</p>

                  <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-[#6E6E73]">
                    <span className="rounded-full bg-[#F5F5F7] px-2.5 py-1">{Number(seller.avg_rating || 0).toFixed(1)} rating</span>
                    <span className="rounded-full bg-[#F5F5F7] px-2.5 py-1">{Number(seller.total_reviews || 0)} reviews</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-8 text-center text-[13px] text-[#6E6E73] shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
            No sellers found.
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
