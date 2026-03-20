'use client';

import { useMemo, useState } from 'react';
import { Clock3, Search, TrendingUp, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SearchFiltersPanel from '@/components/shared/search/SearchFiltersPanel';
import SearchResultCard from '@/components/shared/search/SearchResultCard';
import SearchEmptyState from '@/components/shared/search/SearchEmptyState';
import TrafficLights from '@/components/auth/TrafficLights';

const POPULAR = [
  'Next.js',
  'React',
  'Python',
  'Figma',
  'TypeScript',
  'Data Science',
  'Tamil Web Dev',
  'Business Strategy',
  'Mechanical Keyboard',
  'Headphones',
];

const CATEGORIES = [
  { slug: 'web-development', name: 'Web Development', count: 214, icon: '</>' },
  { slug: 'design', name: 'Design', count: 128, icon: '✦' },
  { slug: 'data-science', name: 'Data Science', count: 89, icon: '∑' },
  { slug: 'business', name: 'Business', count: 74, icon: '◉' },
];

export default function SearchPageClient({
  query,
  courses,
  products,
  instructors,
  recentSearches,
}: {
  query: string;
  courses: any[];
  products: any[];
  instructors: any[];
  recentSearches: string[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'courses' | 'products' | 'instructors'>('all');
  const [input, setInput] = useState(query || '');
  const [filters, setFilters] = useState<Record<string, string>>({});

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      if (filters.category && filters.category !== 'all') {
        const slug = c.categories?.slug || '';
        if (slug !== filters.category) return false;
      }
      if (filters.difficulty && filters.difficulty !== 'all' && String(c.difficulty || '').toLowerCase() !== filters.difficulty) return false;
      if (filters.language && filters.language !== 'all' && String(c.language || '') !== filters.language) return false;
      if (filters.price === 'free' && !c.is_free) return false;
      if (filters.price === 'paid' && c.is_free) return false;
      if (filters.rating && filters.rating !== 'all' && Number(c.avg_rating || 0) < Number(filters.rating)) return false;
      return true;
    });
  }, [courses, filters]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (filters.pCategory && filters.pCategory !== 'all') {
        const slug = p.product_categories?.slug || '';
        if (slug !== filters.pCategory) return false;
      }
      if (filters.pPrice && filters.pPrice !== 'all') {
        const price = Number(p.discounted_price || p.price || 0);
        if (filters.pPrice === '0-500' && price > 500) return false;
        if (filters.pPrice === '500-1500' && (price < 500 || price > 1500)) return false;
        if (filters.pPrice === '1500+' && price < 1500) return false;
      }
      return true;
    });
  }, [products, filters]);

  const filteredInstructors = useMemo(() => {
    return instructors.filter((i) => {
      if (filters.expertise && filters.expertise !== 'all') {
        const tags = Array.isArray(i.expertise_tags) ? i.expertise_tags.map((x: string) => x.toLowerCase()) : [];
        if (!tags.some((t: string) => t.includes(filters.expertise!))) return false;
      }
      return true;
    });
  }, [instructors, filters]);

  const total = filteredCourses.length + filteredProducts.length + filteredInstructors.length;

  const runSearch = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      router.push('/search');
      return;
    }
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const showSearchHome = !query.trim();

  return (
    <div className="min-h-screen bg-white pt-14">
      <section className="bg-[#F5F5F7] px-8 py-12">
        <div className="mx-auto max-w-2xl">
          <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
            <div className="flex h-9 items-center bg-[#F5F5F7] px-5">
              <TrafficLights size="sm" />
              <span className="mx-auto font-mono text-[11px] text-[#AEAEB2]">slate.dev/search</span>
            </div>
            <div className="flex items-center gap-3 p-3">
              <Search className="h-[18px] w-[18px] text-[#AEAEB2]" />
              <input
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') runSearch(input);
                }}
                placeholder="Search courses, products, instructors..."
                className="flex-1 border-none bg-transparent text-[16px] text-[#1D1D1F] outline-none"
              />
              {input ? (
                <button type="button" onClick={() => { setInput(''); runSearch(''); }} className="border-l border-[rgba(0,0,0,0.08)] pl-3 text-[#AEAEB2]">
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
          {query ? <p className="mt-4 text-center text-[13px] text-[#6E6E73]">{total} results for "{query}"</p> : null}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-8 py-8">
        {showSearchHome ? (
          <div>
            {recentSearches.length ? (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[14px] font-semibold text-[#1D1D1F]">Recent</p>
                  <button type="button" className="text-[12px] text-[#AEAEB2]">Clear history</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <button key={term} onClick={() => runSearch(term)} className="rounded-full bg-[#F5F5F7] px-4 py-2 text-[13px] text-[#6E6E73]">
                      <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3 w-3" /> {term}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-6">
              <p className="mb-3 text-[14px] font-semibold text-[#1D1D1F]">Popular right now</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR.map((term) => (
                  <button key={term} onClick={() => runSearch(term)} className="rounded-full bg-[#F5F5F7] px-4 py-2 text-[13px] text-[#6E6E73]">
                    <span className="inline-flex items-center gap-1.5"><TrendingUp className="h-3 w-3" /> {term}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <p className="mb-3 text-[14px] font-semibold text-[#1D1D1F]">Browse by Category</p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => runSearch(cat.slug)}
                    className="overflow-hidden rounded-xl border border-[rgba(0,0,0,0.08)] bg-white text-left transition-all hover:-translate-y-1"
                  >
                    <div className="flex h-7 items-center bg-[#F5F5F7] px-3"><TrafficLights size="xs" /></div>
                    <div className="px-3 pb-3 pt-3">
                      <p className="text-[20px] text-[#1D1D1F]">{cat.icon}</p>
                      <p className="mt-2 text-[13px] font-semibold text-[#1D1D1F]">{cat.name}</p>
                      <p className="text-[11px] text-[#AEAEB2]">{cat.count} courses</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : total === 0 ? (
          <SearchEmptyState query={query} onPick={runSearch} />
        ) : (
          <>
            <div className="mb-6 flex flex-wrap gap-2">
              {[
                { key: 'all', label: `All (${total})` },
                { key: 'courses', label: `Courses (${filteredCourses.length})` },
                { key: 'products', label: `Products (${filteredProducts.length})` },
                { key: 'instructors', label: `Instructors (${filteredInstructors.length})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`rounded-full px-4 py-2 text-[13px] font-medium ${
                    activeTab === tab.key ? 'bg-[#1D1D1F] text-white' : 'bg-[#F5F5F7] text-[#6E6E73]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <SearchFiltersPanel activeTab={activeTab} filters={filters} setFilters={setFilters} />

            {activeTab === 'all' ? (
              <div className="space-y-8">
                {filteredCourses.length ? (
                  <div>
                    <h3 className="mb-4 text-[16px] font-bold text-[#1D1D1F]">Courses</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredCourses.map((item) => <SearchResultCard key={item.id} item={item} type="course" query={query} />)}
                    </div>
                  </div>
                ) : null}
                {filteredProducts.length ? (
                  <div>
                    <h3 className="mb-4 text-[16px] font-bold text-[#1D1D1F]">Products</h3>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                      {filteredProducts.map((item) => <SearchResultCard key={item.id} item={item} type="product" query={query} />)}
                    </div>
                  </div>
                ) : null}
                {filteredInstructors.length ? (
                  <div>
                    <h3 className="mb-4 text-[16px] font-bold text-[#1D1D1F]">Instructors</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {filteredInstructors.map((item) => <SearchResultCard key={item.user_id} item={item} type="instructor" query={query} />)}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeTab === 'courses' ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredCourses.map((item) => <SearchResultCard key={item.id} item={item} type="course" query={query} />)}
              </div>
            ) : null}

            {activeTab === 'products' ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {filteredProducts.map((item) => <SearchResultCard key={item.id} item={item} type="product" query={query} />)}
              </div>
            ) : null}

            {activeTab === 'instructors' ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredInstructors.map((item) => <SearchResultCard key={item.user_id} item={item} type="instructor" query={query} />)}
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
