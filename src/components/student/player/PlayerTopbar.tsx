import { ArrowLeft, StickyNote, MessageSquare, List, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface PlayerTopbarProps {
  courseTitle: string;
  courseTitleTa?: string | null;
  progressPct: number;
  notesOpen: boolean;
  qaOpen: boolean;
  sidebarOpen?: boolean;
  onToggleNotes: () => void;
  onToggleQA: () => void;
  onToggleSidebar?: () => void;
  onOpenMobileSidebar: () => void;
  language?: string;
}

export default function PlayerTopbar({
  courseTitle,
  courseTitleTa,
  progressPct,
  notesOpen,
  qaOpen,
  sidebarOpen = true,
  onToggleNotes,
  onToggleQA,
  onToggleSidebar,
  onOpenMobileSidebar,
  language = 'en'
}: PlayerTopbarProps) {
  const router = useRouter();

  const title = (language === 'ta' && courseTitleTa) ? courseTitleTa : courseTitle;

  return (
    <div className="h-[48px] bg-white border-b border-gray-200 flex items-center px-4 gap-4 flex-shrink-0 relative z-20">
      
      {/* LEFT */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div className="h-[7px] w-[7px] bg-[#FF5F57] rounded-full" />
        <div className="h-[7px] w-[7px] bg-[#FEBC2E] rounded-full" />
        <div className="h-[7px] w-[7px] bg-[#28C840] rounded-full" />
        
        <div className="w-px h-4 bg-gray-200 mx-2" />
        
        <button 
          onClick={() => router.push('/student/courses')}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors group"
          title="Back to My Courses"
        >
          <ArrowLeft className="w-[15px] h-[15px]" />
          <span className="font-sans font-medium text-[13px] truncate max-w-[150px] lg:max-w-[400px]">
            {title}
          </span>
        </button>
      </div>

      {/* CENTER (Absolute for true centering) */}
      <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center justify-center pointer-events-none">
        <div className="w-[200px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gray-900 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ type: 'spring', stiffness: 50, damping: 10 }}
          />
        </div>
        <div className="text-[11px] font-medium text-gray-500 mt-1">
          {Math.round(progressPct)}% complete
        </div>
      </div>

      {/* RIGHT */}
      <div className="ml-auto flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onToggleNotes}
          title="Notes (N)"
          className={`p-1.5 rounded-lg transition-colors flex items-center gap-2 ${
            notesOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <StickyNote className="w-[15px] h-[15px]" />
        </button>

        <button
          onClick={onToggleQA}
          title="Q&A (Q)"
          className={`p-1.5 rounded-lg transition-colors flex items-center gap-2 ${
            qaOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <MessageSquare className="w-[15px] h-[15px]" />
        </button>

        <div className="w-px h-4 bg-gray-200 mx-1 hidden lg:block" />

        <button
          onClick={onToggleSidebar}
          title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          className={`p-1.5 rounded-lg transition-colors hidden lg:flex items-center gap-2 ${
            !sidebarOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          {sidebarOpen ? (
            <PanelRightClose className="w-[16px] h-[16px]" />
          ) : (
            <PanelRightOpen className="w-[16px] h-[16px]" />
          )}
        </button>

        <button
          onClick={onOpenMobileSidebar}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-900 lg:hidden ml-1"
        >
          <List className="w-[15px] h-[15px]" />
        </button>
      </div>

    </div>
  );
}
