import {getTranslations} from 'next-intl/server';
import {createClient} from '@/lib/supabase/server';
import TestimonialsTicker from '@/components/landing/TestimonialsTicker';

type ReviewRow = {
  body: string;
  rating: number;
  profiles: Array<{full_name: string | null; avatar_url: string | null}> | null;
  courses: Array<{title: string | null}> | null;
};

export default async function Testimonials() {
  const t = await getTranslations('landing.testimonials');

  try {
    const supabase = await createClient();
    const {data, error} = await supabase
      .from('reviews')
      .select('body, rating, created_at, helpful_count, profiles!reviews_reviewer_id_fkey(full_name, avatar_url), courses(title)')
      .eq('target_type', 'course')
      .gte('rating', 4)
      .eq('is_approved', true)
      .order('helpful_count', {ascending: false})
      .limit(12);

    if (error) throw error;

    const reviews =
      (data as unknown as ReviewRow[] | null)?.map((item) => ({
        body: item.body,
        rating: item.rating,
        full_name: item.profiles?.[0]?.full_name ?? t('student'),
        avatar_url: item.profiles?.[0]?.avatar_url ?? null,
        course_title: t('inCourse', {course: item.courses?.[0]?.title ?? t('course')})
      })) ?? [];

    if (reviews.length < 4) return null;

    return <TestimonialsTicker reviews={reviews} />;
  } catch (error) {
    console.error('Testimonials error', error);
    return null;
  }
}

