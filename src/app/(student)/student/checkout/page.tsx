import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CheckoutClient from '@/components/student/checkout/CheckoutClient';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch cart items with product details
  const { data: rawCart } = await supabase
    .from('cart_items')
    .select(`
      id, quantity,
      products (
        id, name, name_ta, slug,
        price, discounted_price,
        images, stock_qty,
        seller_id
      )
    `)
    .eq('user_id', user.id);

  // Normalize products (might come as array)
  const cartItems = (rawCart || [])
    .map((ci: any) => ({
      ...ci,
      products: Array.isArray(ci.products) ? ci.products[0] : ci.products,
    }))
    .filter((ci: any) => ci.products != null);

  // If cart is empty, redirect to shop
  if (cartItems.length === 0) {
    redirect('/student/shop');
  }

  // Fetch saved addresses
  const { data: addresses } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false });

  // Fetch user profile for prefill
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone')
    .eq('id', user.id)
    .single();

  return (
    <CheckoutClient
      cartItems={cartItems as any[]}
      addresses={(addresses || []) as any[]}
      profile={profile as any}
      userId={user.id}
    />
  );
}
