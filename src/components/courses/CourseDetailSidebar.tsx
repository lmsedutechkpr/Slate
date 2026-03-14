/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { Heart, Share2, PlayCircle, Clock, Smartphone, Download, Award, MessageSquare, ShieldCheck, Play } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { processPaymentAction } from '@/app/actions/enroll';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Simulated checkout popover
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";

export interface DetailSidebarProps {
  course: any;
  enrollment: any | null;
  initialWishlisted: boolean;
  userId: string | null;
  isStudentView?: boolean;
}

export default function CourseDetailSidebar({ course, enrollment, initialWishlisted, userId, isStudentView = false }: DetailSidebarProps) {
  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('card');
  const supabase = createClient();
  const router = useRouter();

  // Discount timer
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    if (!course.discount_expires_at) return;
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expires = new Date(course.discount_expires_at).getTime();
      const diff = expires - now;
      
      if (diff <= 0) {
        setTimeLeft("Expired");
        clearInterval(interval);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${days > 0 ? days + 'd ' : ''}${hours}h ${minutes}m`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [course.discount_expires_at]);

  const hasDiscountActive = (
    !course.is_free &&
    course.discounted_price != null &&
    Number(course.discounted_price) < Number(course.price) &&
    timeLeft !== "Expired"
  );
  const currentPrice = hasDiscountActive ? course.discounted_price : (course.price ?? 0);

  const t = isStudentView ? {
    bgMain: 'bg-white',
    borderMain: 'border-gray-200',
    shadowMain: 'shadow-lg',
    titleBg: 'bg-gray-50',
    titleBorder: 'border-gray-200',
    titleText: 'text-gray-500',
    imgBg: 'bg-gray-100',
    textMain: 'text-gray-900',
    textSec: 'text-gray-500',
    textMuted: 'text-gray-400',
    discountBg: 'bg-yellow-50',
    discountText: 'text-yellow-600',
    discountSlash: 'text-gray-400',
    btnPrimary: 'bg-gray-900 text-white hover:bg-gray-800',
    btnSecondary: 'border-gray-200 text-gray-900 hover:bg-gray-50',
    btnGhost: 'border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300',
    btnSuccessBg: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100',
    iconMain: 'text-gray-400',
    divider: 'border-gray-100',
    modalBg: 'bg-white text-gray-900',
    modalHeaderBg: 'bg-gray-50',
    modalBorder: 'border-gray-200',
    modalItemSelected: 'bg-gray-50 border-gray-900 text-gray-900',
    modalItemNormal: 'bg-white border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300',
    bgInput: 'bg-white',
    ring: 'focus:border-gray-300',
  } : {
    bgMain: 'bg-[#111111]',
    borderMain: 'border-[rgba(255,255,255,0.08)]',
    shadowMain: 'shadow-[0_24px_64px_rgba(0,0,0,0.5)]',
    titleBg: 'bg-[#1C1C1E]',
    titleBorder: 'border-[rgba(255,255,255,0.06)]',
    titleText: 'text-[#48484A]',
    imgBg: 'bg-[#1C1C1E]',
    textMain: 'text-white',
    textSec: 'text-[#8E8E93]',
    textMuted: 'text-[#48484A]',
    discountBg: 'bg-[rgba(254,188,46,0.1)]',
    discountText: 'text-[#FEBC2E]',
    discountSlash: 'text-[#48484A]',
    btnPrimary: 'bg-white text-[#0A0A0A] hover:bg-[rgba(255,255,255,0.9)]',
    btnSecondary: 'border-[rgba(255,255,255,0.12)] text-white hover:bg-[rgba(255,255,255,0.05)]',
    btnGhost: 'border-[rgba(255,255,255,0.1)] text-[#8E8E93] hover:text-white hover:border-[rgba(255,255,255,0.2)]',
    btnSuccessBg: 'bg-[rgba(40,200,64,0.1)] text-[#28C840] border-[#28C840]/20 hover:bg-[rgba(40,200,64,0.15)]',
    iconMain: 'text-[#48484A]',
    divider: 'border-[rgba(255,255,255,0.05)]',
    modalBg: 'bg-[#111111] text-white',
    modalHeaderBg: 'bg-[#1C1C1E]',
    modalBorder: 'border-[rgba(255,255,255,0.1)]',
    modalItemSelected: 'bg-[#1C1C1E] border-white text-white',
    modalItemNormal: 'bg-[#1C1C1E] border-[rgba(255,255,255,0.08)] text-[#8E8E93] hover:text-white',
    bgInput: 'bg-[#1C1C1E]',
    ring: 'focus:border-[rgba(255,255,255,0.2)]',
  };

  const handleWishlist = async () => {
    if (!userId) return router.push(`/login?callbackUrl=${isStudentView ? `/student/courses/browse/${course.id}` : `/courses/${course.id}`}`);
    
    const nextState = !isWishlisted;
    setIsWishlisted(nextState);

    if (nextState) {
      const { error } = await supabase.from('wishlists').insert({ user_id: userId, course_id: course.id });
      if (error && error.code !== '23505') {
        setIsWishlisted(!nextState);
        toast.error('Failed to add to wishlist');
      } else {
        toast.success('Added to wishlist');
      }
    } else {
      const { error } = await supabase.from('wishlists').delete().eq('user_id', userId).eq('course_id', course.id);
      if (error) {
        setIsWishlisted(!nextState);
        toast.error('Failed to remove from wishlist');
      } else {
        toast.success('Removed from wishlist');
      }
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  const handlePrimaryAction = () => {
    if (!userId) {
      router.push(`/login?callbackUrl=${isStudentView ? `/student/courses/browse/${course.id}` : `/courses/${course.id}`}`);
      return;
    }
    if (enrollment) {
      router.push(`/student/courses/${course.id}`);
      return;
    }
    if (course.is_free) {
      enrollFree();
    } else {
      setShowPaymentModal(true);
    }
  };

  const enrollFree = async () => {
    setLoading(true);
    const { error } = await supabase.from('enrollments').insert({
      course_id: course.id,
      student_id: userId,
      is_active: true
    });
    
    if (error && error.code !== '23505') {
      toast.error('Failed to enroll. Please try again.');
      setLoading(false);
    } else {
      toast.success('🎉 Enrolled successfully!');
      router.push(`/student/courses/${course.id}`);
    }
  };

  const processSimulatedPayment = async () => {
    setLoading(true);
    
    await new Promise(r => setTimeout(r, 1500));
    
    // Server Action bypasses RLS and triggers via Service Role Key
    const res = await processPaymentAction(course.id, userId!);

    if (!res.success) {
      toast.error(`Payment failed: ${res.error}`);
      setLoading(false);
      return;
    }

    setShowPaymentModal(false);
    toast.success('🎉 Payment successful! Enrolled in course.');
    
    setTimeout(() => {
      router.push(`/student/courses/${course.id}`);
    }, 1000);
  };

  return (
    <>
      <div className={`${t.bgMain} rounded-2xl border ${t.borderMain} overflow-hidden ${t.shadowMain}`}>
        {/* Titlebar */}
        <div className={`${t.titleBg} border-b ${t.titleBorder} px-4 py-3 flex items-center relative`}>
          <div className="absolute left-4 flex gap-1.5 items-center">
            <div className="h-[8px] w-[8px] rounded-full bg-[#FF5F57]" />
            <div className="h-[8px] w-[8px] rounded-full bg-[#FEBC2E]" />
            <div className="h-[8px] w-[8px] rounded-full bg-[#28C840]" />
          </div>
          <span className={`w-full text-center text-[12px] ${t.titleText} font-medium tracking-wide`}>
            Enroll in this Course
          </span>
        </div>

        <div className="p-5">
          {/* Mobile Thumbnail Render (Desktop is handled in Hero, but conditionally rendered here if needed mapping) */}
          <div className={`lg:hidden w-full aspect-video rounded-xl overflow-hidden ${t.imgBg} mb-5 relative`}>
             {course.thumbnail_url && <Image src={course.thumbnail_url} alt="Cover" fill className="object-cover" />}
             {course.preview_video_url && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Play className="h-10 w-10 text-white opacity-80" />
              </div>
             )}
          </div>

          {/* Pricing */}
          <div>
            {course.is_free ? (
              <>
                <div className={`font-sans font-extrabold text-[32px] ${t.textMain}`}>Free</div>
                <div className={`text-[13px] ${t.textSec}`}>Enroll for free</div>
              </>
            ) : hasDiscountActive ? (
              <>
                <div className="flex items-center gap-2">
                  <span className={`font-sans font-extrabold text-[32px] ${t.textMain} leading-none`}>₹{course.discounted_price}</span>
                  <span className={`${t.discountBg} ${t.discountText} rounded-full px-3 py-1 text-[12px] font-semibold`}>
                    {Math.round(((course.price - course.discounted_price) / course.price) * 100)}% OFF
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[16px] ${t.discountSlash} line-through`}>₹{course.price}</span>
                  {timeLeft && timeLeft !== "Expired" && (
                     <span className="text-[12px] text-[#FF5F57] flex items-center gap-1">
                       <Clock className="w-3 h-3" /> Offer ends in {timeLeft}
                     </span>
                  )}
                </div>
              </>
            ) : (
              <div className={`font-sans font-extrabold text-[32px] ${t.textMain}`}>₹{course.price}</div>
            )}
          </div>

          {/* CTA */}
          <div className="mt-5">
            {!enrollment ? (
              <button
                onClick={handlePrimaryAction}
                disabled={loading}
                className={`w-full ${t.btnPrimary} font-bold text-[15px] py-3.5 rounded-full transition-colors disabled:opacity-70 disabled:cursor-not-allowed`}
              >
                {loading ? 'Processing...' : (!userId ? 'Enroll Now' : course.is_free ? 'Enroll for Free' : `Enroll Now — ₹${currentPrice}`)}
              </button>
            ) : enrollment.completed_at ? (
               <div className="flex flex-col gap-2">
                 <button onClick={() => toast.info('Review dialog triggering...')} className={`w-full border ${t.btnSecondary} font-medium text-[14px] py-3 rounded-xl transition-colors`}>
                   Review Course
                 </button>
                 {course.certificate_enabled && (
                    <button onClick={() => router.push('/student/certificates')} className={`w-full ${t.textSec} font-medium text-[13px] py-2 hover:${t.textMain} transition-colors`}>
                      View Certificate
                    </button>
                 )}
               </div>
            ) : (
               <button
                onClick={handlePrimaryAction}
                className={`w-full ${t.btnSuccessBg} border font-semibold text-[14px] py-3.5 rounded-full transition-colors`}
               >
                 Continue Learning →
               </button>
            )}
          </div>

          {/* Secondary Actions */}
          {!enrollment && (
            <button 
              onClick={handleWishlist}
              className={`w-full flex items-center justify-center gap-2 mt-3 py-3 rounded-xl border transition-colors ${
                isWishlisted 
                  ? 'border-[#FF5F57]/20 text-[#FF5F57] bg-[rgba(255,95,87,0.05)]' 
                  : t.btnGhost
              }`}
            >
               <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#FF5F57]' : ''}`} />
              <span className="text-[13px] font-medium">{isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}</span>
            </button>
          )}

          <button 
            onClick={handleShare}
            className={`w-full flex items-center justify-center gap-2 mt-3 text-[12px] ${t.textMuted} hover:${t.textSec} transition-colors`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Course</span>
          </button>

          {/* Includes List */}
          <div className={`mt-6 pt-5 border-t ${t.divider}`}>
            <h4 className={`text-[11px] uppercase tracking-wider ${t.textMuted} font-semibold mb-4`}>This course includes</h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <PlayCircle className={`w-4 h-4 ${t.iconMain}`} />
                <span className={`text-[13px] ${t.textSec}`}>{course.total_lectures || 0} on-demand lectures</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className={`w-4 h-4 ${t.iconMain}`} />
                <span className={`text-[13px] ${t.textSec}`}>{Math.floor((course.total_duration_mins || 0) / 60)}h {(course.total_duration_mins || 0) % 60}m of content</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Smartphone className={`w-4 h-4 ${t.iconMain}`} />
                <span className={`text-[13px] ${t.textSec}`}>Access on all devices</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Download className={`w-4 h-4 ${t.iconMain}`} />
                <span className={`text-[13px] ${t.textSec}`}>Offline download available</span>
              </div>
              {course.certificate_enabled && (
                <div className="flex items-center gap-2.5">
                  <Award className={`w-4 h-4 ${t.iconMain}`} />
                  <span className={`text-[13px] ${t.textSec}`}>Certificate of completion</span>
                </div>
              )}
              <div className="flex items-center gap-2.5">
                <MessageSquare className={`w-4 h-4 ${t.iconMain}`} />
                <span className={`text-[13px] ${t.textSec}`}>Q&A with instructor</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Simulated Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent showCloseButton={false} className={`sm:max-w-md ${t.modalBg} border ${t.modalBorder} rounded-2xl p-0 overflow-hidden gap-0`}>
          <div className={`${t.modalHeaderBg} border-b ${t.modalBorder} px-4 py-3 flex items-center relative`}>
            <div className="absolute left-4 flex gap-1.5 items-center">
              <div className="h-[8px] w-[8px] rounded-full bg-[#FF5F57]" />
              <div className="h-[8px] w-[8px] rounded-full bg-[#FEBC2E]" />
              <div className="h-[8px] w-[8px] rounded-full bg-[#28C840]" />
            </div>
            <DialogTitle className="w-full text-center text-[13px] font-medium">Complete Payment</DialogTitle>
          </div>
          
          <div className="p-6">
            <DialogDescription className="sr-only">Make a mock payment</DialogDescription>
            
            {/* Order Summary */}
            <div className={`${t.modalHeaderBg} rounded-xl p-4 mb-5 flex items-center gap-4`}>
              <div className={`relative w-[50px] h-[50px] rounded-lg overflow-hidden shrink-0 ${t.imgBg}`}>
                {course.thumbnail_url && <Image src={course.thumbnail_url} alt="Cover" fill className="object-cover" />}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-[14px] line-clamp-1">{course.title}</div>
                <div className="font-bold text-[15px] text-[#FEBC2E] mt-1">₹{currentPrice}</div>
              </div>
            </div>

            {/* Methods */}
            <div>
              <div className={`text-[11px] uppercase tracking-wider ${t.textMuted} font-semibold mb-3`}>Payment method</div>
              <div className="flex flex-col gap-2">
                {[
                  { id: 'card', name: '💳 Credit / Debit Card' },
                  { id: 'upi', name: '📱 UPI' },
                  { id: 'netbanking', name: '🏦 Net Banking' }
                ].map(method => {
                  const isSelected = selectedMethod === method.id;
                  return (
                    <div 
                      key={method.id} 
                      onClick={() => setSelectedMethod(method.id)}
                      className={`rounded-xl p-3.5 flex items-center gap-3 border cursor-pointer relative overflow-hidden transition-colors ${isSelected ? t.modalItemSelected : t.modalItemNormal}`}
                    >
                       {isSelected && <div className="absolute inset-0 bg-[rgba(255,255,255,0.02)] pointer-events-none" />}
                       <div className={`h-4 w-4 rounded-full border flex flex-shrink-0 justify-center items-center ${isSelected ? (isStudentView ? 'border-gray-900' : 'border-white') : t.borderMain}`}>
                         {isSelected && <div className={`h-2 w-2 rounded-full ${isStudentView ? 'bg-gray-900' : 'bg-white'}`}/>}
                       </div>
                       <span className="text-[13px] font-medium flex-1">{method.name}</span>
                    </div>
                  );
                })}
              </div>
              
              {/* Dummy Input Fields based on Selection */}
              <div className="mt-4">
                {selectedMethod === 'card' && (
                  <div className="flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">
                    <input type="text" defaultValue="4242 4242 4242 4242" placeholder="Card Number (0000 0000 0000 0000)" className={`w-full rounded-xl border ${t.borderMain} ${t.bgInput} px-4 py-2.5 text-[13px] outline-none ${t.ring} transition-all`} />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" defaultValue="12/28" placeholder="MM/YY" className={`w-full rounded-xl border ${t.borderMain} ${t.bgInput} px-4 py-2.5 text-[13px] outline-none ${t.ring} transition-all`} />
                      <input type="text" defaultValue="123" placeholder="CVC" className={`w-full rounded-xl border ${t.borderMain} ${t.bgInput} px-4 py-2.5 text-[13px] outline-none ${t.ring} transition-all`} />
                    </div>
                    <input type="text" defaultValue="John Doe" placeholder="Name on Card" className={`w-full rounded-xl border ${t.borderMain} ${t.bgInput} px-4 py-2.5 text-[13px] outline-none ${t.ring} transition-all`} />
                  </div>
                )}
                
                {selectedMethod === 'upi' && (
                  <div className="flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">
                    <input type="text" defaultValue="john.doe@okicici" placeholder="Enter UPI ID (e.g. name@bank)" className={`w-full rounded-xl border ${t.borderMain} ${t.bgInput} px-4 py-2.5 text-[13px] outline-none ${t.ring} transition-all`} />
                    <div className={`text-[11px] ${t.textMuted} px-1`}>
                      A payment request will be sent to your UPI app.
                    </div>
                  </div>
                )}

                {selectedMethod === 'netbanking' && (
                  <div className="flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">
                    <select defaultValue="" className={`w-full rounded-xl border ${t.borderMain} ${t.bgInput} px-4 py-2.5 text-[13px] outline-none ${t.ring} transition-all appearance-none cursor-pointer`}>
                      <option value="" disabled>Select your Bank</option>
                      <option value="sbi">State Bank of India</option>
                      <option value="hdfc">HDFC Bank</option>
                      <option value="icici">ICICI Bank</option>
                      <option value="axis">Axis Bank</option>
                    </select>
                  </div>
                )}
              </div>

              <div className={`mt-4 flex items-center gap-1.5 text-[11px] ${t.textMuted}`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Secure payment powered by Simulated Gateway</span>
              </div>
            </div>

            {/* Total */}
            <div className={`border-t ${t.modalBorder} pt-4 mt-5 flex justify-between items-center`}>
              <span className={`text-[13px] ${t.textSec}`}>Total amount</span>
              <span className="font-sans font-bold text-[18px]">₹{currentPrice}</span>
            </div>

            {/* Action */}
            <button 
              onClick={processSimulatedPayment}
              disabled={loading}
              className={`mt-6 w-full ${t.btnPrimary} font-bold text-[15px] py-3.5 rounded-full transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
                  <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${isStudentView ? 'border-inherit' : 'border-[#0A0A0A]'}`} />
                  Processing...
                </>
              ) : `Pay ₹${currentPrice}`}
            </button>
            <button 
              onClick={() => setShowPaymentModal(false)}
              className={`mt-3 w-full text-center text-[13px] ${t.textMuted} hover:${t.textSec} transition-colors py-2`}
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
