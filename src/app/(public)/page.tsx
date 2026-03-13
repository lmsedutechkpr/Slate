import HeroSection from '@/components/landing/HeroSection';
import StatsBar from '@/components/landing/StatsBar';
import CategoriesRow from '@/components/landing/CategoriesRow';
import FeaturedCourses from '@/components/landing/FeaturedCourses';
import LiveBanner from '@/components/landing/LiveBanner';
import ProductShowcase from '@/components/landing/ProductShowcase';
import HowItWorks from '@/components/landing/HowItWorks';
import Testimonials from '@/components/landing/Testimonials';
import SplitCTA from '@/components/landing/SplitCTA';
import {createClient} from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  let studentCount = 0;
  let avatars: {id: string; full_name: string | null; avatar_url: string | null}[] = [];

  try {
    const supabase = await createClient();

    const [countResult, avatarsResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('*', {count: 'exact', head: true})
        .eq('role', 'student')
        .eq('status', 'active'),
      supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('role', 'student')
        .eq('status', 'active')
        .not('avatar_url', 'is', null)
        .order('created_at', {ascending: false})
        .limit(5)
    ]);

    studentCount = countResult.count ?? 0;
    avatars = avatarsResult.data ?? [];
  } catch (error) {
    console.error('Landing hero data error', error);
  }

  return (
    <>
      <LiveBanner />
      <HeroSection studentCount={studentCount} avatars={avatars} />
      <StatsBar />
      <CategoriesRow />
      <FeaturedCourses />
      <ProductShowcase />
      <HowItWorks />
      <Testimonials />
      <SplitCTA />
    </>
  );
}
