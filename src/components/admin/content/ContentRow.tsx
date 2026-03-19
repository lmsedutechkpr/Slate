'use client';

import Image from 'next/image';
import { Eye, Check, X, Ban, Square } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import type { CourseItem, ProductItem, ContentType } from './types';

type Props = {
  item: CourseItem | ProductItem;
  type: ContentType;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRevoke: () => void;
};

function currency(n?: number | null) {
  return `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
}

function statusBadge(statusRaw?: string | null) {
  const status = (statusRaw || 'draft').toLowerCase();
  if (status === 'pending') return 'bg-[#FFF8EC] text-[#FEBC2E]';
  if (status === 'approved' || status === 'active') return 'bg-[#EDFAF0] text-[#28C840]';
  if (status === 'rejected') return 'bg-[#FFF0EF] text-[#FF5F57]';
  return 'bg-[#F5F5F7] text-[#AEAEB2]';
}

function statusText(statusRaw?: string | null) {
  const status = (statusRaw || 'draft').toLowerCase();
  if (status === 'active') return 'approved';
  return status;
}

function firstInstructor(item: CourseItem) {
  const first = item.course_instructors?.[0];
  return {
    name: first?.profiles?.full_name || 'Instructor',
    avatar: first?.profiles?.avatar_url || null,
  };
}

function productSeller(item: ProductItem) {
  const fullName = item.seller_profiles?.profiles?.full_name || null;
  const store = item.seller_profiles?.store_name || null;
  return {
    name: store || fullName || 'Seller',
    avatar: item.seller_profiles?.profiles?.avatar_url || null,
  };
}

export default function ContentRow({
  item,
  type,
  checked = false,
  onCheckedChange,
  onView,
  onApprove,
  onReject,
  onRevoke,
}: Props) {
  const isCourse = type === 'course';
  const course = item as CourseItem;
  const product = item as ProductItem;
  const thumb = isCourse ? course.thumbnail_url : product.images?.[0];
  const creator = isCourse ? firstInstructor(course) : productSeller(product);
  const category = isCourse ? course.categories?.name : product.product_categories?.name;
  const status = statusText(item.status);

  return (
    <div
      className="grid min-w-[1080px] grid-cols-[40px_2.3fr_1.4fr_1fr_1fr_1fr_1fr_1fr] items-center gap-4 border-b border-[rgba(0,0,0,0.06)] px-5 py-4 transition-colors hover:bg-[#F5F5F7]"
      role="button"
      tabIndex={0}
      onClick={onView}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onView();
        }
      }}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={checked} onCheckedChange={(v) => onCheckedChange?.(Boolean(v))} />
      </div>

      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-[#F5F5F7]">
          {thumb ? (
            <Image src={thumb} alt={isCourse ? course.title : product.name} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#AEAEB2]">
              <Square className="h-4 w-4" />
            </div>
          )}
        </div>

        <div className="min-w-0">
          <p className="line-clamp-1 font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
            {isCourse ? course.title : product.name}
          </p>

          {isCourse ? (
            <div className="mt-0.5 flex gap-1.5">
              <span className="rounded-full bg-[#F5F5F7] px-2 py-0.5 text-[10px] text-[#6E6E73]">
                {course.language?.toLowerCase() === 'ta' ? 'தமிழ்' : course.language?.toUpperCase() || 'EN'}
              </span>
              <span className="rounded-full bg-[#F5F5F7] px-2 py-0.5 text-[10px] text-[#6E6E73]">
                {course.difficulty || 'General'}
              </span>
            </div>
          ) : (
            <p className="mt-0.5 text-[10px] text-[#AEAEB2]">{product.product_categories?.name || 'Uncategorized'}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative h-6 w-6 overflow-hidden rounded-full bg-[#F5F5F7]">
          {creator.avatar ? <Image src={creator.avatar} alt={creator.name} fill className="object-cover" /> : null}
        </div>
        <p className="line-clamp-1 text-[12px] text-[#6E6E73]">{creator.name}</p>
      </div>

      <p className="line-clamp-1 text-[12px] text-[#6E6E73]">{category || 'General'}</p>

      <div>
        {(isCourse ? course.is_free : false) ? (
          <span className="font-[DM_Sans] text-[12px] font-semibold text-[#28C840]">Free</span>
        ) : item.discounted_price ? (
          <div className="flex items-center">
            <span className="font-[DM_Sans] text-[12px] font-semibold text-[#1D1D1F]">{currency(item.discounted_price)}</span>
            <span className="ml-1 text-[10px] text-[#AEAEB2] line-through">{currency(item.price)}</span>
          </div>
        ) : (
          <span className="font-[DM_Sans] text-[12px] font-semibold text-[#1D1D1F]">{currency(item.price)}</span>
        )}
      </div>

      <div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${statusBadge(item.status)}`}>
          {status}
        </span>
      </div>

      <p className="text-[12px] text-[#6E6E73]">
        {isCourse ? `${course.total_enrolled || 0} enrolled` : `${product.total_sold || 0} sold`}
      </p>

      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onView}
          className="rounded-lg bg-[#F5F5F7] p-2 text-[#6E6E73] hover:text-[#1D1D1F]"
          title="View"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>

        {status === 'pending' ? (
          <>
            <button
              type="button"
              onClick={onApprove}
              className="rounded-lg bg-[#EDFAF0] p-2 text-[#28C840]"
              title="Approve"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onReject}
              className="rounded-lg bg-[#FFF0EF] p-2 text-[#FF5F57]"
              title="Reject"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : status === 'approved' ? (
          <button
            type="button"
            onClick={onRevoke}
            className="rounded-lg bg-[#FFF8EC] p-2 text-[#FEBC2E]"
            title="Revoke"
          >
            <Ban className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
