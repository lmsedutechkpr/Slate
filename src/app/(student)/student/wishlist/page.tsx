import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import WishlistPageClient from '@/components/student/wishlist/WishlistPageClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Wishlist – Slate',
  description: 'Your saved courses and products.',
};

export default async function WishlistPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch wishlisted courses
  const { data: courseWishes } = await supabase
    .from('wishlists')
    .select(`
      course_id,
      courses (
        id, title, title_ta, slug, thumbnail_url, subtitle,
        is_free, price, discounted_price, avg_rating, total_reviews,
        total_enrolled, total_lectures, total_duration_mins, difficulty, language, certificate_enabled,
        categories ( id, name, name_ta, color, slug ),
        course_instructors ( is_primary, profiles ( id, full_name, avatar_url ) )
      )
    `)
    .eq('user_id', user.id)
    .not('course_id', 'is', null);

  // Fetch wishlisted products
  const { data: productWishes } = await supabase
    .from('wishlists')
    .select(`
      product_id,
      products (
        id, name, name_ta, slug, description,
        price, discounted_price, images,
        stock_qty, low_stock_threshold,
        status, total_sold, avg_rating,
        total_reviews, related_course_tags,
        product_categories ( id, name, slug, icon )
      )
    `)
    .eq('user_id', user.id)
    .not('product_id', 'is', null);

  // We also need user's enrolled courses to show 'Enrolled' badge on course cards
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('student_id', user.id)
    .eq('is_active', true);

  const enrolledCourseIds = new Set((enrollments || []).map(e => e.course_id));

  // Language preference
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('language')
    .eq('user_id', user.id)
    .single();

  const courses = (courseWishes || []).map(w => w.courses).filter(Boolean);
  const products = (productWishes || []).map(w => w.products).filter(Boolean);

  // Normalize single-object joins from Supabase
  const normalizedProducts = products.map((p: any) => ({
    ...p,
    product_categories: Array.isArray(p.product_categories) ? p.product_categories[0] : p.product_categories,
  }));
  const normalizedCourses = courses.map((c: any) => ({
    ...c,
    categories: Array.isArray(c.categories) ? c.categories[0] : c.categories,
  }));

  // Query cart items so we can pass inCart state to ProductCards
  const { data: cartItemsRaw } = await supabase
    .from('cart_items')
    .select('product_id, quantity')
    .eq('user_id', user.id);

  return (
    <WishlistPageClient 
      courses={normalizedCourses as any}
      products={normalizedProducts as any}
      enrolledCourseIds={Array.from(enrolledCourseIds)}
      cartItems={cartItemsRaw || []}
      userId={user.id}
      language={prefs?.language || 'en'}
    />
  );
}
