'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import CourseFilters from './CourseFilters';
import CourseCard from './CourseCard';
import EmptyState from './EmptyState';
import { motion } from 'framer-motion';

export interface Enrollment {
  enrollment_id: string;
  progress_pct: number;
  enrolled_at: string;
  last_accessed_at: string;
  completed_at: string | null;
  is_active: boolean;
  course_id: string;
  title: string;
  thumbnail_url: string;
  total_lectures: number;
  total_duration_mins: number;
  avg_rating: number;
  total_reviews: number;
  certificate_enabled: boolean;
  difficulty: string;
  is_free: boolean;
  price: number;
  category_id: string;
  category_name: string;
  category_name_ta: string;
  category_color: string;
  instructor_name: string;
  instructor_avatar: string;
  completed_lectures: number;
  downloaded_lectures: number;
  has_certificate: number;
}

interface CourseListProps {
  initialEnrollments: Enrollment[];
  userId: string;
}

const ITEMS_PER_PAGE = 9;

export default function CourseList({ initialEnrollments, userId }: CourseListProps) {
  const supabase = createClient();
  const [enrollments, setEnrollments] = useState<Enrollment[]>(initialEnrollments);
  const [filtered, setFiltered] = useState<Enrollment[]>(initialEnrollments);
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [downloadLimitInfo, setDownloadLimitInfo] = useState({ limit: 5, current: 0 });

  // Load download limit info
  useEffect(() => {
    async function loadDownloadStats() {
      const { count } = await supabase
        .from('offline_downloads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_active', true);

      const { data: limitSetting } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'max_free_downloads')
        .single();
        
      setDownloadLimitInfo({
        current: count || 0,
        limit: parseInt(limitSetting?.value || '5', 10)
      });
    }
    loadDownloadStats();
  }, [supabase, userId]);

  // Realtime Subscriptions
  useEffect(() => {
    // 1. Enrollments Table
    const enrollmentsChannel = supabase.channel('my-courses-enrollments')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'enrollments',
        filter: `student_id=eq.${userId}`
      }, (payload) => {
        setEnrollments(prev => prev.map(e => 
          e.enrollment_id === payload.new.id
            ? { 
                ...e, 
                progress_pct: payload.new.progress_pct,
                completed_at: payload.new.completed_at,
                last_accessed_at: payload.new.last_accessed_at,
                is_active: payload.new.is_active
              }
            : e
        ));
      })
      .subscribe();

    // 2. Offline Downloads
    const downloadsChannel = supabase.channel('my-courses-downloads')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'offline_downloads',
        filter: `user_id=eq.${userId}`
      }, () => {
        // Just reload the page or refetch the counts for simplicity if downloads change, 
        // to keep the frontend completely in sync. Or we could manually bump state.
      })
      .subscribe();

    // 3. Certificates
    const certsChannel = supabase.channel('my-courses-certs')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'certificates',
        filter: `student_id=eq.${userId}`
      }, (payload) => {
        setEnrollments(prev => prev.map(e => 
          e.enrollment_id === payload.new.enrollment_id
            ? { ...e, has_certificate: 1 }
            : e
        ));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(enrollmentsChannel);
      supabase.removeChannel(downloadsChannel);
      supabase.removeChannel(certsChannel);
    };
  }, [supabase, userId]);

  // Handle derived active enrollments
  const activeEnrollments = useMemo(() => enrollments.filter(e => e.is_active), [enrollments]);
  const visibleItems = filtered.slice(0, page * ITEMS_PER_PAGE);
  const hasMore = filtered.length > page * ITEMS_PER_PAGE;

  const handleFilterChange = useCallback((filteredData: Enrollment[]) => {
    setFiltered(filteredData);
    setPage(1); // Reset page on filter
  }, []);

  return (
    <div className="w-full">
      <CourseFilters 
        enrollments={activeEnrollments}
        onFilterChange={handleFilterChange}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Offline Download Info Banner (Only if they have downloads) */}
      {downloadLimitInfo.current > 0 && (
        <div className="mt-4 bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
            </svg>
            <span className="text-[13px] text-gray-700 font-medium">
              {downloadLimitInfo.current} lectures downloaded ({downloadLimitInfo.limit} max)
            </span>
            <div className="hidden sm:block w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden ml-2">
              <div 
                className={`h-full rounded-full ${
                  (downloadLimitInfo.current / downloadLimitInfo.limit) >= 1 ? 'bg-red-500' :
                  (downloadLimitInfo.current / downloadLimitInfo.limit) >= 0.8 ? 'bg-amber-400' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(100, (downloadLimitInfo.current / downloadLimitInfo.limit) * 100)}%` }}
              />
            </div>
          </div>
          <button className="text-[12px] font-medium text-gray-500 hover:text-gray-900 transition-colors">
            Manage
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 mt-6">
        {visibleItems.map((enrollment, index) => (
          <motion.div
            key={enrollment.enrollment_id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.3 }}
          >
            <CourseCard 
              enrollment={enrollment} 
              userId={userId} 
              onUnenroll={(id) => setEnrollments(prev => prev.filter(e => e.enrollment_id !== id))}
            />
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && <EmptyState tab={activeTab} />}

      {hasMore && (
        <div className="flex justify-center mt-10">
          <button 
            onClick={() => setPage(p => p + 1)}
            className="px-8 py-2.5 rounded-full text-[14px] font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
          >
            Load more courses
          </button>
        </div>
      )}
    </div>
  );
}
