'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function CourseSortSelect({ defaultSort, isStudentView = false }: { defaultSort: string, isStudentView?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', newSort);
    params.set('page', '1'); // Reset to first page
    router.push(`${isStudentView ? '/student/courses/browse' : '/courses'}?${params.toString()}`);
  };

  return (
    <select 
      name="sort" 
      value={defaultSort}
      onChange={handleSortChange}
      className={isStudentView ? "bg-white border text-gray-900 border-gray-200 shadow-sm rounded-xl px-3 py-2 outline-none cursor-pointer" : "bg-[#111111] border border-[rgba(255,255,255,0.12)] text-[13px] text-white rounded-xl px-3 py-2 outline-none cursor-pointer"}
    >
      <option value="popular">Popularity</option>
      <option value="rating">Highest Rated</option>
      <option value="newest">Newest</option>
      <option value="price_low">Price: Low to High</option>
      <option value="price_high">Price: High to Low</option>
    </select>
  );
}
