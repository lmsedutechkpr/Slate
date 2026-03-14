'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, BookOpen, Users, Star, MoreHorizontal, Eye, Trash2, Loader2, Copy } from 'lucide-react';
import TrafficLights from '@/components/auth/TrafficLights';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { duplicateCourseAction } from '@/actions/curriculum';

type Course = {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  status: string;
  total_enrolled: number;
  total_lectures: number;
  avg_rating: number;
  price: number;
  discounted_price: number | null;
  is_free: boolean;
  created_at: string;
};

type Filter = 'all' | 'published' | 'draft' | 'pending' | 'rejected';

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  approved: { label: 'Published', bg: 'bg-[#EDFAF0]', text: 'text-[#28C840]' },
  published: { label: 'Published', bg: 'bg-[#EDFAF0]', text: 'text-[#28C840]' },
  pending: { label: 'Under Review', bg: 'bg-[#FFF8EC]', text: 'text-[#FEBC2E]' },
  draft: { label: 'Draft', bg: 'bg-[#F5F5F7]', text: 'text-[#AEAEB2]' },
  rejected: { label: 'Rejected', bg: 'bg-[#FFF0EF]', text: 'text-[#FF5F57]' },
};

export function CourseListClient({ courses: initialCourses, userId }: { courses: Course[]; userId?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [filter, setFilter] = useState<Filter>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null); // course id being processed

  const filtered = courses.filter((c) => {
    if (filter === 'all') return true;
    if (filter === 'published') return c.status === 'approved' || c.status === 'published';
    if (filter === 'pending') return c.status === 'pending';
    if (filter === 'draft') return c.status === 'draft';
    if (filter === 'rejected') return c.status === 'rejected';
    return true;
  });

  const counts = {
    all: courses.length,
    published: courses.filter((c) => c.status === 'approved' || c.status === 'published').length,
    pending: courses.filter((c) => c.status === 'pending').length,
    draft: courses.filter((c) => c.status === 'draft').length,
    rejected: courses.filter((c) => c.status === 'rejected').length,
  };

  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'published', label: 'Published' },
    { key: 'pending', label: 'Under Review' },
    { key: 'draft', label: 'Draft' },
    { key: 'rejected', label: 'Rejected' },
  ];

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this course? This cannot be undone.')) {
      setOpenMenuId(null);
      return;
    }
    setOpenMenuId(null);
    setIsProcessing(id);
    const { error } = await supabase.from('courses').delete().eq('id', id);
    setIsProcessing(null);
    if (!error) {
      setCourses((prev) => prev.filter((c) => c.id !== id));
      router.refresh();
    } else {
      alert('Failed to delete course.');
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, course: Course) => {
    e.stopPropagation();
    setOpenMenuId(null);
    if (!userId) { alert('User not found'); return; }
    setIsProcessing(course.id);
    try {
      const newCourse = await duplicateCourseAction(course.id, userId);
      router.push(`/instructor/courses/${newCourse.id}/edit`);
    } catch (err: any) {
      alert('Failed to duplicate: ' + (err.message ?? 'Unknown error'));
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-sans text-[26px] font-bold text-[#1D1D1F]">My Courses</h1>
          <p className="mt-1 text-[13px] text-[#6E6E73]">{courses.length} courses</p>
        </div>
        <button
          onClick={() => router.push('/instructor/courses/new')}
          className="flex items-center gap-2 rounded-full bg-[#1D1D1F] px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:opacity-80"
        >
          <Plus className="h-4 w-4" />
          Create New Course
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              'flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-all',
              filter === tab.key
                ? 'bg-[#1D1D1F] text-white'
                : 'bg-white text-[#6E6E73] border border-[rgba(0,0,0,0.08)] hover:bg-[#F5F5F7]'
            )}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                filter === tab.key ? 'bg-white/20 text-white' : 'bg-[#F5F5F7] text-[#6E6E73]'
              )}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {courses.length === 0 && (
        <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
          <div className="flex h-10 items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
            <TrafficLights size="sm" />
          </div>
          <div className="flex flex-col items-center py-24">
            <BookOpen className="h-12 w-12 text-[#AEAEB2]" />
            <h2 className="mt-5 text-[22px] font-bold text-[#1D1D1F]">No courses yet</h2>
            <p className="mt-2 text-center text-[14px] text-[#6E6E73]">
              Create your first course and start sharing your knowledge
            </p>
            <button
              onClick={() => router.push('/instructor/courses/new')}
              className="mt-8 rounded-full bg-[#1D1D1F] px-6 py-3 text-[14px] font-semibold text-white hover:opacity-80"
            >
              Create Course
            </button>
          </div>
        </div>
      )}

      {/* Courses Grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => {
            const badge = STATUS_BADGE[course.status] ?? STATUS_BADGE.draft;
            const processing = isProcessing === course.id;
            
            return (
              <div
                key={course.id}
                className={cn(
                  "group overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md",
                  processing && "opacity-60 pointer-events-none"
                )}
              >
                {/* Titlebar */}
                <div className="flex h-8 items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-4">
                  <TrafficLights size="xs" />
                  <span className={cn('ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-semibold', badge.bg, badge.text)}>
                    {badge.label}
                  </span>
                </div>

                {/* Thumbnail */}
                <div className="relative h-[140px] bg-[#F5F5F7]">
                  {course.thumbnail_url ? (
                    <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <BookOpen className="h-10 w-10 text-[#AEAEB2]" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="line-clamp-2 text-[14px] font-bold text-[#1D1D1F]">{course.title}</h3>

                  <div className="mt-2 flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[12px] text-[#6E6E73]">
                      <Users className="h-3 w-3 text-[#AEAEB2]" />
                      {course.total_enrolled ?? 0}
                    </span>
                    <span className="flex items-center gap-1 text-[12px] text-[#6E6E73]">
                      <Star className="h-3 w-3 text-[#FEBC2E]" />
                      {course.avg_rating?.toFixed(1) ?? '—'}
                    </span>
                    <span className="flex items-center gap-1 text-[12px] text-[#6E6E73]">
                      <BookOpen className="h-3 w-3 text-[#AEAEB2]" />
                      {course.total_lectures ?? 0} lectures
                    </span>
                  </div>

                  <div className="mt-2">
                    {course.is_free ? (
                      <span className="text-[14px] font-bold text-[#28C840]">Free</span>
                    ) : course.discounted_price ? (
                      <span className="flex items-baseline gap-2">
                        <span className="text-[14px] font-bold text-[#1D1D1F]">
                          ₹{course.discounted_price.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[12px] text-[#AEAEB2] line-through">
                          ₹{course.price?.toLocaleString('en-IN')}
                        </span>
                      </span>
                    ) : (
                      <span className="text-[14px] font-bold text-[#1D1D1F]">
                        ₹{(course.price ?? 0).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => router.push(`/instructor/courses/${course.id}/edit`)}
                      className="flex-1 flex items-center justify-center rounded-xl bg-[#1D1D1F] py-2 text-[12px] font-semibold text-white transition-all hover:opacity-80"
                    >
                      {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Edit Course'}
                    </button>

                    {/* More options */}
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === course.id ? null : course.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#F5F5F7] text-[#6E6E73] hover:bg-gray-200"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      
                      {openMenuId === course.id && (
                        <div className="absolute bottom-full right-0 mb-2 z-50 w-44 overflow-hidden rounded-xl border border-[rgba(0,0,0,0.08)] bg-white shadow-lg">
                          <button
                            onClick={() => { router.push(`/instructor/courses/${course.id}/preview`); setOpenMenuId(null); }}
                            className="flex w-full items-center gap-2 px-4 py-2.5 text-[13px] text-[#1D1D1F] hover:bg-[#F5F5F7]"
                          >
                            <Eye className="h-4 w-4" /> View as Student
                          </button>
                          <button
                            onClick={(e) => handleDuplicate(e, course)}
                            className="flex w-full items-center gap-2 px-4 py-2.5 text-[13px] text-[#1D1D1F] hover:bg-[#F5F5F7]"
                          >
                            <Copy className="h-4 w-4" /> Duplicate
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, course.id)}
                            className="flex w-full items-center gap-2 px-4 py-2.5 text-[13px] text-[#FF5F57] hover:bg-[#FFF0EF]"
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filtered empty */}
      {filtered.length === 0 && courses.length > 0 && (
        <div className="py-16 text-center">
          <p className="text-[14px] text-[#6E6E73]">No {filter} courses found.</p>
        </div>
      )}
    </div>
  );
}
