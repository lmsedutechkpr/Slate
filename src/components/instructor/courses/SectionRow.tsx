'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { GripVertical, ChevronDown, Trash2, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import TrafficLights from '@/components/auth/TrafficLights';
import { LectureRow } from './LectureRow';
import { cn } from '@/lib/utils';
import { updateSectionAction, updateLectureAction } from '@/actions/curriculum';

interface Lecture {
  id: string; title: string; type: 'video' | 'article' | 'quiz'; video_duration_secs?: number;
  is_free_preview: boolean; is_published: boolean; sort_order: number;
}
interface Section {
  id: string; title: string; title_ta?: string; sort_order: number; lectures: Lecture[];
}
interface Props {
  section: Section; courseId: string;
  onUpdate: (u: Partial<Section>) => void;
  onDelete: () => void;
  onAddLecture: (sectionId: string) => void;
  onEditLecture: (sectionId: string, lecture: Lecture) => void;
  onRefresh: () => void;
}

export function SectionRow({ section, courseId, onUpdate, onDelete, onAddLecture, onEditLecture, onRefresh }: Props) {
  const supabase = createClient();
  const [collapsed, setCollapsed] = useState(false);
  const [title, setTitle] = useState(section.title);
  const [showTa, setShowTa] = useState(false);
  const [titleTa, setTitleTa] = useState(section.title_ta ?? '');

  const sensors = useSensors(useSensor(PointerSensor));

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const saveTitle = async () => {
    try {
      await updateSectionAction(section.id, { title });
      onUpdate({ title });
    } catch (err: any) {
      alert(err.message || 'Failed to save title');
    }
  };

  const saveTitleTa = async () => {
    try {
      await updateSectionAction(section.id, { title_ta: titleTa });
      onUpdate({ title_ta: titleTa });
    } catch (err: any) {
      alert(err.message || 'Failed to save Tamil title');
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${section.title}"? This will delete ${section.lectures.length} lecture(s). This cannot be undone.`)) return;
    onDelete();
  };

  const handleLectureDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const lecs = section.lectures;
    const oldIdx = lecs.findIndex((l) => l.id === active.id);
    const newIdx = lecs.findIndex((l) => l.id === over.id);
    const reordered = arrayMove(lecs, oldIdx, newIdx).map((l, i) => ({ ...l, sort_order: i }));
    onUpdate({ lectures: reordered });
    try {
      await Promise.all(reordered.map((l) =>
        updateLectureAction(l.id, { sort_order: l.sort_order })
      ));
    } catch (err: any) {
      console.error('Failed to reorder lectures:', err.message);
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
      {/* Section Header */}
      <div className="flex items-center gap-3 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] p-3">
        <button {...attributes} {...listeners} className="cursor-grab text-[#AEAEB2] hover:text-[#6E6E73]">
          <GripVertical className="h-4 w-4" />
        </button>
        <TrafficLights size="xs" />
        <button onClick={() => setCollapsed(!collapsed)} className="text-[#AEAEB2] transition-transform">
          <ChevronDown className={cn('h-4 w-4 transition-transform', collapsed && '-rotate-90')} />
        </button>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          placeholder="Section title..."
          className="flex-1 bg-transparent text-[14px] font-semibold text-[#1D1D1F] focus:outline-none"
        />

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowTa(!showTa)}
            className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', showTa ? 'bg-[#1D1D1F] text-white' : 'bg-white text-[#6E6E73] border border-[rgba(0,0,0,0.08)]')}
          >TA</button>
          <span className="text-[11px] text-[#AEAEB2]">{section.lectures.length} lectures</span>
          <button onClick={handleDelete} className="text-[#AEAEB2] hover:text-[#FF5F57] transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showTa && (
        <div className="border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-4 pb-2">
          <input
            value={titleTa}
            onChange={(e) => setTitleTa(e.target.value)}
            onBlur={saveTitleTa}
            placeholder="தமிழில் பிரிவு தலைப்பு..."
            className="w-full bg-transparent text-[13px] text-[#1D1D1F] focus:outline-none"
          />
        </div>
      )}

      {/* Lectures */}
      {!collapsed && (
        <div className="p-3">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleLectureDragEnd}>
            <SortableContext items={section.lectures.map((l) => l.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {section.lectures.map((lecture) => (
                  <LectureRow
                    key={lecture.id}
                    lecture={lecture}
                    onEdit={() => onEditLecture(section.id, lecture)}
                    onRefresh={onRefresh}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <button
            onClick={() => onAddLecture(section.id)}
            className="mt-2 flex w-full items-center gap-2 rounded-xl p-2 text-[13px] font-medium text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Lecture
          </button>
        </div>
      )}
    </div>
  );
}
