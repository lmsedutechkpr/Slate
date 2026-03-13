'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart, CheckCircle2, Award, BookOpen, Clock, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

export interface CatalogCourse {
  id: string;
  title: string;
  title_ta?: string | null;
  slug: string;
  thumbnail_url?: string | null;
  subtitle?: string | null;
  is_free: boolean;
  price?: number | null;
  discounted_price?: number | null;
  avg_rating: number;
  total_reviews: number;
  total_enrolled: number;
  total_lectures: number;
  total_duration_mins: number;
  difficulty: string;
  language: string;
  certificate_enabled: boolean;
  published_at?: string | null;
  categories?: {
    id: string;
    name: string;
    name_ta?: string | null;
    color?: string | null;
    slug: string;
  } | null;
  course_instructors: {
    is_primary: boolean;
    profiles: {
      id: string;
      full_name: string | null;
      avatar_url?: string | null;
    };
  }[];
}

interface CourseCatalogCardProps {
  course: CatalogCourse;
  initialIsEnrolled: boolean;
  initialIsWishlisted: boolean;
  userId: string | null;
  isStudentView?: boolean;
  onRemoveWishlist?: () => void;
}

export default function CourseCatalogCard({
  course,
  initialIsEnrolled,
  initialIsWishlisted,
  userId,
  isStudentView = false,
  onRemoveWishlist
}: CourseCatalogCardProps) {
  const router = useRouter();
  const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted);
  const supabase = createClient();

  const primaryInstructor = course.course_instructors?.find(ci => ci.is_primary)?.profiles;

  // Format duration
  const hours = Math.floor(course.total_duration_mins / 60);
  const mins = course.total_duration_mins % 60;
  const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const handleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) {
      router.push('/login');
      return;
    }

    if (onRemoveWishlist && isWishlisted) {
      onRemoveWishlist();
      return;
    }

    const newValue = !isWishlisted;
    setIsWishlisted(newValue); // Optimistic UI

    if (newValue) {
      const { error } = await supabase
        .from('wishlists')
        .insert({ user_id: userId, course_id: course.id });
      
      if (error && error.code !== '23505') { // Ignore unique violation
        setIsWishlisted(!newValue);
        toast.error('Failed to add to wishlist');
      } else {
        toast.success('Added to wishlist');
      }
    } else {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', userId)
        .eq('course_id', course.id);
      
      if (error) {
        setIsWishlisted(!newValue);
        toast.error('Failed to remove from wishlist');
      } else {
        toast.success('Removed from wishlist');
      }
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'beginner': return { bg: 'bg-[rgba(40,200,64,0.08)]', text: 'text-[#28C840]' };
      case 'intermediate': return { bg: 'bg-[rgba(254,188,46,0.08)]', text: 'text-[#FEBC2E]' };
      case 'advanced': return { bg: 'bg-[rgba(255,95,87,0.08)]', text: 'text-[#FF5F57]' };
      case 'expert': return { bg: 'bg-[rgba(255,255,255,0.06)]', text: 'text-[#8E8E93]' };
      default: return { bg: 'bg-[rgba(255,255,255,0.06)]', text: 'text-[#8E8E93]' };
    }
  };

  const diffColors = getDifficultyColor(course.difficulty);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className="text-[#FEBC2E] text-[12px]">★</span>);
      } else if (i === fullStars && hasHalfStar) {
        // Simple half star fallback
        stars.push(<span key={i} className="text-[#FEBC2E] text-[12px] opacity-70">★</span>);
      } else {
        stars.push(<span key={i} className="text-[#48484A] text-[12px]">★</span>);
      }
    }
    return stars;
  };

  const hasDiscount = !course.is_free && course.discounted_price != null && course.discounted_price < (course.price || 0);

  const t = isStudentView ? {
    cardBg: 'bg-white',
    cardBorder: 'border-gray-200 hover:border-gray-300',
    cardShadow: 'hover:shadow-xl',
    imgBg: 'bg-gray-100',
    textMain: 'text-gray-900',
    textSec: 'text-gray-500',
    iconText: 'text-gray-400',
    divider: 'border-gray-100',
    priceOrig: 'text-gray-400',
    btnText: 'text-gray-900 hover:text-gray-600',
    bgAvatar: 'bg-gray-100',
    iconFill: 'text-gray-300'
  } : {
    cardBg: 'bg-[#111111]',
    cardBorder: 'border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.14)]',
    cardShadow: 'hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)]',
    imgBg: 'bg-[#1C1C1E]',
    textMain: 'text-white',
    textSec: 'text-[#8E8E93]',
    iconText: 'text-[#48484A]',
    divider: 'border-[rgba(255,255,255,0.05)]',
    priceOrig: 'text-[#48484A]',
    btnText: 'text-white hover:text-[#8E8E93]',
    bgAvatar: 'bg-[#1C1C1E]',
    iconFill: 'text-[#48484A]'
  };

  return (
    <div 
      onClick={() => router.push(isStudentView ? `/student/courses/browse/${course.id}` : `/courses/${course.id}`)}
      className={`group relative flex flex-col ${t.cardBg} rounded-2xl overflow-hidden border ${t.cardBorder} hover:-translate-y-[3px] ${t.cardShadow} transition-all duration-250 cursor-pointer`}
    >
      {/* Thumbnail Area */}
      <div className={`relative aspect-video w-full overflow-hidden ${t.imgBg}`}>
        {course.thumbnail_url ? (
          <Image
            src={course.thumbnail_url}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className={`text-4xl ${t.iconFill} font-bold opacity-30`}>
              {course.title.charAt(0)}
            </span>
          </div>
        )}

        {/* Traffic Lights */}
        <div className="absolute top-3 left-3 bg-[rgba(0,0,0,0.55)] backdrop-blur-sm rounded-full px-2 py-1 flex gap-1.5 items-center z-10">
          <div className="h-[7px] w-[7px] rounded-full bg-[#FF5F57]" />
          <div className="h-[7px] w-[7px] rounded-full bg-[#FEBC2E]" />
          <div className="h-[7px] w-[7px] rounded-full bg-[#28C840]" />
        </div>

        {/* Category Badge */}
        {course.categories && (
          <div className="absolute top-3 right-3 bg-[rgba(0,0,0,0.6)] backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1.5 z-10">
            {course.categories.color && (
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: course.categories.color }} />
            )}
            <span className="text-[11px] font-medium text-white">
              {course.language === 'ta' && course.categories.name_ta ? course.categories.name_ta : course.categories.name}
            </span>
          </div>
        )}

        {/* Enrolled / Certificate Badges */}
        <div className="absolute bottom-3 left-3 flex flex-col gap-1.5 items-start z-10">
          {initialIsEnrolled && (
            <div className="bg-[rgba(40,200,64,0.15)] backdrop-blur-sm border border-[#28C840]/20 rounded-full px-2.5 py-1 flex items-center gap-1.5">
              <CheckCircle2 className="h-[10px] w-[10px] text-[#28C840]" />
              <span className="text-[10px] font-semibold text-[#28C840]">Enrolled</span>
            </div>
          )}
          {!initialIsEnrolled && course.certificate_enabled && (
            <div className="bg-[rgba(254,188,46,0.1)] backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1.5">
              <Award className="h-[10px] w-[10px] text-[#FEBC2E]" />
              <span className="text-[10px] text-[#FEBC2E]">Certificate</span>
            </div>
          )}
        </div>

        {/* Wishlist Button */}
        <button 
          onClick={handleWishlist}
          className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-[rgba(0,0,0,0.6)] backdrop-blur-sm flex items-center justify-center z-20 group/wishlist"
        >
          <Heart 
            className={`h-[15px] w-[15px] transition-colors ${
              isWishlisted 
                ? 'text-[#FF5F57] fill-[#FF5F57]' 
                : 'text-white opacity-70 group-hover/wishlist:opacity-100'
            }`} 
          />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className={`font-sans font-semibold text-[15px] ${t.textMain} line-clamp-2 leading-tight`}>
          {course.language === 'ta' && course.title_ta ? course.title_ta : course.title}
        </h3>
        
        {course.subtitle && (
          <p className={`text-[13px] ${t.textSec} line-clamp-1 mt-1`}>
            {course.subtitle}
          </p>
        )}

        {/* Instructor */}
        {primaryInstructor && (
          <div className="flex items-center gap-2 mt-3">
            <div className={`relative h-[22px] w-[22px] rounded-full overflow-hidden ${t.bgAvatar}`}>
              {primaryInstructor.avatar_url && (
                <Image src={primaryInstructor.avatar_url} alt="Instructor" fill className="object-cover" />
              )}
            </div>
            <span className={`text-[12px] ${t.textSec} truncate`}>
              {primaryInstructor.full_name}
            </span>
          </div>
        )}

        {/* Rating */}
        <div className="flex items-center gap-2 mt-3">
          <div className="flex items-center gap-[1px]">
            {renderStars(course.avg_rating || 0)}
          </div>
          <span className="text-[13px] font-semibold text-[#FEBC2E]">
            {Number(course.avg_rating || 0).toFixed(1)}
          </span>
          {course.total_reviews > 0 ? (
            <span className={`text-[11px] ${t.iconText}`}>({course.total_reviews})</span>
          ) : (
            <span className={`text-[11px] ${t.iconText}`}>No ratings yet</span>
          )}
        </div>

        {/* Meta Stats */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <BookOpen className={`h-[11px] w-[11px] ${t.iconText}`} />
            <span className={`text-[11px] ${t.iconText}`}>{course.total_lectures} lectures</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className={`h-[11px] w-[11px] ${t.iconText}`} />
            <span className={`text-[11px] ${t.iconText}`}>{durationStr}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className={`h-[11px] w-[11px] ${t.iconText}`} />
            <span className={`text-[11px] ${t.iconText}`}>{course.total_enrolled} students</span>
          </div>
        </div>

        {/* Difficulty */}
        <div className="mt-3">
          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] uppercase tracking-wide font-medium ${diffColors.bg} ${diffColors.text}`}>
            {course.difficulty}
          </span>
        </div>

        {/* Bottom Row - Price & CTA (pushed to bottom) */}
        <div className="mt-auto pt-4 relative">
          <div className={`border-t ${t.divider} absolute top-0 left-0 right-0`} />
          <div className="flex items-center justify-between pt-1">
            
            {/* Price */}
            <div>
              {course.is_free ? (
                <span className="inline-flex items-center bg-[rgba(40,200,64,0.1)] text-[#28C840] rounded-full px-3 py-1 text-[12px] font-semibold">
                  Free
                </span>
              ) : hasDiscount ? (
                <div className="flex items-baseline gap-1.5">
                  <span className={`font-sans font-bold text-[16px] ${t.textMain}`}>
                    ₹{course.discounted_price}
                  </span>
                  <span className={`text-[12px] ${t.priceOrig} line-through`}>
                    ₹{course.price}
                  </span>
                  <span className="bg-[rgba(254,188,46,0.1)] text-[#FEBC2E] rounded-full text-[10px] px-2 py-0.5 ml-0.5">
                    {Math.round(((course.price! - course.discounted_price!) / course.price!) * 100)}% off
                  </span>
                </div>
              ) : (
                <span className={`font-sans font-bold text-[16px] ${t.textMain}`}>
                  ₹{course.price}
                </span>
              )}
            </div>

            {/* CTA Option */}
            <div>
              {initialIsEnrolled ? (
                <button 
                  onClick={(e) => { e.stopPropagation(); router.push(`/student/courses/${course.id}`); }}
                  className="text-[12px] font-medium text-[#28C840] hover:underline"
                >
                  Go to Course →
                </button>
              ) : (
                <button 
                  onClick={(e) => { e.stopPropagation(); router.push(isStudentView ? `/student/courses/browse/${course.id}` : `/courses/${course.id}`); }}
                  className={`text-[12px] font-medium ${t.btnText} transition-colors`}
                >
                  Enroll Now →
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
