import { createAdminClient, createClient } from '@/lib/supabase/server';
import PublicNavbar from '@/components/shared/PublicNavbar';
import PublicFooter from '@/components/shared/PublicFooter';
import SearchPageClient from '@/components/shared/search/SearchPageClient';

export const dynamic = 'force-dynamic';

type Row = Record<string, any>;

function sanitizeQuery(value: string) {
  return value.replace(/[{}]/g, '').trim();
}

export default async function PublicSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = sanitizeQuery(String(params.q || ''));

  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const recentSearchesPromise = user
    ? admin
        .from('search_history')
        .select('query,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(8)
    : Promise.resolve({ data: [] as Row[], error: null as any });

  if (!query) {
    const recentSearchesRes = await recentSearchesPromise;
    return (
      <>
        <PublicNavbar />
        <SearchPageClient
          query=""
          courses={[]}
          products={[]}
          instructors={[]}
          recentSearches={(recentSearchesRes.data || []).map((r: any) => r.query).filter(Boolean)}
        />
        <PublicFooter />
      </>
    );
  }

  const queryLike = `%${query}%`;

  const [coursesRes, productsRes, instructorsRes, recentSearchesRes] = await Promise.all([
    admin
      .from('courses')
      .select(
        `
        id, title, title_ta, slug,
        subtitle, thumbnail_url,
        difficulty, language, price,
        discounted_price, is_free,
        avg_rating, total_reviews,
        total_enrolled, total_duration_mins,
        categories ( name, slug ),
        course_instructors (
          profiles!instructor_id (
            full_name, avatar_url
          )
        )
      `,
      )
      .eq('status', 'approved')
      .or(`title.ilike.${queryLike},description.ilike.${queryLike}`)
      .limit(20),
    admin
      .from('products')
      .select(
        `
        id, name, name_ta, slug,
        images, price, discounted_price,
        avg_rating, total_reviews,
        stock_qty, total_sold,
        product_categories ( name, slug ),
        seller_profiles!seller_id (
          store_name, store_slug
        )
      `,
      )
      .eq('status', 'active')
      .or(`name.ilike.${queryLike},description.ilike.${queryLike}`)
      .limit(20),
    admin
      .from('instructor_profiles')
      .select(
        `
        user_id, headline,
        total_students, total_courses,
        avg_rating, expertise_tags,
        profiles!user_id (
          id, full_name, avatar_url, bio
        )
      `,
      )
      .or(`headline.ilike.${queryLike}`)
      .limit(10),
    recentSearchesPromise,
  ]);

  const courses = (coursesRes.data || []) as Row[];
  const products = (productsRes.data || []) as Row[];

  let instructors = (instructorsRes.data || []) as Row[];
  if (!instructors.length) {
    const { data: fallbackProfiles } = await admin
      .from('profiles')
      .select('id,full_name,avatar_url,bio')
      .ilike('full_name', queryLike)
      .limit(10);

    if (fallbackProfiles?.length) {
      const ids = fallbackProfiles.map((p: any) => p.id);
      const { data: fallbackInstructorRows } = await admin
        .from('instructor_profiles')
        .select('user_id,headline,total_students,total_courses,avg_rating,expertise_tags')
        .in('user_id', ids);

      const map = new Map<string, any>();
      (fallbackProfiles || []).forEach((p: any) => map.set(String(p.id), p));
      instructors = (fallbackInstructorRows || []).map((row: any) => ({
        ...row,
        profiles: map.get(String(row.user_id)) || null,
      }));
    }
  }

  if (user) {
    const resultsCount = courses.length + products.length + instructors.length;
    const { data: last } = await admin
      .from('search_history')
      .select('query')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (String(last?.query || '').trim().toLowerCase() !== query.toLowerCase()) {
      await admin.from('search_history').upsert(
        {
          user_id: user.id,
          query,
          results_count: resultsCount,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,query' },
      );
    }
  }

  return (
    <>
      <PublicNavbar />
      <SearchPageClient
        query={query}
        courses={courses}
        products={products}
        instructors={instructors}
        recentSearches={(recentSearchesRes.data || []).map((r: any) => r.query).filter(Boolean)}
      />
      <PublicFooter />
    </>
  );
}
