'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  questionId: string;
  courseId: string;
  lectureId: string | null;
  instructorId: string;
  authorId: string;
  question: any;
  onSubmit: (body: string) => void;
  onCancel: () => void;
}

export function AnswerEditor({
  questionId,
  courseId,
  lectureId,
  instructorId,
  authorId,
  question,
  onSubmit,
  onCancel,
}: Props) {
  const [answerText, setAnswerText] = useState('');
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-expand textarea
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAnswerText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const submitAnswer = async () => {
    const body = answerText.trim();
    if (!body || loading) return;
    setLoading(true);

    // 1. Insert reply
    await supabase
      .from('course_qa')
      .insert({
        course_id: courseId,
        lecture_id: lectureId,
        author_id: instructorId,
        body,
        parent_id: questionId,
      })
      .select()
      .single();

    // 2. Mark question as answered and increment reply_count
    await supabase
      .from('course_qa')
      .update({
        is_answered: true,
        reply_count: (question?.reply_count ?? 0) + 1,
      })
      .eq('id', questionId);

    // 3. Notify student
    if (authorId) {
      await supabase.from('notifications').insert({
        user_id: authorId,
        title: 'Your question was answered!',
        message: 'An instructor replied to your question.',
        type: 'qa_reply',
        action_url: `/student/courses/${courseId}`,
        metadata: { question_id: questionId, course_id: courseId },
        is_read: false,
      });
    }

    onSubmit(body);
    setAnswerText('');
    setLoading(false);
  };

  return (
    <div className="flex items-start gap-3">
      {/* Instructor avatar placeholder */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1D1D1F] text-[11px] font-bold text-white">
        I
      </div>

      <div className="flex-1">
        <textarea
          ref={textareaRef}
          value={answerText}
          onChange={handleChange}
          placeholder="Write your answer..."
          rows={3}
          className="w-full resize-none overflow-hidden rounded-xl border border-[rgba(0,0,0,0.1)] bg-white px-4 py-3 text-[13px] text-[#1D1D1F] placeholder:text-[#AEAEB2] focus:border-[rgba(0,0,0,0.25)] focus:outline-none"
          style={{ minHeight: '88px' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitAnswer();
            if (e.key === 'Escape') onCancel();
          }}
        />

        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] italic text-[#AEAEB2]">Markdown supported · Cmd+Enter to post</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="rounded-full px-4 py-1.5 text-[12px] text-[#6E6E73] hover:text-[#1D1D1F] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={submitAnswer}
              disabled={!answerText.trim() || loading}
              className="rounded-full bg-[#1D1D1F] px-4 py-1.5 text-[12px] font-semibold text-white transition-opacity disabled:opacity-40 hover:opacity-80"
            >
              {loading ? 'Posting…' : 'Post Answer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
