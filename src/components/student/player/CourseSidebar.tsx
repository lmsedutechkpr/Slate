"use client";

import { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LectureRow from './LectureRow';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { listOfflineLectureIds, removeOfflineLectureForUser, saveOfflineLectureForUser } from '@/lib/offlineVideo';

interface CourseSidebarProps {
  sections: any[];
  completedIds: Set<string>;
  activeLectureId: string | null;
  onSelectLecture: (lecture: any) => void;
  enrollmentProgress: number;
  language?: string;
  userId: string;
  enrollmentId: string;
  quizzesMap?: Record<string, any>;
  courseId: string;
}

export default function CourseSidebar({
  sections,
  completedIds,
  activeLectureId,
  onSelectLecture,
  enrollmentProgress,
  language = 'en',
  userId,
  enrollmentId,
  quizzesMap = {},
  courseId,
}: CourseSidebarProps) {
  const supabase = createClient();
  
  // Find which section currently has the active lecture to auto-expand it
  const initialOpenSectionId = (sections || []).find(s => 
    (s.lectures || []).some((l: any) => l.id === activeLectureId)
  )?.id;

  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(initialOpenSectionId ? [initialOpenSectionId] : [])
  );
  const [downloadedLectureIds, setDownloadedLectureIds] = useState<Set<string>>(
    new Set(listOfflineLectureIds(userId))
  );
  const [busyLectureId, setBusyLectureId] = useState<string | null>(null);

  const allLectures = useMemo(
    () => (sections || []).flatMap((s) => s.lectures || []),
    [sections],
  );

  const toggleSection = (sectionId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const totalLectures = allLectures.length;

  const toggleOfflineLecture = async (lecture: any) => {
    const lectureId = String(lecture.id || '');
    if (!lectureId) return;
    setBusyLectureId(lectureId);

    try {
      const isDownloaded = downloadedLectureIds.has(lectureId);
      if (isDownloaded) {
        await supabase
          .from('offline_downloads')
          .delete()
          .eq('user_id', userId)
          .eq('lecture_id', lectureId);

        removeOfflineLectureForUser(userId, lectureId);
        setDownloadedLectureIds((prev) => {
          const next = new Set(prev);
          next.delete(lectureId);
          return next;
        });
        toast.success('Offline copy deleted');
        return;
      }

      const { error } = await supabase.from('offline_downloads').upsert(
        {
          user_id: userId,
          lecture_id: lectureId,
          enrollment_id: enrollmentId,
          is_active: true,
        },
        { onConflict: 'user_id,lecture_id' },
      );

      if (error) throw error;

      if (lecture.type === 'video') {
        const result = await saveOfflineLectureForUser({
          userId,
          courseId,
          lectureId,
          title: String(lecture.title || 'Video lecture'),
          type: 'video',
          videoUrl: lecture.video_url || null,
          payload: {
            allowMockFallback: true,
            video_duration_secs: lecture.video_duration_secs || null,
          },
        });
        if (!result.saved) {
          throw new Error(result.reason || 'video_download_failed');
        }
        if (result.persistedVia === 'mock') {
          setDownloadedLectureIds((prev) => new Set(prev).add(lectureId));
          toast.success('Saved for offline (demo mode)');
          return;
        }
      } else if (lecture.type === 'article') {
        const result = await saveOfflineLectureForUser({
          userId,
          courseId,
          lectureId,
          title: String(lecture.title || 'Article lecture'),
          type: 'article',
          payload: {
            article_content: lecture.article_content || null,
            resources: Array.isArray(lecture.resources) ? lecture.resources : [],
          },
        });
        if (!result.saved) {
          throw new Error(result.reason || 'article_download_failed');
        }
      } else if (lecture.type === 'quiz') {
        const result = await saveOfflineLectureForUser({
          userId,
          courseId,
          lectureId,
          title: String(lecture.title || 'Quiz lecture'),
          type: 'quiz',
          payload: quizzesMap[lectureId] || null,
        });
        if (!result.saved) {
          throw new Error(result.reason || 'quiz_download_failed');
        }
      }

      setDownloadedLectureIds((prev) => new Set(prev).add(lectureId));
      toast.success('Downloaded for offline');
    } catch (error: any) {
      const reason = String(error?.message || '');
      if (reason.includes('missing_video_url')) {
        toast.error('This video has no downloadable media URL yet.');
      } else {
        toast.error('Failed to download lecture');
      }
    } finally {
      setBusyLectureId(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white border-l border-gray-200">
      
      {/* TOP HEADER */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div>
          <h3 className="font-sans font-semibold text-[14px] text-gray-900">Course Content</h3>
          <p className="text-[12px] text-gray-500 mt-0.5">
            {completedIds.size} / {totalLectures} lectures
          </p>
        </div>

        {/* Mini progress ring */}
        <div className="relative w-8 h-8">
          <svg className="w-8 h-8 transform -rotate-90">
            <circle
              className="text-gray-200"
              strokeWidth="2.5"
              stroke="currentColor"
              fill="transparent"
              r="14"
              cx="16"
              cy="16"
            />
            <circle
              className="text-blue-600 transition-all duration-500 ease-out"
              strokeWidth="2.5"
              strokeDasharray={88}
              strokeDashoffset={88 - (88 * enrollmentProgress) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="14"
              cx="16"
              cy="16"
            />
          </svg>
        </div>
      </div>

      {/* SECTIONS LIST */}
      <div className="flex-1 overflow-y-auto">
        {(sections || []).length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-[13px] mt-10">
            No sections available yet.
          </div>
        ) : (sections || []).map((section) => {
          const isOpen = expandedIds.has(section.id);
          const lectures = section.lectures || [];
          const sectionTitle = (language === 'ta' && section.title_ta) ? section.title_ta : section.title;
          
          const sectionCompletedCount = lectures.filter((l: any) => completedIds.has(l.id)).length;
          const sectionTotal = lectures.length;
          
          const isAllComplete = sectionCompletedCount === sectionTotal && sectionTotal > 0;
          const isSomeComplete = sectionCompletedCount > 0 && sectionCompletedCount < sectionTotal;

          return (
            <div key={section.id} className="border-b border-gray-100">
              
              {/* HEADER */}
              <button 
                onClick={() => toggleSection(section.id)}
                className="w-full px-4 py-3.5 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center gap-3 text-left"
              >
                <div className="flex gap-[3px] items-center shrink-0">
                  <div className="h-[5px] w-[5px] rounded-full bg-[#FF5F57]" />
                  <div className="h-[5px] w-[5px] rounded-full bg-[#FEBC2E]" />
                  <div className="h-[5px] w-[5px] rounded-full bg-[#28C840]" />
                </div>
                
                <motion.div
                  animate={{ rotate: isOpen ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </motion.div>

                <span className="flex-1 font-semibold text-[13px] text-gray-800 line-clamp-1">
                  {sectionTitle}
                </span>

                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-[11px] text-gray-500 font-medium">
                    {sectionCompletedCount}/{sectionTotal}
                  </span>
                  {isAllComplete ? (
                    <div className="w-[8px] h-[8px] rounded-full bg-[#28C840]" />
                  ) : isSomeComplete ? (
                    <div className="w-[8px] h-[8px] rounded-full bg-[#FEBC2E]" />
                  ) : (
                    <div className="w-[8px] h-[8px] rounded-full border-2 border-gray-300" />
                  )}
                </div>
              </button>

              {/* LECTURES COLLAPSER */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden bg-white"
                  >
                    <div className="flex flex-col">
                      {lectures.length === 0 ? (
                        <div className="p-4 text-center text-[12px] text-gray-400">
                          No published lectures yet.
                        </div>
                      ) : lectures.map((lecture: any) => (
                        <LectureRow 
                          key={lecture.id}
                          lecture={lecture}
                          isActive={activeLectureId === lecture.id}
                          isCompleted={completedIds.has(lecture.id)}
                          savedProgress={0} // Passed down mapped value from parent state
                          onSelect={() => onSelectLecture(lecture)}
                          language={language}
                          isDownloaded={downloadedLectureIds.has(String(lecture.id || ''))}
                          isTogglingDownload={busyLectureId === String(lecture.id || '')}
                          onToggleDownload={() => toggleOfflineLecture(lecture)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          );
        })}
      </div>

    </div>
  );
}
