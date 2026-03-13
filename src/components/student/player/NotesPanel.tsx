import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface NotesPanelProps {
  lectureId: string;
  lectureTitle: string;
  userId: string;
  courseId: string;
  onClose: () => void;
}

export default function NotesPanel({
  lectureId,
  lectureTitle,
  userId,
  courseId,
  onClose
}: NotesPanelProps) {
  const [noteText, setNoteText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [initialText, setInitialText] = useState('');
  
  const supabase = createClient();

  useEffect(() => {
    const fetchNote = async () => {
      const { data } = await supabase
        .from('user_events')
        .select('metadata')
        .eq('user_id', userId)
        .eq('event_type', 'note')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })
        .limit(10); // Find closest match for THIS lecture specifically
      
      const lectureNote = data?.find(d => d.metadata?.lecture_id === lectureId);
      
      if (lectureNote && lectureNote.metadata?.note_text) {
        setNoteText(lectureNote.metadata.note_text);
        setInitialText(lectureNote.metadata.note_text);
      } else {
        setNoteText('');
        setInitialText('');
      }
    };

    fetchNote();
  }, [lectureId, courseId, userId, supabase]);

  const handleSave = async () => {
    if (noteText === initialText) return;
    
    setIsSaving(true);
    
    const { error } = await supabase.from('user_events').insert({
      user_id: userId,
      event_type: 'note',
      course_id: courseId,
      metadata: {
        lecture_id: lectureId,
        note_text: noteText,
        timestamp: new Date().toISOString()
      }
    });

    setIsSaving(false);

    if (error) {
      toast.error('Failed to save notes');
    } else {
      toast.success('Notes saved successfully');
      setInitialText(noteText);
    }
  };

  const hasChanged = noteText !== initialText;

  return (
    <div className="w-full h-full flex flex-col pt-4">
      {/* TITLEBAR (Simulated inside the wrapper injected by parent) */}
      <div className="px-4 pb-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex gap-1.5 items-center">
          <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
          <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
          <div className="h-2 w-2 rounded-full bg-[#28C840]" />
        </div>
        <span className="text-[12px] text-gray-500 font-medium">Notes</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
          <X className="w-[14px] h-[14px]" />
        </button>
      </div>

      <div className="p-5 flex flex-col flex-1 h-full">
        <p className="text-[11px] text-gray-500 font-medium truncate mb-3">
          {lectureTitle}
        </p>

        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Type your notes here..."
          className="flex-1 w-full bg-white border border-gray-200 rounded-xl p-4 text-[13px] text-gray-900 resize-none outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-200 transition-all shadow-sm"
        />

        <button
          onClick={handleSave}
          disabled={!hasChanged || isSaving}
          className={`mt-4 w-full py-2.5 rounded-lg text-[13px] font-medium transition-all ${
            hasChanged 
              ? 'bg-gray-900 text-white hover:bg-gray-800' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isSaving ? 'Saving...' : 'Save Notes'}
        </button>
      </div>
    </div>
  );
}
