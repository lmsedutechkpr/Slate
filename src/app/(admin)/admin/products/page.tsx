import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ProductsPageClient from '@/components/admin/content/ProductsPageClient';
import type { ProductItem, ProductsStats } from '@/components/admin/content/types';

export default async function AdminProductsPage() {
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
      id, name, name_ta, slug,
      description, images, price,
      discounted_price, status,
      stock_qty, low_stock_threshold,
      total_sold, avg_rating,
      total_reviews, created_at,
      product_categories (
        id, name, slug, icon
      ),
      seller_profiles!seller_id (
        user_id, store_name,
        profiles!user_id (
          id, full_name, avatar_url
        )
      )
    `)
    .order('created_at', { ascending: false });

  let data = joinedData;
  let error = joinedError;

  // Fallback for deployments where the products -> seller_profiles relation is not introspected.
  if (joinedError) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('products')
      .select(`
        id, name, name_ta, slug,
        description, images, price,
        discounted_price, status,
        stock_qty, low_stock_threshold,
        total_sold, avg_rating,
        total_reviews, created_at,
        seller_id,
        product_categories (
          id, name, slug, icon
        )
      `)
      .order('created_at', { ascending: false });

    if (!fallbackError && fallbackData) {
      const sellerIds = Array.from(
        new Set(
          fallbackData
            .map((row: any) => row.seller_id)
            .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)
        )
      );

      let sellerMap = new Map<string, any>();
      if (sellerIds.length > 0) {
        const { data: sellerRows } = await supabase
          .from('seller_profiles')
          .select(`
            user_id, store_name,
            profiles!user_id (
              id, full_name, avatar_url
            )
          `)
          .in('user_id', sellerIds);

        sellerMap = new Map((sellerRows || []).map((row: any) => [row.user_id, row]));
      }

      data = fallbackData.map((row: any) => ({
        ...row,
        seller_profiles: sellerMap.get(row.seller_id) || null,
      }));
      error = null;
    } else {
      error = fallbackError;
    }
  }

  if (error) {
    console.error('Failed to load admin products:', error.message || 'Unknown query error');
  }

  const products = ((data || []) as any[]).map((row) => ({ ...row })) as ProductItem[];

  const stats: ProductsStats = {
    totalProducts: products.length,
    pendingProducts: products.filter((p) => p.status === 'pending').length,
    activeProducts: products.filter((p) => p.status === 'active' || p.status === 'approved').length,
    rejectedProducts: products.filter((p) => p.status === 'rejected').length,
    draftProducts: products.filter((p) => p.status === 'draft').length,
    totalUnitsSold: products.reduce((sum, p) => sum + (p.total_sold || 0), 0),
  };

  return <ProductsPageClient products={products} stats={stats} adminId={user.id} />;
}
