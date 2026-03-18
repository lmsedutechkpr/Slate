import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProductsPageClient from '@/components/seller/products/ProductsPageClient';

export default async function SellerProductsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'seller') redirect('/student/dashboard');

  // Fetch all products for this seller
  console.log('[Products Page] Logged-in user.id:', user.id);

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select(`
      id, name, name_ta, slug, description, price, discounted_price, images,
      stock_qty, low_stock_threshold, status, total_sold, avg_rating, total_reviews,
      related_course_tags, created_at, updated_at,
      product_categories ( id, name, slug, icon )
    `)
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false });

  if (productsError) {
    console.error('[Products Page] Query error:', productsError.message);
  }
  console.log('[Products Page] Products found:', products?.length ?? 0);

  // Fetch categories for the filter
  const { data: categories } = await supabase
    .from('product_categories')
    .select('id, name, slug, icon')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  const validProducts = products || [];
  
  // Calculate stats
  let totalRevenue = 0;
  let totalSold = 0;
  let activeCount = 0;
  let outOfStockCount = 0;
  let lowStockCount = 0;

  validProducts.forEach(p => {
    totalSold += p.total_sold;
    totalRevenue += (p.total_sold * (p.discounted_price || p.price || 0));
    
    if (p.status === 'active') activeCount++;
    if (p.stock_qty === 0) outOfStockCount++;
    else if (p.stock_qty <= (p.low_stock_threshold || 5)) lowStockCount++;
  });

  const stats = {
    totalProducts: validProducts.length,
    activeProducts: activeCount,
    outOfStock: outOfStockCount,
    lowStock: lowStockCount,
    pendingProducts: validProducts.filter(p => p.status === 'pending').length,
    draftProducts: validProducts.filter(p => p.status === 'draft').length,
    totalRevenue,
    totalSold,
  };

  return (
    <ProductsPageClient
      initialProducts={validProducts}
      categories={categories || []}
      stats={stats}
      userId={user.id}
    />
  );
}
