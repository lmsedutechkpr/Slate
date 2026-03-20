'use client';

export default function SearchFiltersPanel({
  activeTab,
  filters,
  setFilters,
}: {
  activeTab: 'all' | 'courses' | 'products' | 'instructors';
  filters: Record<string, string>;
  setFilters: (next: Record<string, string>) => void;
}) {
  const setOne = (key: string, value: string) => setFilters({ ...filters, [key]: value });

  return (
    <div className="mb-6 flex flex-wrap gap-3">
      {(activeTab === 'all' || activeTab === 'courses') && (
        <>
          <select value={filters.category || 'all'} onChange={(e) => setOne('category', e.target.value)} className="h-10 rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-3 text-[13px] text-[#1D1D1F]">
            <option value="all">Category</option>
            <option value="development">Development</option>
            <option value="design">Design</option>
            <option value="data-science">Data Science</option>
          </select>
          <select value={filters.difficulty || 'all'} onChange={(e) => setOne('difficulty', e.target.value)} className="h-10 rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-3 text-[13px] text-[#1D1D1F]">
            <option value="all">Difficulty</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <select value={filters.language || 'all'} onChange={(e) => setOne('language', e.target.value)} className="h-10 rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-3 text-[13px] text-[#1D1D1F]">
            <option value="all">Language</option>
            <option value="en">English</option>
            <option value="ta">Tamil</option>
          </select>
          <select value={filters.price || 'all'} onChange={(e) => setOne('price', e.target.value)} className="h-10 rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-3 text-[13px] text-[#1D1D1F]">
            <option value="all">Price</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>
          <select value={filters.rating || 'all'} onChange={(e) => setOne('rating', e.target.value)} className="h-10 rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-3 text-[13px] text-[#1D1D1F]">
            <option value="all">Rating</option>
            <option value="4">4.0+</option>
            <option value="4.5">4.5+</option>
          </select>
        </>
      )}

      {activeTab === 'products' && (
        <>
          <select value={filters.pCategory || 'all'} onChange={(e) => setOne('pCategory', e.target.value)} className="h-10 rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-3 text-[13px] text-[#1D1D1F]">
            <option value="all">Category</option>
            <option value="audio">Audio</option>
            <option value="input">Input</option>
            <option value="power">Power</option>
          </select>
          <select value={filters.pPrice || 'all'} onChange={(e) => setOne('pPrice', e.target.value)} className="h-10 rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-3 text-[13px] text-[#1D1D1F]">
            <option value="all">Price Range</option>
            <option value="0-500">Under 500</option>
            <option value="500-1500">500 - 1500</option>
            <option value="1500+">1500+</option>
          </select>
        </>
      )}

      {activeTab === 'instructors' && (
        <>
          <select value={filters.expertise || 'all'} onChange={(e) => setOne('expertise', e.target.value)} className="h-10 rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-3 text-[13px] text-[#1D1D1F]">
            <option value="all">Expertise</option>
            <option value="frontend">Frontend</option>
            <option value="backend">Backend</option>
            <option value="data">Data</option>
          </select>
          <select value={filters.iLanguage || 'all'} onChange={(e) => setOne('iLanguage', e.target.value)} className="h-10 rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-3 text-[13px] text-[#1D1D1F]">
            <option value="all">Language</option>
            <option value="en">English</option>
            <option value="ta">Tamil</option>
          </select>
        </>
      )}
    </div>
  );
}
