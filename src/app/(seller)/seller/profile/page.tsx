import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import ProfilePageClient from '@/components/seller/profile/ProfilePageClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'My Profile – Slate Seller',
  description: 'Manage your seller profile, store info and account settings.',
};

function adminDb() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function SellerProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const db = adminDb();

  const [profileRes, sellerRes, productsRes] = await Promise.all([
    db.from('profiles').select('*').eq('id', user.id).single(),
    db.from('seller_profiles').select('*').eq('user_id', user.id).single(),
    db.from('products').select('id', { count: 'exact' }).eq('seller_id', user.id).eq('status', 'active'),
  ]);

  // FIX #1: Add error handling for profile fetch
  const profile = profileRes.data;
  if (profileRes.error || !profile) {
    console.error('Profile fetch error:', profileRes.error);
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Failed to load profile</p>
          <p className="text-gray-500 text-sm mt-2">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  // FIX #1: Handle missing seller_profile gracefully (new sellers)
  const sellerProfile = sellerRes.data ?? null;

  const stats = {
    totalProducts: productsRes.count ?? 0,
    totalSales: sellerProfile?.total_sales ?? 0,
    avgRating: sellerProfile?.avg_rating ?? 0,
    totalRevenue: sellerProfile?.total_revenue ?? 0,
  };

  return (
    <ProfilePageClient
      profile={profile}
      sellerProfile={sellerProfile}
      stats={stats}
      userEmail={user.email ?? ''}
      userId={user.id}
    />
  );
}
