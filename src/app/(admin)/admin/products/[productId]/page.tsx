import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ProductDetailClient from '@/components/admin/content/ProductDetailClient';
import type { ProductItem } from '@/components/admin/content/types';

interface PageProps {
  params: Promise<{ productId: string }>;
}

export default async function AdminProductDetailPage({ params }: PageProps) {
  const { productId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') redirect('/student/dashboard');

  const { data: joinedData, error: joinedError } = await supabase
    .from('products')
    .select(`
      *,
      product_categories ( name, slug ),
      seller_profiles!seller_id (
        user_id, store_name, store_slug,
        avg_rating, total_sales,
        commission_rate,
        profiles!user_id (
          id, full_name, avatar_url
        )
      )
    `)
    .eq('id', productId)
    .single();

  let data = joinedData;
  let error = joinedError;

  if (joinedError) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('products')
      .select(`
        *,
        product_categories ( name, slug ),
        seller_id
      `)
      .eq('id', productId)
      .single();

    if (!fallbackError && fallbackData) {
      const { data: sellerProfile } = fallbackData.seller_id
        ? await supabase
            .from('seller_profiles')
            .select(`
              user_id, store_name, store_slug,
              avg_rating, total_sales,
              commission_rate,
              profiles!user_id (
                id, full_name, avatar_url
              )
            `)
            .eq('user_id', fallbackData.seller_id)
            .single()
        : { data: null };

      data = {
        ...fallbackData,
        seller_profiles: sellerProfile || null,
      };
      error = null;
    } else {
      error = fallbackError;
    }
  }

  if (error || !data) {
    console.error('Failed to load product review detail:', error?.message || 'Unknown query error');
    notFound();
  }

  return <ProductDetailClient product={data as ProductItem} adminId={user.id} />;
}
