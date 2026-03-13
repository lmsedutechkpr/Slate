'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Star, ThumbsUp, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { submitReviewAction } from '@/app/actions/reviews';

export interface Review {
  id: string;
  rating: number;
  title: string;
  body: string;
  helpful_count: number;
  created_at: string;
  is_verified: boolean;
  reviewer_id?: string;
  full_name: string;
  avatar_url?: string | null;
}

export interface ReviewsProps {
  courseId: string;
  enrollmentId: string | null;
  avgRating: number;
  totalReviews: number;
  ratingBreakdown: { rating: number; count: number }[];
  initialReviews: Review[];
  existingReview: Review | null;
  userId: string | null;
  isEnrolled: boolean;
  isStudentView?: boolean;
}

const reviewSchema = z.object({
  title: z.string().min(3).max(100),
  body: z.string().min(10).max(500),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

export default function CourseReviews({
  courseId,
  enrollmentId,
  avgRating,
  totalReviews,
  ratingBreakdown,
  initialReviews,
  existingReview,
  userId,
  isEnrolled,
  isStudentView = false
}: ReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [myReview, setMyReview] = useState<Review | null>(existingReview);
  
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRating, setSelectedRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const supabase = createClient();

  const t = isStudentView ? {
    bgCard: 'bg-white',
    borderCard: 'border-gray-200 shadow-sm',
    bgInput: 'bg-white',
    borderInput: 'border-gray-200 focus:border-gray-300',
    bgAvatarFrame: 'bg-gray-100',
    avatarEmptyColor: 'text-gray-400',
    textMain: 'text-gray-900',
    textSec: 'text-gray-500',
    textMuted: 'text-gray-400',
    starEmpty: 'text-gray-300',
    btnPrimaryBg: 'bg-gray-900 hover:bg-gray-800',
    btnPrimaryText: 'text-white',
    verifiedBg: 'bg-green-50',
    verifiedText: 'text-green-600',
    linkHover: 'hover:text-gray-900',
  } : {
    bgCard: 'bg-[#111111]',
    borderCard: 'border-[rgba(255,255,255,0.08)]',
    bgInput: 'bg-[#1C1C1E]',
    borderInput: 'border-[rgba(255,255,255,0.08)] focus:border-[rgba(255,255,255,0.2)]',
    bgAvatarFrame: 'bg-[#1C1C1E]',
    avatarEmptyColor: 'text-white',
    textMain: 'text-white',
    textSec: 'text-[#8E8E93]',
    textMuted: 'text-[#48484A]',
    starEmpty: 'text-[#48484A]',
    btnPrimaryBg: 'bg-white hover:bg-[rgba(255,255,255,0.9)]',
    btnPrimaryText: 'text-[#0A0A0A]',
    verifiedBg: 'bg-[rgba(40,200,64,0.08)]',
    verifiedText: 'text-[#28C840]',
    linkHover: 'hover:text-white',
  };

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      title: existingReview?.title || '',
      body: existingReview?.body || ''
    }
  });

  const bodyLength = watch('body')?.length || 0;

  const handleHelpful = async (reviewId: string) => {
    if (!userId) {
      toast.error('Please login to vote');
      return;
    }

    // Optimistically update
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, helpful_count: r.helpful_count + 1 } : r));

    const { error } = await supabase.from('review_helpful_votes').insert({
      user_id: userId,
      review_id: reviewId
    });

    if (error && error.code !== '23505') {
      // Revert if failed
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, helpful_count: r.helpful_count - 1 } : r));
      toast.error('Failed to vote');
    }
  };

  const onSubmit = async (data: ReviewFormValues) => {
    if (selectedRating === 0) {
      toast.error('Please select a star rating');
      return;
    }
    
    if (!userId || !enrollmentId) return;

    setIsSubmitting(true);

    const payload = {
      reviewer_id: userId,
      course_id: courseId,
      enrollment_id: enrollmentId,
      rating: selectedRating,
      title: data.title,
      body: data.body,
      is_verified: true,
    };

    if (myReview) {
      // Update existing
      const res = await submitReviewAction(payload, myReview.id);

      if (!res.success) {
        toast.error(res.error || 'Failed to update review');
      } else {
        toast.success('Review updated!');
        setMyReview({ ...myReview, ...data, rating: selectedRating });
        setIsEditing(false);
      }
    } else {
      // Insert new
      const res = await submitReviewAction(payload);

      if (!res.success) {
         if ((res as any).isDuplicate) {
           toast.error('You have already reviewed this course.');
         } else {
           toast.error(res.error || 'Failed to submit review');
         }
      } else {
        toast.success('Review submitted successfully!');
        
        // Optimistic local add
        const reviewWithUser = {
          ...res.data,
          full_name: 'You', // placeholder
          avatar_url: null
        } as Review;
        
        setMyReview(reviewWithUser);
        setReviews([reviewWithUser, ...reviews]);
        setIsEditing(false);
      }
    }
    setIsSubmitting(false);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star 
        key={i} 
        className={`w-[13px] h-[13px] ${i < rating ? 'text-[#FEBC2E] fill-[#FEBC2E]' : t.starEmpty}`} 
      />
    ));
  };

  return (
    <div className="mt-12">
      <h2 className={`font-sans font-bold text-[22px] ${t.textMain}`}>Student Reviews</h2>

      {/* Ratings Breakdown */}
      <div className={`${t.bgCard} rounded-2xl p-6 border ${t.borderCard} mt-5 relative`}>
        <div className="absolute top-4 left-4 flex gap-1.5 items-center">
          <div className="h-[8px] w-[8px] rounded-full bg-[#FF5F57]" />
          <div className="h-[8px] w-[8px] rounded-full bg-[#FEBC2E]" />
          <div className="h-[8px] w-[8px] rounded-full bg-[#28C840]" />
        </div>

        <div className="mt-6 flex flex-col md:flex-row gap-10 items-center">
          {/* Left Big Number */}
          <div className="flex flex-col items-center min-w-[140px]">
            <span className={`font-sans font-extrabold text-[52px] ${t.textMain} leading-none`}>
              {avgRating.toFixed(1)}
            </span>
            <div className="flex gap-[2px] mt-2">
              {renderStars(Math.round(avgRating))}
            </div>
            <span className={`text-[13px] ${t.textMuted} mt-2 font-medium`}>
              {totalReviews} ratings
            </span>
          </div>

          {/* Right Bars */}
          <div className="flex-1 w-full space-y-3">
            {[5, 4, 3, 2, 1].map((starVal) => {
              const countMatch = ratingBreakdown.find(r => r.rating === starVal);
              const count = countMatch ? countMatch.count : 0;
              const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

              return (
                <div key={starVal} className="flex items-center gap-3">
                  <span className={`text-[12px] ${t.textSec} w-4`}>{starVal}★</span>
                  <div className={`flex-1 h-1.5 ${isStudentView ? 'bg-gray-100' : 'bg-[rgba(255,255,255,0.06)]'} rounded-full overflow-hidden`}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-[#FEBC2E]" 
                    />
                  </div>
                  <span className={`text-[12px] ${t.textMuted} w-6`}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Write Review Section */}
      {isEnrolled && (!myReview || isEditing) && (
        <div className={`${t.bgCard} rounded-2xl p-5 border ${t.borderCard} mt-5 relative`}>
          <div className="absolute top-3 left-3 flex gap-1 items-center">
            <div className="h-[6px] w-[6px] rounded-full bg-[#FF5F57]" />
            <div className="h-[6px] w-[6px] rounded-full bg-[#FEBC2E]" />
            <div className="h-[6px] w-[6px] rounded-full bg-[#28C840]" />
          </div>

          <h3 className={`font-sans font-semibold text-[15px] ${t.textMain} mt-4`}>
            {myReview ? 'Edit Your Review' : 'Share your experience'}
          </h3>

          <div className="mt-4 flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setSelectedRating(star)}
                className="focus:outline-none"
              >
                <Star 
                  className={`w-[28px] h-[28px] transition-colors ${
                    (hoveredRating || selectedRating) >= star 
                      ? 'text-[#FEBC2E] fill-[#FEBC2E]' 
                      : t.starEmpty
                  }`} 
                />
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4">
            <div>
              <input
                {...register('title')}
                placeholder="Summarize your experience"
                className={`w-full ${t.bgInput} border ${t.borderInput} rounded-xl px-4 py-2 text-[14px] ${t.textMain} outline-none transition-colors`}
              />
              {errors.title && <span className="text-[11px] text-[#FF5F57] mt-1">{errors.title.message}</span>}
            </div>

            <div className="relative">
              <textarea
                {...register('body')}
                rows={4}
                placeholder="What did you like or dislike? Was it worth it?"
                className={`w-full ${t.bgInput} border ${t.borderInput} rounded-xl px-4 py-3 text-[14px] ${t.textMain} outline-none resize-none transition-colors`}
              />
              <div className={`absolute bottom-3 right-4 text-[11px] ${t.textMuted}`}>
                {bodyLength}/500
              </div>
            </div>
            {errors.body && <span className="text-[11px] text-[#FF5F57] mt-1">{errors.body.message}</span>}

            <div className="flex justify-end gap-3 mt-2">
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className={`px-5 py-2 text-[13px] font-medium ${t.textSec} ${t.linkHover} transition-colors`}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || selectedRating === 0 || !watch('title') || !watch('body')}
                className={`${t.btnPrimaryBg} ${t.btnPrimaryText} px-6 py-2 rounded-full text-[13px] font-bold transition-colors disabled:opacity-50`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Review List */}
      <div className="mt-8 flex flex-col gap-4">
        {myReview && !isEditing && (
          <div className="flex justify-end mb-[-10px] z-10">
            <button 
              onClick={() => {
                setIsEditing(true);
                reset({ title: myReview.title, body: myReview.body });
                setSelectedRating(myReview.rating);
              }}
              className={`text-[12px] ${t.textSec} ${t.linkHover} underline underline-offset-4`}
            >
              Edit your review
            </button>
          </div>
        )}

        {reviews.map((review) => (
          <div key={review.id} className={`${t.bgCard} rounded-2xl p-5 border ${t.borderCard} relative`}>
            <div className="absolute top-3 left-3 flex gap-1 items-center">
              <div className="h-[6px] w-[6px] rounded-full bg-[#FF5F57]" />
              <div className="h-[6px] w-[6px] rounded-full bg-[#FEBC2E]" />
              <div className="h-[6px] w-[6px] rounded-full bg-[#28C840]" />
            </div>

            <div className="flex items-start gap-3 mt-4">
              <div className={`relative h-[36px] w-[36px] rounded-full overflow-hidden ${t.bgAvatarFrame} shrink-0`}>
                 {review.avatar_url ? (
                   <Image src={review.avatar_url} alt={review.full_name} fill className="object-cover" />
                 ) : (
                   <div className={`w-full h-full flex items-center justify-center font-bold ${t.avatarEmptyColor} text-[14px]`}>
                     {review.full_name?.charAt(0)}
                   </div>
                 )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`font-sans font-semibold text-[14px] ${t.textMain}`}>{review.full_name}</span>
                  {review.is_verified && (
                    <span className={`inline-flex items-center gap-1 ${t.verifiedBg} ${t.verifiedText} text-[10px] font-medium rounded-full px-2 py-0.5 tracking-wide`}>
                      <CheckCircle2 className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </div>
                <div className="flex gap-[1px] mt-1">
                  {renderStars(review.rating)}
                </div>
              </div>
            </div>

            <h4 className={`font-semibold text-[14px] ${t.textMain} mt-4`}>{review.title}</h4>
            <p className={`text-[13px] ${t.textSec} leading-relaxed mt-1 whitespace-pre-wrap`}>
              {review.body}
            </p>

            <div className={`mt-4 pt-3 border-t ${t.borderCard} flex items-center justify-between`}>
              <div className={`text-[11px] ${t.textMuted}`}>
                {formatDistanceToNow(new Date(review.created_at))} ago
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[12px] ${t.textMuted}`}>Helpful?</span>
                <button 
                  onClick={() => handleHelpful(review.id)}
                  className={`flex items-center gap-1.5 text-[12px] font-medium ${t.textSec} ${t.linkHover} transition-colors bg-gray-50 dark:bg-zinc-800/50 px-2 py-1 rounded-md`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{review.helpful_count}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
        {reviews.length === 0 && !myReview && (
          <div className={`text-center text-[13px] ${t.textMuted} py-10 italic`}>
            No reviews yet. Check back later!
          </div>
        )}
      </div>
    </div>
  );
}
