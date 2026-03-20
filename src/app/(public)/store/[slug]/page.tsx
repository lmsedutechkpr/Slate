/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import StorePagePublic from '@/components/public/StorePagePublic';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: sellerBySlug } = await admin
    .from('seller_profiles')
    .select('store_name')
    .eq('store_slug', slug)
    .maybeSingle();

  const seller = sellerBySlug
    ? sellerBySlug
    : (
        await admin
          .from('seller_profiles')
          .select('store_name')
          .eq('user_id', slug)
          .maybeSingle()
      ).data;

  return {
    title: seller?.store_name ? `${seller.store_name} - Slate Store` : 'Storefront - Slate',
    description: 'Public seller storefront on Slate LMS.',
  };
}

export default async function PublicStorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: sellerBySlug } = await admin
    .from('seller_profiles')
    .select('user_id, store_name, store_slug, logo_url, cover_url, description, avg_rating, total_reviews')
    .eq('store_slug', slug)
    .maybeSingle();

  const seller = sellerBySlug
    ? sellerBySlug
    : (
        await admin
          .from('seller_profiles')
          .select('user_id, store_name, store_slug, logo_url, cover_url, description, avg_rating, total_reviews')
          .eq('user_id', slug)
          .maybeSingle()
      ).data;

  if (!seller) notFound();

  const [{ data: products }, { data: reviews }] = await Promise.all([
    admin
      .from('products')
      .select('id,name,slug,images,stock_qty,price,discounted_price,avg_rating,product_categories(name,slug)')
      .eq('seller_id', seller.user_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    admin
      .from('reviews')
      .select('id,rating,title,body,created_at,profiles!reviewer_id(full_name,avatar_url)')
      .eq('target_type', 'seller')
      .eq('target_id', seller.user_id)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  return <StorePagePublic seller={seller as any} products={(products || []) as any[]} reviews={(reviews || []) as any[]} />;
}
