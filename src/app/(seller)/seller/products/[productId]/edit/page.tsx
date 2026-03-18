import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProductFormClient from '@/components/seller/products/ProductFormClient';

export default async function EditProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'seller') redirect('/student/dashboard');

  const { data: sellerProfile } = await supabase
    .from('seller_profiles')
    .select('commission_rate')
    .eq('user_id', user.id)
    .single();

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('seller_id', user.id)
    .single();

  if (!product) redirect('/seller/products');

  const { data: categories } = await supabase
    .from('product_categories')
    .select('id, name, slug, icon')
    .eq('is_active', true)
    .order('sort_order');

  return (
    <ProductFormClient 
      userId={user.id}
      sellerCommissionRate={sellerProfile?.commission_rate || 75}
      categories={categories || []}
      product={product} 
    />
  );
}
