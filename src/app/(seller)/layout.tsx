import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SellerSidebar from '@/components/seller/SellerSidebar';
import SellerTopbar from '@/components/seller/SellerTopbar';
import SuspensionGuard from '@/components/auth/SuspensionGuard';

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status, full_name, avatar_url')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'seller') redirect('/student/dashboard');
  if (profile.status === 'pending' || profile.status === 'pending_approval') {
    redirect('/pending-approval?role=seller');
  }

  const { data: sellerProfile } = await supabase
    .from('seller_profiles')
    .select('store_name, store_logo_url')
    .eq('user_id', user.id)
    .single();

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <SuspensionGuard userId={user.id} />
      <SellerSidebar
        serverProfile={profile}
        storeName={sellerProfile?.store_name}
        storeLogo={sellerProfile?.store_logo_url}
      />
      <main className="flex flex-1 flex-col overflow-hidden">
        <SellerTopbar userId={user.id} />
        <div className="flex-1 overflow-y-auto bg-[#F5F5F7] p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
