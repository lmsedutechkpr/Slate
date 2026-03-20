'use client';

import { Search } from 'lucide-react';
import TrafficLights from '@/components/auth/TrafficLights';

const SUGGESTIONS = ['React', 'Next.js', 'Python', 'Design', 'TypeScript', 'Figma', 'Headphones'];

export default function SearchEmptyState({
  query,
  onPick,
}: {
  query: string;
  onPick: (term: string) => void;
}) {
  return (
    <div className="py-20">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
        <div className="flex h-10 items-center bg-[#F5F5F7] px-5">
          <TrafficLights size="sm" />
        </div>
        <div className="px-8 pb-10 pt-8 text-center">
          <Search className="mx-auto h-12 w-12 text-[#AEAEB2]" />
          <h3 className="mt-5 text-[22px] font-bold text-[#1D1D1F]">No results for "{query}"</h3>
          <p className="mt-2 text-[14px] text-[#6E6E73]">Try different keywords or browse categories below</p>

          <div className="mt-8">
            <p className="mb-3 text-[12px] text-[#AEAEB2]">Did you mean:</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {SUGGESTIONS.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => onPick(term)}
                  className="rounded-full bg-[#F5F5F7] px-4 py-2 text-[13px] text-[#6E6E73]"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
