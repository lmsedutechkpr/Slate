import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import ProductDetailClient from '@/components/student/shop/ProductDetailClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Fetch main product by id
  const { data: product } = await admin
    .from('products')
    .select(`
      id, name, name_ta, slug, description, description_ta,
      price, discounted_price, images, tags,
      stock_qty, low_stock_threshold, status,
      total_sold, avg_rating, total_reviews,
      related_course_tags, seller_id, category_id,
      product_categories ( id, name, slug, icon )
    `)
    .eq('id', id)
    .eq('status', 'active')
    .single();

  if (!product) notFound();

  // Reviews — fetch WITHOUT profiles join (FK is to auth.users, not public.profiles)
  const { data: rawReviews } = await admin
    .from('reviews')
    .select('id, rating, title, body, created_at, reviewer_id')
    .eq('target_type', 'product')
    .eq('product_id', product.id)
    .order('created_at', { ascending: false })
    .limit(30);

  // Enrich reviews with profile data from public.profiles
  const reviewerIds = [...new Set((rawReviews || []).map((r: any) => r.reviewer_id))];
  let profileMap: Record<string, { full_name?: string; avatar_url?: string }> = {};
  if (reviewerIds.length > 0) {
    const { data: profilesData } = await admin
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', reviewerIds);
    (profilesData || []).forEach((p: any) => { profileMap[p.id] = p; });
  }

  const reviews = (rawReviews || []).map((r: any) => ({
    ...r,
    profiles: profileMap[r.reviewer_id] ?? null,
  }));

  // Check if current user already reviewed
  const { data: myReview } = await admin
    .from('reviews')
    .select('id, rating, title, body')
    .eq('target_type', 'product')
    .eq('product_id', product.id)
    .eq('reviewer_id', user.id)
    .single();

  // Related products (same category)
  const catId = (product.product_categories as any)?.id ?? product.category_id;
  const { data: related } = await admin
    .from('products')
    .select('id, name, slug, price, discounted_price, images, avg_rating, product_categories(name)')
    .eq('status', 'active')
    .eq('category_id', catId)
    .neq('id', product.id)
    .limit(4);

  // Cart item for this product
  const { data: cartRaw } = await admin
    .from('cart_items')
    .select('id, quantity, product_id')
    .eq('user_id', user.id)
    .eq('product_id', product.id)
    .maybeSingle();

  const cartQty = cartRaw?.quantity ?? 0;

  // Language preference
  const { data: prefs } = await admin
    .from('user_preferences')
    .select('language')
    .eq('user_id', user.id)
    .single();

  // Wishlist status for this product
  const { data: wishlistRaw } = await admin
    .from('wishlists')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', product.id)
    .maybeSingle();

  const isWishlisted = !!wishlistRaw;

  return (
    <ProductDetailClient
      product={{ ...product, product_categories: Array.isArray(product.product_categories) ? product.product_categories[0] : product.product_categories } as any}
      reviews={reviews as any[]}
      myReview={myReview as any}
      relatedProducts={(related || []) as any[]}
      cartQty={cartQty}
      userId={user.id}
      language={prefs?.language || 'en'}
      initialIsWishlisted={isWishlisted}
    />
  );
}
