"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import PlayerTopbar from "./PlayerTopbar";
import CourseSidebar from "./CourseSidebar";
import VideoPlayer from "./VideoPlayer";
import ArticleViewer from "./ArticleViewer";
import QuizPlayer from "./QuizPlayer";
import NotesPanel from "./NotesPanel";
import QAPanel from "./QAPanel";
import { Award, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useRouter } from 'next/navigation';
import { markLectureCompleteAction } from "@/app/actions/progress";

export default function PlayerShell({
  enrollment,
  sections,
  progress,
  resumeLecture,
  userId,
  prefs,
  quizzesMap = {},
}: any) {
  const [activeLecture, setActiveLecture] = useState(resumeLecture);
  if (!enrollment?.courses) return null;
  const [enrollmentProgress, setEnrollmentProgress] = useState(enrollment.progress_pct || 0);
  
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    new Set(progress?.filter((p: any) => p.is_completed).map((p: any) => p.lecture_id))
  );

  const [notesOpen, setNotesOpen] = useState(false);
  const [qaOpen, setQaOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  // Scroll to top when active lecture changes
  useEffect(() => {
    if (!activeLecture) return;

    contentRef.current?.scrollTo(0, 0);
    // Update last_accessed_at stat without waiting
    supabase.from('enrollments').update({ last_accessed_at: new Date().toISOString() })
      .eq('id', enrollment.id).then();
  }, [activeLecture?.id, enrollment.id, supabase]);

  // Handle Lecture Completion Flow
  const handleMarkComplete = async (lectureIdToComplete: string = activeLecture?.id, isPassedQuiz = false) => {
    if (!lectureIdToComplete) return;
    
    // Quiz lectures MUST only be marked complete when the student passes (via QuizPlayer.onComplete)
    // If called for a quiz lecture without the explicit passed-quiz flag, skip the completion.
    const allLecturesFlat = sections?.flatMap((s: any) => s.lectures || []) || [];
    const targetLecture = allLecturesFlat.find((l: any) => l.id === lectureIdToComplete);
    if (targetLecture?.type === 'quiz' && !isPassedQuiz) {
      // Don't mark quiz as complete unless explicitly told it was passed
      return;
    }
    
    // 1. Save to DB
    await markLectureCompleteAction({
      enrollment_id: enrollment.id,
      lecture_id: lectureIdToComplete,
      student_id: userId,
      is_completed: true,
    });

    // 2. Update Local State Optimistically
    setCompletedIds(prev => {
      const next = new Set(prev);
      next.add(lectureIdToComplete);
      return next;
    });

    // 3. Auto-advance to next lecture (skip for quizzes — let student dismiss on their own)
    if (targetLecture?.type !== 'quiz') {
      const currentIndex = allLecturesFlat.findIndex((l: any) => l.id === lectureIdToComplete);
      const nextLecture = allLecturesFlat[currentIndex + 1];
      if (nextLecture && prefs?.autoplay_next !== false) {
        setTimeout(() => {
          setActiveLecture(nextLecture);
        }, 1500);
      }
    }
  };


  // Realtime subscription to overall progress updates
  useEffect(() => {
    const channel = supabase.channel('player-enrollment')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'enrollments',
        filter: `id=eq.${enrollment.id}`
      }, (payload) => {
        setEnrollmentProgress(payload.new.progress_pct);
        if (payload.new.completed_at && !enrollment.completed_at) {
          // Course completely finished
          setShowCompleteModal(true);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enrollment.id, supabase, enrollment.completed_at]);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in notes/qa inputs
      const activeEl = document.activeElement as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName) || activeEl.isContentEditable) {
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        setNotesOpen(prev => {
          if (!prev) setQaOpen(false); // Mutually exclusive
          return !prev;
        });
      }
      if (e.key === 'q' || e.key === 'Q') {
        setQaOpen(prev => {
          if (!prev) setNotesOpen(false); // Mutually exclusive
          return !prev;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleNotes = () => {
    setNotesOpen(!notesOpen);
    if (!notesOpen) setQaOpen(false);
  };

  const handleToggleQA = () => {
    setQaOpen(!qaOpen);
    if (!qaOpen) setNotesOpen(false);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F5F5F7] overflow-hidden absolute inset-0 text-gray-900">
      
      {/* Topbar */}
      <PlayerTopbar 
        courseTitle={enrollment.courses.title}
        courseTitleTa={enrollment.courses.title_ta}
        progressPct={enrollmentProgress}
        notesOpen={notesOpen}
        qaOpen={qaOpen}
        onToggleNotes={handleToggleNotes}
        onToggleQA={handleToggleQA}
        onOpenMobileSidebar={() => setSidebarOpen(true)}
        language={prefs?.language}
      />

      {/* Main Split Interface */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* RIGHT AREA - Sidebar Panels (Reverse ordered visually from prompt layout to fit Light theme standards if preferred, but leaving as standard left-content right-nav layout) */}
        
        {/* CONTENT AREA */}
        <div ref={contentRef} className="flex-1 overflow-y-auto bg-white relative">
            
            {/* LECTURE TYPE CONTENT ROUTER */}
            <div className="w-full h-full max-w-5xl mx-auto px-4 sm:px-8 xl:px-12 pt-8 pb-32">
              
              {!activeLecture ? (
                <div className="p-8 pb-32 flex flex-col items-center justify-center text-gray-400 min-h-[50vh]">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">🚧</span>
                  </div>
                  <p className="font-medium text-gray-900">No Content Available</p>
                  <p className="text-sm text-gray-500 mt-1 max-w-sm text-center">
                    This course doesn't have any published lectures yet.
                  </p>
                </div>
              ) : (
                <>
                  {activeLecture.type === 'video' && (
                    <div className="md:p-8 mt-0 md:mt-4">
                      <VideoPlayer 
                        lecture={activeLecture}
                        enrollmentId={enrollment.id}
                        userId={userId}
                        savedProgress={progress?.find((p: any) => p.lecture_id === activeLecture.id)?.progress_secs || 0}
                        autoplay={true}
                        playbackSpeed={prefs?.playback_speed || 1}
                        onComplete={() => handleMarkComplete(activeLecture.id)}
                        onProgressChange={(secs) => {
                          // Handled internally by video player to sync to DB, but can lift state here if needed
                        }}
                      />
                    </div>
                  )}

                  {activeLecture.type === 'article' && (
                    <div className="p-4 md:p-8 mt-4">
                      <ArticleViewer 
                        lecture={activeLecture}
                        isCompleted={completedIds.has(activeLecture.id)}
                        onComplete={() => handleMarkComplete(activeLecture.id)}
                        language={prefs?.language}
                      />
                    </div>
                  )}

                   {activeLecture.type === 'quiz' && (
                    <div className="p-4 md:p-8 mt-4">
                       <QuizPlayer 
                         lecture={activeLecture}
                         enrollmentId={enrollment.id}
                         userId={userId}
                         onComplete={() => handleMarkComplete(activeLecture.id, true /* isPassedQuiz */)}
                         language={prefs?.language}
                         prefetchedQuiz={quizzesMap[activeLecture.id] ?? null}
                       />
                    </div>
                  )}

                  {!['video', 'article', 'quiz'].includes(activeLecture.type) && (
                    <div className="p-8 pb-32 flex flex-col items-center justify-center text-gray-400 min-h-[50vh]">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <span className="text-2xl">⚠️</span>
                      </div>
                      <p className="font-medium text-gray-900">Unsupported Content Type</p>
                      <p className="text-sm text-gray-500 mt-1 max-w-sm text-center">
                        This lecture type ({activeLecture.type}) is not supported in the web player yet.
                      </p>
                      <button 
                        onClick={() => handleMarkComplete(activeLecture.id)}
                        className="mt-6 px-6 py-2.5 bg-gray-900 text-white rounded-xl font-medium"
                      >
                        Mark as Complete anyway
                      </button>
                    </div>
                  )}
                </>
              )}

            </div>

            {/* Slide-in Overlays (Notes & QA) */}
            <AnimatePresence>
              {notesOpen && activeLecture && (
                <motion.div 
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="absolute right-0 top-0 bottom-0 w-full md:w-[380px] bg-gray-50 border-l border-gray-200 z-30 shadow-2xl"
                >
                  <NotesPanel 
                    lectureId={activeLecture.id}
                    lectureTitle={(prefs?.language === 'ta' && activeLecture.title_ta) ? activeLecture.title_ta : activeLecture.title}
                    userId={userId}
                    courseId={enrollment.courses.id}
                    onClose={() => setNotesOpen(false)}
                  />
                </motion.div>
              )}
              {qaOpen && activeLecture && (
                <motion.div 
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="absolute right-0 top-0 bottom-0 w-full md:w-[380px] bg-gray-50 border-l border-gray-200 z-30 shadow-2xl"
                >
                  <QAPanel 
                    lectureId={activeLecture.id}
                    lectureTitle={(prefs?.language === 'ta' && activeLecture.title_ta) ? activeLecture.title_ta : activeLecture.title}
                    userId={userId}
                    courseId={enrollment.courses.id}
                    onClose={() => setQaOpen(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
        </div>

        {/* CURRICULUM SIDEBAR (Desktop Fixed, Mobile controlled via Sheet later) */}
        <div className="hidden lg:flex w-[340px] flex-col border-l border-gray-200 bg-[#FAFAFA] shrink-0 h-full relative z-20 shadow-sm">
           <CourseSidebar 
             sections={sections}
             completedIds={completedIds}
             activeLectureId={activeLecture?.id}
             onSelectLecture={(lecture) => setActiveLecture(lecture)}
             enrollmentProgress={enrollmentProgress}
             language={prefs?.language}
             userId={userId}
             enrollmentId={enrollment.id}
             quizzesMap={quizzesMap}
             courseId={enrollment.courses.id}
           />
        </div>

      </div>

      {/* COURSE COMPLETE MODAL */}
      <Dialog open={showCompleteModal} onOpenChange={setShowCompleteModal}>
        <DialogContent className="sm:max-w-md bg-white border-gray-200 p-0 overflow-hidden shadow-2xl flex flex-col items-center">
          
          <div className="w-full h-11 bg-gray-50 border-b border-gray-200 flex items-center px-4 relative">
             <div className="flex gap-1.5 items-center absolute left-4">
                <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
                <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
                <div className="h-2 w-2 rounded-full bg-[#28C840]" />
             </div>
             <span className="w-full text-center text-[12px] font-semibold text-gray-500">
               Course Completed
             </span>
          </div>

          <div className="p-8 pb-10 flex flex-col items-center w-full">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [1.2, 1] }}
              transition={{ type: 'spring', duration: 0.6, bounce: 0.5 }}
              className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6 shadow-inner"
            >
              <Award className="w-12 h-12 text-[#FEBC2E]" />
            </motion.div>

            <h2 className="text-2xl font-sans font-bold text-gray-900 text-center mb-2">
              🎉 You completed the course!
            </h2>
            <p className="text-sm font-medium text-gray-500 text-center mb-8 max-w-[280px]">
              {enrollment.courses.title}
            </p>

            {enrollment.courses.certificate_enabled && (
              <div className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center mb-8">
                <p className="text-[12px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Your Certificate</p>
                <p className="font-mono text-[14px] text-gray-800 font-medium">Available in Dashboard</p>
              </div>
            )}

            <div className="flex gap-4 w-full justify-center">
              <button 
                onClick={() => router.push('/student/courses')}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back to Courses
              </button>
              {enrollment.courses.certificate_enabled && (
                <button 
                  onClick={() => router.push('/student/certificates')}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 shadow-sm transition-colors"
                >
                  View Certificate
                </button>
              )}
            </div>

          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
