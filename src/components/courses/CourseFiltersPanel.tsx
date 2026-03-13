'use client';

import { useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

import { SlidersHorizontal, CheckCircle2 } from 'lucide-react';
import { useState, useCallback } from 'react';

export interface CatalogCategory {
  id: string;
  name: string;
  name_ta?: string | null;
  slug: string;
  color?: string | null;
}

interface CourseFiltersPanelProps {
  categories: CatalogCategory[];
  isStudentView?: boolean;
  currentFilters: {
    category?: string;
    difficulty?: string;
    language?: string;
    price?: 'free' | 'paid' | 'all';
    min_price?: number;
    max_price?: number;
    rating?: number;
  };
}

export default function CourseFiltersPanel({ categories, currentFilters, isStudentView = false }: CourseFiltersPanelProps) {
  const router = useRouter();

  // Local state for deferred inputs like Price
  const [minPrice, setMinPrice] = useState(currentFilters.min_price?.toString() || '');
  const [maxPrice, setMaxPrice] = useState(currentFilters.max_price?.toString() || '');

  // Helper to update a single search param while preserving others
  const updateParam = useCallback((key: string, value: string | null) => {
    const url = new URL(window.location.href);
    if (value === null || value === 'all' || value === '') {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
    // Always reset to page 1 on filter
    url.searchParams.delete('page');
    router.push(url.pathname + url.search);
  }, [router]);

  const toggleMultiParam = useCallback((key: string, value: string) => {
    const url = new URL(window.location.href);
    const existingStr = url.searchParams.get(key) || '';
    let items = existingStr ? existingStr.split(',') : [];

    if (items.includes(value)) {
      items = items.filter(i => i !== value);
    } else {
      items.push(value);
    }

    if (items.length > 0) {
      url.searchParams.set(key, items.join(','));
    } else {
      url.searchParams.delete(key);
    }
    
    url.searchParams.delete('page');
    router.push(url.pathname + url.search);
  }, [router]);

  const clearFilters = useCallback(() => {
    router.push(isStudentView ? '/student/courses/browse' : '/courses');
  }, [router, isStudentView]);

  const currentDiffs = (currentFilters.difficulty || '').split(',');
  const currentLangs = (currentFilters.language || '').split(',');

  const t = isStudentView ? {
    bgSurface: 'bg-white',
    bgSecondary: 'bg-gray-50',
    bgInput: 'bg-white',
    textMain: 'text-gray-900',
    textSec: 'text-gray-500',
    textMuted: 'text-gray-400',
    borderLight: 'border-gray-100',
    borderMain: 'border-gray-200',
    borderHover: 'hover:border-gray-300',
    borderActive: 'border-gray-900',
    bgActive: 'bg-gray-900',
    textActive: 'text-white',
    checkText: 'text-white',
    shadow: 'shadow-sm',
    ring: 'focus:border-gray-300',
    sheetTheme: 'bg-white border-gray-200'
  } : {
    bgSurface: 'bg-[#111111]',
    bgSecondary: 'bg-[#1C1C1E]',
    bgInput: 'bg-[#1C1C1E]',
    textMain: 'text-white',
    textSec: 'text-[#8E8E93]',
    textMuted: 'text-[#48484A]',
    borderLight: 'border-[rgba(255,255,255,0.06)]',
    borderMain: 'border-[rgba(255,255,255,0.12)]',
    borderHover: 'hover:border-[rgba(255,255,255,0.2)]',
    borderActive: 'border-white',
    bgActive: 'bg-white',
    textActive: 'text-[#0A0A0A]',
    checkText: 'text-[#0A0A0A]',
    shadow: 'shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
    ring: 'focus:border-[rgba(255,255,255,0.2)]',
    sheetTheme: 'bg-[#111111] border-[rgba(255,255,255,0.1)]'
  };

  const FilterContent = () => (
    <div className="flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className={`font-sans font-semibold text-[14px] ${t.textMain}`}>Filters</h2>
        <button 
          onClick={clearFilters}
          className={`text-[12px] ${t.textSec} hover:${t.textMain} transition-colors`}
        >
          Clear all
        </button>
      </div>

      {/* Category Section */}
      <div className={`mt-4 pt-4 border-t ${t.borderLight}`}>
        <h3 className={`text-[11px] uppercase tracking-wider ${t.textMuted} font-semibold mb-3`}>Category</h3>
        <div className="flex flex-col gap-1.5">
          <label className="group flex items-center justify-between py-1 cursor-pointer">
            <div className="flex items-center gap-2">
              <div className={`flex h-4 w-4 items-center justify-center rounded-full border ${!currentFilters.category ? t.borderActive : t.borderMain}`}>
                {!currentFilters.category && <div className={`h-2 w-2 rounded-full ${t.bgActive}`} />}
              </div>
              <span className={`text-[13px] ${!currentFilters.category ? `${t.textMain} font-medium` : `${t.textSec} group-hover:${t.textMain}`}`}>All Categories</span>
            </div>
            <input type="radio" className="hidden" onChange={() => updateParam('category', null)} checked={!currentFilters.category} />
          </label>

          {categories.map((cat) => {
            const isSelected = currentFilters.category === cat.slug;
            return (
              <label key={cat.id} className="group flex items-center justify-between py-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className={`flex h-4 w-4 items-center justify-center rounded-full border ${isSelected ? t.borderActive : t.borderMain}`}>
                    {isSelected && <div className={`h-2 w-2 rounded-full ${t.bgActive}`} />}
                  </div>
                  <span className={`text-[13px] ${isSelected ? `${t.textMain} font-medium` : `${t.textSec} group-hover:${t.textMain}`}`}>{cat.name}</span>
                </div>
                <input type="radio" className="hidden" onChange={() => updateParam('category', cat.slug)} checked={isSelected} />
              </label>
            )
          })}
        </div>
      </div>

      {/* Difficulty */}
      <div className={`mt-4 pt-4 border-t ${t.borderLight}`}>
        <h3 className={`text-[11px] uppercase tracking-wider ${t.textMuted} font-semibold mb-3`}>Difficulty</h3>
        <div className="flex flex-col gap-1.5">
          {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map(diff => {
            const isSelected = currentDiffs.includes(diff);
            return (
              <label key={diff} className="group flex items-center gap-2 py-1 cursor-pointer">
                 <div className={`flex h-4 w-4 items-center justify-center rounded border ${isSelected ? `${t.bgActive} ${t.borderActive}` : `${t.borderMain} bg-transparent`}`}>
                    {isSelected && <CheckCircle2 className={`h-3 w-3 ${t.checkText}`} />}
                  </div>
                <span className={`text-[13px] ${isSelected ? `${t.textMain} font-medium` : `${t.textSec} group-hover:${t.textMain}`}`}>{diff}</span>
                <input type="checkbox" className="hidden" checked={isSelected} onChange={() => toggleMultiParam('difficulty', diff)} />
              </label>
            );
          })}
        </div>
      </div>

      {/* Language */}
      <div className={`mt-4 pt-4 border-t ${t.borderLight}`}>
        <h3 className={`text-[11px] uppercase tracking-wider ${t.textMuted} font-semibold mb-3`}>Language</h3>
        <div className="flex flex-col gap-1.5">
          {[{label: 'English', value: 'en'}, {label: 'Tamil', value: 'ta'}].map(lang => {
            const isSelected = currentLangs.includes(lang.value);
            return (
              <label key={lang.value} className="group flex items-center gap-2 py-1 cursor-pointer">
                 <div className={`flex h-4 w-4 items-center justify-center rounded border ${isSelected ? 'bg-white border-white' : 'border-[rgba(255,255,255,0.12)] bg-transparent'}`}>
                    {isSelected && <CheckCircle2 className="h-3 w-3 text-[#0A0A0A]" />}
                  </div>
                <span className={`text-[13px] ${isSelected ? 'text-white' : 'text-[#8E8E93] group-hover:text-white'}`}>{lang.label}</span>
                <input type="checkbox" className="hidden" checked={isSelected} onChange={() => toggleMultiParam('language', lang.value)} />
              </label>
            );
          })}
        </div>
      </div>

      {/* Price Options */}
      <div className={`mt-4 pt-4 border-t ${t.borderLight}`}>
        <h3 className={`text-[11px] uppercase tracking-wider ${t.textMuted} font-semibold mb-3`}>Price</h3>
        <div className="flex flex-col gap-1.5">
          {[
            {label: 'All Prices', value: 'all'},
            {label: 'Free only', value: 'free'},
            {label: 'Paid only', value: 'paid'}
          ].map(opt => {
             const isSelected = (currentFilters.price || 'all') === opt.value;
             return (
              <label key={opt.value} className="group flex items-center gap-2 py-1 cursor-pointer">
                <div className={`flex h-4 w-4 items-center justify-center rounded-full border ${isSelected ? `${t.borderActive} bg-transparent` : t.borderMain}`}>
                  {isSelected && <div className={`h-2 w-2 rounded-full ${t.bgActive}`} />}
                </div>
                <span className={`text-[13px] ${isSelected ? `${t.textMain} font-medium` : `${t.textSec} group-hover:${t.textMain}`}`}>{opt.label}</span>
                <input type="radio" className="hidden" checked={isSelected} onChange={() => updateParam('price', opt.value)} />
              </label>
             );
          })}
        </div>
        
        {currentFilters.price === 'paid' && (
          <div className="flex items-center gap-2 mt-3 pl-6">
            <input 
              type="number" 
              placeholder="Min ₹" 
              className={`w-full ${t.bgInput} border ${t.borderLight} rounded-xl px-3 py-1.5 text-[13px] ${t.textMain} outline-none ${t.ring} transition-colors`}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              onBlur={() => updateParam('min_price', minPrice)}
            />
            <span className={t.textMuted}>-</span>
            <input 
              type="number" 
              placeholder="Max ₹" 
              className={`w-full ${t.bgInput} border ${t.borderLight} rounded-xl px-3 py-1.5 text-[13px] ${t.textMain} outline-none ${t.ring} transition-colors`}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              onBlur={() => updateParam('max_price', maxPrice)}
            />
          </div>
        )}
      </div>

      {/* Minimum Rating */}
      <div className={`mt-4 pt-4 border-t ${t.borderLight}`}>
        <h3 className={`text-[11px] uppercase tracking-wider ${t.textMuted} font-semibold mb-3`}>Minimum Rating</h3>
        <div className="flex flex-col gap-2">
          {[
            {val: 4, label: '4★ & up'},
            {val: 3, label: '3★ & up'},
            {val: 2, label: '2★ & up'},
            {val: 0, label: 'Any'}
          ].map(opt => {
            const isSelected = (currentFilters.rating || 0) === opt.val;
            return (
              <button 
                key={opt.val}
                onClick={() => updateParam('rating', opt.val === 0 ? null : opt.val.toString())}
                className={`w-full text-left px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors text-[13px] ${
                  isSelected 
                    ? `${t.bgActive} ${t.borderActive} ${t.textActive} font-medium` 
                    : `${t.borderLight} ${t.textSec} hover:${t.borderHover} hover:${t.textMain}`
                }`}
              >
                {opt.val > 0 && <span className={isSelected ? t.textActive : 'text-[#FEBC2E]'}>★</span>}
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden lg:block w-[240px] flex-shrink-0 sticky top-[68px]">
        <div className={`${t.bgSurface} rounded-2xl p-5 border ${t.borderMain} ${t.shadow} relative`}>
          {/* Traffic Lights */}
          <div className="absolute top-4 left-4 flex gap-1.5 items-center">
            <div className="h-[6px] w-[6px] rounded-full bg-[#FF5F57]" />
            <div className="h-[6px] w-[6px] rounded-full bg-[#FEBC2E]" />
            <div className="h-[6px] w-[6px] rounded-full bg-[#28C840]" />
          </div>
          <div className="mt-6">
            <FilterContent />
          </div>
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      <div className="block lg:hidden w-full mb-4">
        <Sheet>
          <SheetTrigger asChild>
            <button className={`flex items-center gap-2 border ${t.borderMain} rounded-xl px-4 py-2 text-[13px] font-medium ${t.textMain} hover:${t.bgSecondary} w-full justify-center lg:w-auto`}>
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className={`h-[85vh] ${t.sheetTheme} rounded-t-3xl p-6 overflow-y-auto w-full max-w-none`}>
            <FilterContent />
            {/* Sheet trigger explicitly manages state, the updateParam already routes. */}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
