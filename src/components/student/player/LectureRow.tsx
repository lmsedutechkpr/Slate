import { CheckCircle2, PlayCircle, FileText, CheckSquare, Radio } from 'lucide-react';

interface LectureRowProps {
  lecture: any;
  isActive: boolean;
  isCompleted: boolean;
  savedProgress: number;
  onSelect: () => void;
  language?: string;
}

export default function LectureRow({
  lecture,
  isActive,
  isCompleted,
  savedProgress,
  onSelect,
  language = 'en'
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
      {lecture.video_duration_secs > 0 && (
        <span className="text-[11px] text-gray-400 whitespace-nowrap ml-2">
          {Math.ceil(lecture.video_duration_secs / 60)}m
        </span>
      )}

    </div>
  );
}
