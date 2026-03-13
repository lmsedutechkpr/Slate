'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Enrollment } from './CourseList';
import { CheckCircle2, Clock, Download, Award, MoreHorizontal, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface CourseCardProps {
  enrollment: Enrollment;
  userId: string;
  onUnenroll: (id: string) => void;
}

export default function CourseCard({ enrollment, userId, onUnenroll }: CourseCardProps) {
  const supabase = createClient();
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const isCompleted = enrollment.completed_at !== null;
  const isStarted = enrollment.progress_pct > 0;
  
  const formattedDuration = enrollment.total_duration_mins < 60 
    ? `${enrollment.total_duration_mins} min` 
    : `${Math.floor(enrollment.total_duration_mins / 60)}h ${enrollment.total_duration_mins % 60}m`;

  const timeAgo = enrollment.last_accessed_at 
    ? formatDistanceToNow(new Date(enrollment.last_accessed_at), { addSuffix: true })
    : 'Not started yet';

  const handleDownloadToggle = async () => {
    if (enrollment.downloaded_lectures > 0) {
      if (confirm(`Remove offline copy of ${enrollment.title}?`)) {
        // Find lectures for this course and remove them
        const { data: lectures } = await supabase.from('lectures').select('id').eq('course_id', enrollment.course_id);
        if (lectures) {
          await supabase.from('offline_downloads').delete().eq('user_id', userId).in('lecture_id', lectures.map(l => l.id));
          toast.success('Offline copy removed');
        }
      }
    } else {
      setIsDownloading(true);
      // Soft limit check (UI side only)
      const { count } = await supabase.from('offline_downloads').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_active', true);
      const { data: setting } = await supabase.from('site_settings').select('value').eq('key', 'max_free_downloads').single();
      const limit = parseInt(setting?.value || '5', 10);
      
      if ((count || 0) >= limit) {
        toast.error('Offline download limit reached. Manage your downloads to free up space.');
        setIsDownloading(false);
        return;
      }
      
      // Attempt Batch download insertion (simulated batch via Promise.all)
      const { data: lectures } = await supabase.from('lectures').select('id').eq('course_id', enrollment.course_id).eq('is_published', true);
      
      if (lectures && lectures.length > 0) {
        const payload = lectures.map(l => ({
          user_id: userId,
          lecture_id: l.id,
          enrollment_id: enrollment.enrollment_id,
          is_active: true
        }));
        
        await supabase.from('offline_downloads').upsert(payload, { onConflict: 'user_id,lecture_id' });
        toast.success('Downloaded for offline viewing');
      } else {
        toast.error('No lectures available to download');
      }
      setIsDownloading(false);
    }
  };

  const handleUnenroll = async () => {
    if (confirm(`Are you sure you want to unenroll from ${enrollment.title}?`)) {
      // Optimistic delete
      onUnenroll(enrollment.enrollment_id);
      
      const { error } = await supabase
        .from('enrollments')
        .update({ is_active: false })
        .eq('id', enrollment.enrollment_id);
        
      if (error) {
        toast.error('Failed to unenroll');
        // Rollback strategy would go here if this wasn't purely optimistic
      } else {
        toast.success(`Unenrolled from ${enrollment.title}`);
      }
    }
  };

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-gray-300 transition-all duration-300 overflow-hidden flex flex-col h-full">
      
      {/* Thumbnail Header area */}
      <div className="relative aspect-video w-full bg-gray-100 overflow-hidden">
        {enrollment.thumbnail_url ? (
          <Image 
            src={enrollment.thumbnail_url} 
            alt={enrollment.title} 
            fill 
            className={`object-cover transition-transform duration-700 ${!isCompleted ? 'group-hover:scale-105' : ''}`}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <span className="text-4xl font-extrabold text-gray-300">{enrollment.title.charAt(0)}</span>
          </div>
        )}

        {/* Mac Traffic Lights */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full z-10">
          <div className="w-[7px] h-[7px] rounded-full bg-[#FF5F57]"></div>
          <div className="w-[7px] h-[7px] rounded-full bg-[#FEBC2E]"></div>
          <div className="w-[7px] h-[7px] rounded-full bg-[#28C840]"></div>
        </div>

        {/* Category Badge */}
        {enrollment.category_name && (
          <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md rounded-full px-2.5 py-1 z-10 flex items-center gap-1.5">
            <div 
              className="w-1.5 h-1.5 rounded-full" 
              style={{ backgroundColor: enrollment.category_color || '#FFFFFF' }}
            />
            <span className="text-[10px] font-medium tracking-wide text-white uppercase">
              {enrollment.category_name}
            </span>
          </div>
        )}

        {/* Completed Overlay */}
        {isCompleted && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-20 flex flex-col items-center justify-center pointer-events-none transition-opacity">
            <div className="bg-white p-2 rounded-full shadow-sm ring-4 ring-green-100 mb-2">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <span className="text-green-700 font-bold tracking-tight text-sm">Completed</span>
          </div>
        )}

        {/* Certificate Badge */}
        {enrollment.has_certificate > 0 && (
          <div 
            className="absolute bottom-3 left-3 bg-green-50/90 backdrop-blur-md border border-green-200/50 rounded-full px-2.5 py-1 z-30 flex items-center gap-1.5 shadow-sm cursor-pointer hover:bg-green-100 transition-colors"
            onClick={() => { /* Modal Open Logic */ }}
          >
            <Award className="w-[11px] h-[11px] text-green-600" />
            <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest">Certified</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        
        {/* Title */}
        <h3 className="font-semibold text-[16px] text-gray-900 leading-snug line-clamp-2">
          {enrollment.title}
        </h3>

        {/* Instructor */}
        <div className="flex items-center gap-2 mt-2.5">
          <div className="w-5 h-5 rounded-full bg-gray-200 overflow-hidden relative">
            {enrollment.instructor_avatar ? (
              <Image src={enrollment.instructor_avatar} alt={enrollment.instructor_name} fill className="object-cover" />
            ) : (
               <div className="w-full h-full bg-gray-800 text-white flex justify-center items-center text-[8px] font-bold">
                 {enrollment.instructor_name?.charAt(0) || 'I'}
               </div>
            )}
          </div>
          <span className="text-[12px] font-medium text-gray-500">{enrollment.instructor_name}</span>
        </div>

        <div className="flex-1 mt-5 flex flex-col justify-end">
          {/* Progress Bar Container */}
          <div>
            <div className="flex justify-between items-end mb-1.5">
              <span className={`text-[12px] font-bold ${isCompleted ? 'text-green-600' : isStarted ? 'text-gray-900' : 'text-gray-400'}`}>
                {enrollment.progress_pct}% complete
              </span>
              <span className="text-[11px] font-medium text-gray-400 font-mono tracking-tight">
                {enrollment.completed_lectures} / {enrollment.total_lectures}
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full rounded-full ${isCompleted ? 'bg-green-500' : 'bg-gray-900'}`}
                initial={{ width: 0 }}
                animate={{ width: `${enrollment.progress_pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Meta Labels */}
          <div className="flex flex-wrap items-center gap-3 mt-3.5">
            <div className="flex items-center gap-1.5 border border-gray-100 bg-gray-50 px-2 py-1 rounded-md">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className="text-[11px] font-semibold text-gray-500">{formattedDuration}</span>
            </div>
            
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-md border border-gray-100 bg-gray-50 text-gray-500">
              {enrollment.difficulty}
            </span>

            {enrollment.downloaded_lectures > 0 && (
              <div className="flex items-center gap-1">
                <Download className="w-[11px] h-[11px] text-blue-500 flex-shrink-0" />
                <span className="text-[11px] font-semibold text-blue-600 whitespace-nowrap">{enrollment.downloaded_lectures} down</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Footers */}
      <div className="px-5 pt-3 pb-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
        
        {/* Main CTA */}
        {isCompleted ? (
          <Link 
            href={`/student/courses/${enrollment.course_id}`}
            className="text-[12.5px] font-bold text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 px-5 py-2 rounded-full transition-colors shadow-sm"
          >
            Review Course
          </Link>
        ) : (
          <Link 
            href={`/student/courses/${enrollment.course_id}`}
            className="text-[12.5px] font-bold text-white bg-gray-900 hover:bg-gray-800 px-5 py-2 rounded-full transition-colors shadow-sm"
          >
            {isStarted ? 'Continue' : 'Start Course'}
          </Link>
        )}

        {/* Secondary Actions */}
        <div className="flex items-center gap-1">
          
          <button 
            onClick={handleDownloadToggle}
            className={`p-2 rounded-full transition-colors ${enrollment.downloaded_lectures > 0 ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-900'}`}
            title={enrollment.downloaded_lectures > 0 ? 'Remove offline copy' : 'Download for offline'}
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            ) : enrollment.downloaded_lectures > 0 ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>

          {/* More Menu (Dropdown Native Simulation) */}
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 bottom-full mb-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg shadow-gray-200/50 z-50 overflow-hidden text-[13px] font-medium animate-in fade-in slide-in-from-bottom-2 duration-200">
                <Link 
                  href={`/courses/${enrollment.course_id}`}
                  className="block px-4 py-2.5 text-gray-700 hover:bg-gray-50"
                >
                  View Setup Details
                </Link>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/courses/${enrollment.course_id}`);
                    toast.success('Link copied!');
                  }}
                  className="w-full text-left px-4 py-2.5 text-gray-700 hover:bg-gray-50"
                >
                  Share Course
                </button>
                <div className="h-px bg-gray-100 my-1 font-semibold" />
                <button 
                  onClick={handleUnenroll}
                  className="w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50"
                >
                  Leave Course
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Tiny Status Footer */}
      <div className="bg-gray-50 px-5 pb-3">
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{timeAgo}</p>
      </div>

    </div>
  );
}
