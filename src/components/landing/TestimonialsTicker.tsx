'use client';

import Image from 'next/image';
import {useTranslations} from 'next-intl';
import {Star} from 'lucide-react';

type Review = {
  body: string;
  rating: number;
  full_name: string;
  avatar_url: string | null;
  course_title: string;
};

function Row({reviews, reverse = false}: {reviews: Review[]; reverse?: boolean}) {
  const repeated = [...reviews, ...reviews];
  return (
    <div className="relative overflow-hidden py-2">
      <div className={`flex w-max gap-4 ${reverse ? 'ticker-right' : 'ticker-left'}`}>
        {repeated.map((review, idx) => (
          <article
            key={`${review.full_name}-${idx}`}
            className="min-w-[300px] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
          >
            {/* Traffic light dots */}
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--traffic-red)]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--traffic-yellow)]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--traffic-green)]" />
            </div>

            <div className="mt-3 flex gap-1">
              {Array.from({length: 5}).map((_, i) => (
                <Star
                  key={i}
                  className="h-3 w-3"
                  fill={i < review.rating ? '#FEBC2E' : 'none'}
                  color="#FEBC2E"
                />
              ))}
            </div>
            <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-[var(--text-secondary)]">{review.body}</p>
            <div className="mt-4 flex items-center gap-2">
              {review.avatar_url ? (
                <Image
                  src={review.avatar_url}
                  alt={review.full_name}
                  width={28}
                  height={28}
                  loading="lazy"
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface-raised)] text-xs text-[var(--text-secondary)]">
                  {review.full_name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-[13px] font-medium text-[var(--text)]">{review.full_name}</p>
                <p className="text-[11px] text-[var(--text-muted)]">{review.course_title}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default function TestimonialsTicker({reviews}: {reviews: Review[]}) {
  const t = useTranslations('landing.testimonials');
  const mid = Math.ceil(reviews.length / 2);

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <h2 className="mb-12 text-center text-[30px] font-bold text-[var(--text)]">{t('title')}</h2>
      </div>
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-[#0A0A0A] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-[#0A0A0A] to-transparent" />
        <Row reviews={reviews.slice(0, mid)} />
        <Row reviews={reviews.slice(mid)} reverse />
      </div>
    </section>
  );
}
