'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Play, FileText, CheckSquare, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateLectureAction, deleteLectureAction } from '@/actions/curriculum';

interface Lecture {
  id: string; title: string; type: 'video' | 'article' | 'quiz'; video_duration_secs?: number;
  read_time_mins?: number; quiz_duration_mins?: number;
  is_free_preview: boolean; is_published: boolean; sort_order: number;
}

interface Props { lecture: Lecture; onEdit: () => void; onRefresh: () => void; }

const TYPE_ICONS: Record<string, React.ReactNode> = {
  video: <Play className="h-4 w-4 text-[#1D1D1F]" />,
  article: <FileText className="h-4 w-4 text-[#6E6E73]" />,
  quiz: <CheckSquare className="h-4 w-4 text-[#FEBC2E]" />,
};

function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60); const s = secs % 60;
  return `${m}m ${s}s`;
}

export function LectureRow({ lecture, onEdit, onRefresh }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: lecture.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  const togglePublished = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateLectureAction(lecture.id, { is_published: !lecture.is_published });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update publish status');
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${lecture.title}"?`)) return;
    try {
      await deleteLectureAction(lecture.id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete lecture');
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex cursor-pointer items-center gap-3 rounded-xl bg-[#F5F5F7] px-3 py-2.5 transition-all hover:bg-[rgba(0,0,0,0.04)]"
    >
      <button {...attributes} {...listeners} className="cursor-grab text-[#AEAEB2] hover:text-[#6E6E73]">
        <GripVertical className="h-4 w-4" />
      </button>

      {TYPE_ICONS[lecture.type] ?? TYPE_ICONS.video}

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-[#1D1D1F] line-clamp-1">{lecture.title}</p>
        {lecture.type === 'video' && lecture.video_duration_secs && lecture.video_duration_secs > 0 && (
          <p className="text-[11px] text-[#AEAEB2]">{fmtDuration(lecture.video_duration_secs)}</p>
        )}
        {lecture.type === 'article' && (lecture.read_time_mins ?? 0) > 0 && (
          <p className="text-[11px] text-[#AEAEB2]">{lecture.read_time_mins}m read</p>
        )}
        {lecture.type === 'quiz' && (lecture.quiz_duration_mins ?? 0) > 0 && (
          <p className="text-[11px] text-[#AEAEB2]">{lecture.quiz_duration_mins}m quiz</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {lecture.is_free_preview && (
          <span className="rounded-full bg-[#EDFAF0] px-2 py-0.5 text-[10px] font-semibold text-[#28C840]">Free</span>
        )}
        {/* Publish toggle — always visible */}
        <button
          onClick={togglePublished}
          title={lecture.is_published ? 'Published — click to unpublish' : 'Unpublished — click to publish'}
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all ${
            lecture.is_published
              ? 'bg-[#EDFAF0] text-[#28C840] hover:bg-red-50 hover:text-[#FF5F57]'
              : 'bg-[#F5F5F7] text-[#AEAEB2] hover:bg-[#EDFAF0] hover:text-[#28C840]'
          }`}
        >
          {lecture.is_published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          {lecture.is_published ? 'Published' : 'Draft'}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="text-[#6E6E73] hover:text-[#1D1D1F] opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button onClick={handleDelete} className="text-[#FF5F57] opacity-0 group-hover:opacity-100 transition-opacity">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
