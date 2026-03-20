'use client';

import Link from 'next/link';
import { BookOpen, Star, Users, Package, Search } from 'lucide-react';
import TrafficLights from '@/components/auth/TrafficLights';

function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function highlightText(text: string, query: string) {
  if (!query.trim()) return escapeHtml(text);
  const safe = escapeHtml(text);
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'ig');
  return safe.replace(regex, '<strong>$1</strong>');
}

export default function SearchResultCard({
  item,
  type,
  query,
}: {
  item: any;
  type: 'course' | 'product' | 'instructor';
  query: string;
}) {
  if (type === 'course') {
    const title = item.title_ta || item.title || 'Course';
    const categoryName = item.categories?.name || 'Category';
    const instructor = item.course_instructors?.[0]?.profiles?.full_name || 'Instructor';
    const href = `/student/courses/browse/${item.id}`;

    return (
      <Link href={href} className="block overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-1">
        <div className="flex h-8 items-center bg-[#F5F5F7] px-4">
          <TrafficLights size="xs" />
        </div>
        <div className="p-4">
          <p className="mb-1 text-[11px] text-[#AEAEB2]">{categoryName}</p>
          <h3 className="line-clamp-2 text-[15px] font-bold text-[#1D1D1F]" dangerouslySetInnerHTML={{ __html: highlightText(title, query) }} />
          <p className="mt-1 text-[12px] text-[#6E6E73]">by {instructor}</p>
          <div className="mt-3 flex items-center gap-3 text-[12px] text-[#6E6E73]">
            <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 text-[#FEBC2E]" /> {(item.avg_rating || 0).toFixed?.(1) || '0.0'}</span>
            <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {(item.total_enrolled || 0).toLocaleString('en-IN')}</span>
            <span className="font-semibold text-[#1D1D1F]">{item.is_free ? 'Free' : `₹${Math.round(item.discounted_price || item.price || 0).toLocaleString('en-IN')}`}</span>
          </div>
        </div>
      </Link>
    );
  }

  if (type === 'product') {
    const title = item.name_ta || item.name || 'Product';
    const img = item.images?.[0] || null;
    const href = `/student/shop/${item.id}`;
    return (
      <Link href={href} className="block overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-1">
        <div className="flex h-8 items-center bg-[#F5F5F7] px-4">
          <TrafficLights size="xs" />
        </div>
        <div className="p-4">
          <div className="mb-3 aspect-square overflow-hidden rounded-xl bg-[#F5F5F7]">
            {img ? <img src={img} alt={title} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center"><Package className="h-6 w-6 text-[#AEAEB2]" /></div>}
          </div>
          <h3 className="line-clamp-2 text-[14px] font-bold text-[#1D1D1F]" dangerouslySetInnerHTML={{ __html: highlightText(title, query) }} />
          <p className="mt-2 text-[13px] font-semibold text-[#1D1D1F]">₹{Math.round(item.discounted_price || item.price || 0).toLocaleString('en-IN')}</p>
        </div>
      </Link>
    );
  }

  const profile = item.profiles || {};
  const tags: string[] = Array.isArray(item.expertise_tags) ? item.expertise_tags.slice(0, 4) : [];
  const href = `/instructor/${profile.id || item.user_id}`;

  return (
    <Link href={href} className="block overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-1">
      <div className="flex h-8 items-center bg-[#F5F5F7] px-4">
        <TrafficLights size="xs" />
      </div>
      <div className="flex gap-4 p-4">
        <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-[rgba(0,0,0,0.08)] bg-[#F5F5F7]">
          {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.full_name || 'Instructor'} className="h-full w-full object-cover" /> : null}
        </div>
        <div className="flex-1">
          <h3 className="text-[16px] font-bold text-[#1D1D1F]" dangerouslySetInnerHTML={{ __html: highlightText(profile.full_name || 'Instructor', query) }} />
          <p className="mt-0.5 line-clamp-1 text-[13px] text-[#6E6E73]">{item.headline || profile.bio || 'Instructor at Slate'}</p>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-[12px] text-[#6E6E73]">
            <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 text-[#FEBC2E]" /> {(item.avg_rating || 0).toFixed?.(1) || '0.0'}</span>
            <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {(item.total_students || 0).toLocaleString('en-IN')}</span>
            <span className="inline-flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {item.total_courses || 0}</span>
          </div>
          {tags.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span key={tag} className="rounded-full bg-[#F5F5F7] px-2.5 py-1 text-[10px] text-[#6E6E73]">{tag}</span>
              ))}
            </div>
          ) : null}
          <p className="mt-3 text-[12px] font-semibold text-[#1D1D1F]">View Profile -&gt;</p>
        </div>
      </div>
    </Link>
  );
}
