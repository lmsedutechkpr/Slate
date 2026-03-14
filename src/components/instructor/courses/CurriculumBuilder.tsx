'use client';

import { useEffect, useState } from 'react';
import {
  DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Plus, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import TrafficLights from '@/components/auth/TrafficLights';
import { SectionRow } from './SectionRow';
import { AddLectureModal } from './AddLectureModal';
import { fetchSectionsAction, addSectionAction, updateSectionAction, deleteSectionAction } from '@/actions/curriculum';

interface Lecture {
  id: string; title: string; title_ta?: string; type: 'video' | 'article' | 'quiz';
  video_duration_secs?: number; read_time_mins?: number; quiz_duration_mins?: number;
  is_free_preview: boolean;
  is_published: boolean; sort_order: number; video_url?: string;
  article_content?: string;
}
interface Section {
  id: string; title: string; title_ta?: string; sort_order: number;
  lectures: Lecture[];
}

interface Props { courseId: string; onUpdate: (d: any) => void; }

function totalDuration(sections: Section[]) {
  const secs = sections.flatMap((s) => s.lectures).reduce((a, l) => {
    const videoSecs = l.video_duration_secs ?? 0;
    const readSecs = (l.read_time_mins ?? 0) * 60;
    const quizSecs = (l.quiz_duration_mins ?? 0) * 60;
    return a + videoSecs + readSecs + quizSecs;
  }, 0);
  const h = Math.floor(secs / 3600); const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function CurriculumBuilder({ courseId, onUpdate }: Props) {
  const supabase = createClient();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingSection, setAddingSection] = useState(false);
  const [modalState, setModalState] = useState<{ open: boolean; sectionId: string; lecture?: Lecture | null }>({
    open: false, sectionId: '', lecture: null,
  });

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => { fetchSections(); }, [courseId]);

  const fetchSections = async () => {
    setLoading(true);
    try {
      const data = await fetchSectionsAction(courseId);
      const sorted = (data ?? []).map((s: any) => ({
        ...s,
        lectures: [...(s.lectures ?? [])].sort((a: any, b: any) => a.sort_order - b.sort_order),
      }));
      setSections(sorted);
      const totalLectures = sorted.flatMap((s: any) => s.lectures).length;
      onUpdate({ total_lectures: totalLectures });
    } catch (err) {
      console.error('Failed to fetch sections:', err);
    } finally {
      setLoading(false);
    }
  };

  const addSection = async () => {
    setAddingSection(true);
    try {
      const data = await addSectionAction(courseId, 'New Section', sections.length);
      if (data) setSections((prev) => [...prev, { ...data, lectures: [] }]);
    } catch (err: any) {
      alert(err.message || 'Failed to add section');
    } finally {
      setAddingSection(false);
    }
  };

  const handleSectionDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = sections.findIndex((s) => s.id === active.id);
    const newIdx = sections.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(sections, oldIdx, newIdx).map((s, i) => ({ ...s, sort_order: i }));
    setSections(reordered);
    try {
      await Promise.all(reordered.map((s) => updateSectionAction(s.id, { sort_order: s.sort_order })));
    } catch (err: any) {
      console.error('Failed to reorder:', err);
    }
  };

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    setSections((prev) => prev.map((s) => s.id === sectionId ? { ...s, ...updates } : s));
  };

  const deleteSection = async (sectionId: string) => {
    try {
      await deleteSectionAction(sectionId);
      setSections((prev) => prev.filter((s) => s.id !== sectionId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete section');
    }
  };

  const totalLectures = sections.flatMap((s) => s.lectures).length;
  const publishedLectures = sections.flatMap((s) => s.lectures).filter((l) => l.is_published).length;

  if (loading) return <div className="flex items-center justify-center h-48 text-[#AEAEB2]">Loading curriculum...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-sans text-[22px] font-bold text-[#1D1D1F]">Curriculum</h2>
          <p className="mt-1 flex items-center gap-2 text-[13px] text-[#6E6E73]">
            <span>{sections.length} sections</span>
            <span>·</span>
            <span>{totalLectures} lectures</span>
            <span>·</span>
            <Clock className="h-3 w-3" />
            <span>{totalDuration(sections)}</span>
          </p>
        </div>
        <button
          onClick={addSection}
          disabled={addingSection}
          className="flex items-center gap-2 rounded-full bg-[#1D1D1F] px-4 py-2 text-[13px] font-semibold text-white transition-all hover:opacity-80 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Add Section
        </button>
      </div>

      {sections.length === 0 && (
        <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white">
          <div className="flex h-10 items-center bg-[#F5F5F7] px-5">
            <TrafficLights size="sm" />
          </div>
          <div className="py-16 text-center">
            <p className="text-[14px] text-[#6E6E73]">No sections yet. Click "Add Section" to get started.</p>
          </div>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {sections.map((section) => (
              <SectionRow
                key={section.id}
                section={section}
                courseId={courseId}
                onUpdate={(updates) => updateSection(section.id, updates)}
                onDelete={() => deleteSection(section.id)}
                onAddLecture={(sectionId) => setModalState({ open: true, sectionId, lecture: null })}
                onEditLecture={(sectionId, lecture) => setModalState({ open: true, sectionId, lecture })}
                onRefresh={fetchSections}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <AddLectureModal
        open={modalState.open}
        sectionId={modalState.sectionId}
        courseId={courseId}
        lecture={modalState.lecture}
        lectureCount={totalLectures}
        onClose={() => setModalState({ open: false, sectionId: '', lecture: null })}
        onSaved={fetchSections}
      />
    </div>
  );
}
