'use client';

import { useMemo } from 'react';
import { Star, ThumbsUp } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  reviews: any[];
  avgRating: number;
}

export default function StoreReviews({ reviews, avgRating }: Props) {
  // Rating breakdown
  const breakdown = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]; // 1-5 stars
    for (const r of reviews) {
      const idx = Math.min(Math.max(Math.round(r.rating) - 1, 0), 4);
      counts[idx]++;
    }
    return counts.reverse(); // 5 to 1
  }, [reviews]);

  const totalReviews = reviews.length;

  return (
    <div id="store-reviews" className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
      {/* TITLEBAR */}
      <div className="flex h-11 items-center justify-between border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
            <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
            <div className="h-2 w-2 rounded-full bg-[#28C840]" />
          </div>
          <span className="ml-1 font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">Customer Reviews</span>
        </div>
        {totalReviews > 0 && (
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-[#FEBC2E] fill-[#FEBC2E]" />
            <span className="font-[DM_Sans] text-[14px] font-bold text-[#1D1D1F]">{avgRating.toFixed(1)}</span>
            <span className="text-[12px] text-[#AEAEB2]">({totalReviews} reviews)</span>
          </div>
        )}
      </div>

      <div className="p-5">
        {totalReviews === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <Star className="w-10 h-10 text-[#AEAEB2]" />
            <h3 className="font-[DM_Sans] text-[16px] font-bold text-[#1D1D1F] mt-4">No reviews yet</h3>
            <p className="text-[13px] text-[#6E6E73] mt-1">Reviews from customers will appear here</p>
          </div>
        ) : (
          <>
            {/* RATING BREAKDOWN */}
            <div className="mb-6 space-y-2">
              {breakdown.map((count, idx) => {
                const starNum = 5 - idx;
                const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <div key={starNum} className="flex items-center gap-3">
                    <span className="text-[12px] text-[#1D1D1F] w-8 text-right font-[DM_Sans]">{starNum}★</span>
                    <div className="flex-1 h-1.5 bg-[rgba(0,0,0,0.06)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#FEBC2E] rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-[#AEAEB2] w-6 font-[DM_Sans]">{count}</span>
                  </div>
                );
              })}
            </div>

            {/* REVIEWS LIST */}
            <div className="space-y-4">
              {reviews.map((review: any) => {
                const reviewer = Array.isArray(review.profiles) ? review.profiles[0] : review.profiles;
                return (
                  <div key={review.id} className="bg-[#F5F5F7] rounded-xl p-4">
                    {/* Traffic lights */}
                    <div className="flex items-center gap-1 mb-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#FF5F57]" />
                      <div className="h-1.5 w-1.5 rounded-full bg-[#FEBC2E]" />
                      <div className="h-1.5 w-1.5 rounded-full bg-[#28C840]" />
                    </div>

                    {/* TOP ROW */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-[rgba(0,0,0,0.06)] flex-shrink-0">
                        {reviewer?.avatar_url ? (
                          <img src={reviewer.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[11px] font-bold text-[#6E6E73]">
                            {(reviewer?.full_name || 'C')[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
                          {reviewer?.full_name || 'Customer'}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${i < review.rating ? 'text-[#FEBC2E] fill-[#FEBC2E]' : 'text-[#AEAEB2]'}`}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] text-[#AEAEB2]">
                            {format(new Date(review.created_at), 'dd MMM yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* BODY */}
                    {review.title && (
                      <p className="font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F] mt-3">{review.title}</p>
                    )}
                    <p className="text-[13px] text-[#1D1D1F] leading-relaxed mt-1">{review.body}</p>

                    {/* HELPFUL */}
                    {review.helpful_count > 0 && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <ThumbsUp className="w-[11px] h-[11px] text-[#AEAEB2]" />
                        <span className="text-[11px] text-[#AEAEB2]">{review.helpful_count} found helpful</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
