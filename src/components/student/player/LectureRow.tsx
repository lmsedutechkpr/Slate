import { CheckCircle2, PlayCircle, FileText, CheckSquare, Radio, Download, Trash2 } from 'lucide-react';

interface LectureRowProps {
  lecture: any;
  isActive: boolean;
  isCompleted: boolean;
  savedProgress: number;
  onSelect: () => void;
  language?: string;
  isDownloaded?: boolean;
  onToggleDownload?: () => void;
  isTogglingDownload?: boolean;
}

export default function LectureRow({
  lecture,
  isActive,
  isCompleted,
  savedProgress,
  onSelect,
  language = 'en',
  isDownloaded = false,
  onToggleDownload,
  isTogglingDownload = false,
}: LectureRowProps) {
  
  const title = (language === 'ta' && lecture.title_ta) ? lecture.title_ta : lecture.title;

  return (
    <div 
      onClick={onSelect}
      className={`px-4 py-2.5 flex items-center gap-3 cursor-pointer transition-all duration-150 border-b border-gray-100 ${
        isActive 
          ? 'bg-blue-50/50 border-l-[3px] border-l-blue-600 pl-[13px]' // Slightly adjust padding to account for 3px active border
          : 'hover:bg-gray-50 border-l-[3px] border-l-transparent pl-[13px]'
      }`}
    >
      
      {/* STATUS ICON */}
      <div className="flex-shrink-0 w-[20px] h-[20px] flex items-center justify-center">
        {isCompleted ? (
          <CheckCircle2 className="w-[16px] h-[16px] text-[#28C840]" />
        ) : isActive ? (
          // Spinner ring for currently active/watching
          <div className="w-[16px] h-[16px] rounded-full border-2 border-gray-200 border-t-blue-600 animate-spin" />
        ) : savedProgress > 0 ? (
          // In progress tiny ring
          <div className="w-[16px] h-[16px] rounded-full border-[2.5px] border-blue-600 border-r-transparent rotate-45" />
        ) : (
          // Not started general icon
          <>
            {lecture.type === 'video' && <PlayCircle className="w-[14px] h-[14px] text-gray-400" />}
            {lecture.type === 'article' && <FileText className="w-[14px] h-[14px] text-gray-400" />}
            {lecture.type === 'quiz' && <CheckSquare className="w-[14px] h-[14px] text-gray-400" />}
            {lecture.type === 'live' && <Radio className="w-[14px] h-[14px] text-gray-400" />}
          </>
        )}
      </div>

      {/* CENTER */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <span className={`text-[13px] line-clamp-2 ${
          isActive ? 'text-gray-900 font-medium' : isCompleted ? 'text-gray-900' : 'text-gray-600'
        }`}>
          {title}
        </span>
        
        {/* Progress bar if partially started but not complete */}
        {savedProgress > 0 && !isCompleted && lecture.type === 'video' && (
          <div className="h-[2px] w-full bg-gray-200 rounded-full overflow-hidden mt-1.5">
            <div 
              className="h-full bg-blue-600 rounded-full" 
              style={{ width: `${Math.min(savedProgress, 100)}%` }} 
            />
          </div>
        )}
      </div>

      {/* RIGHT DURATION */}
      {lecture.type === 'video' && lecture.video_duration_secs > 0 && (
        <span className="text-[11px] text-gray-400 whitespace-nowrap ml-2">
          {Math.ceil(lecture.video_duration_secs / 60)}m
        </span>
      )}
      {lecture.type === 'article' && (lecture.read_time_mins ?? 0) > 0 && (
        <span className="text-[11px] text-gray-400 whitespace-nowrap ml-2">
          {lecture.read_time_mins}m read
        </span>
      )}
      {lecture.type === 'quiz' && (lecture.quiz_duration_mins ?? 0) > 0 && (
        <span className="text-[11px] text-gray-400 whitespace-nowrap ml-2">
          {lecture.quiz_duration_mins}m quiz
        </span>
      )}

      {onToggleDownload ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!isTogglingDownload) onToggleDownload();
          }}
          className={`ml-2 inline-flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
            isDownloaded
              ? 'border-[rgba(255,95,87,0.35)] bg-[rgba(255,95,87,0.08)] text-[#FF5F57]'
              : 'border-[rgba(0,0,0,0.14)] bg-white text-[#6E6E73] hover:text-[#1D1D1F]'
          } ${isTogglingDownload ? 'cursor-wait opacity-60' : ''}`}
          title={isDownloaded ? 'Delete offline copy' : 'Download for offline'}
          aria-label={isDownloaded ? 'Delete offline copy' : 'Download for offline'}
        >
          {isDownloaded ? <Trash2 className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
        </button>
      ) : null}

    </div>
  );
}
