'use client';

import { useEffect, useState } from 'react';
import { X, Play, FileText, CheckSquare, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import TrafficLights from '@/components/auth/TrafficLights';
import { cn } from '@/lib/utils';
import {
  addLectureAction,
  updateLectureAction,
  fetchQuizQuestionsAction,
  addQuizQuestionAction,
  updateQuizQuestionAction,
  deleteQuizQuestionAction,
} from '@/actions/curriculum';

type LectureType = 'video' | 'article' | 'quiz';

interface QuizQuestion {
  id?: string;
  question: string;
  question_text?: string | null; // DB fallback column
  options: string[]; // always 4 options
  correct_answer: number; // index 0–3
  explanation: string;
  sort_order: number;
  _dirty?: boolean;
  _new?: boolean;
}

interface Lecture {
  id?: string; title?: string; title_ta?: string; type?: LectureType;
  video_url?: string; video_duration_secs?: number; article_content?: string;
  is_free_preview?: boolean; read_time_mins?: number; quiz_duration_mins?: number;
}

interface Props {
  open: boolean; sectionId: string; courseId: string;
  lecture?: Lecture | null; lectureCount: number;
  onClose: () => void; onSaved: () => void;
}

const TYPE_OPTIONS: { value: LectureType; label: string; icon: React.ReactNode }[] = [
  { value: 'video', label: 'Video', icon: <Play className="h-4 w-4" /> },
  { value: 'article', label: 'Article', icon: <FileText className="h-4 w-4" /> },
  { value: 'quiz', label: 'Quiz', icon: <CheckSquare className="h-4 w-4" /> },
];

const inputCls = 'w-full rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#F5F5F7] px-4 py-2.5 text-[14px] text-[#1D1D1F] placeholder:text-[#AEAEB2] focus:outline-none focus:border-[rgba(0,0,0,0.2)]';
const OPTION_LABELS = ['A', 'B', 'C', 'D'];

const emptyQuestion = (sortOrder: number): QuizQuestion => ({
  question: '',
  options: ['', '', '', ''],
  correct_answer: 0,
  explanation: '',
  sort_order: sortOrder,
  _dirty: true,
  _new: true,
});

export function AddLectureModal({ open, sectionId, courseId, lecture, lectureCount, onClose, onSaved }: Props) {
  const isEdit = !!lecture?.id;

  const [type, setType] = useState<LectureType>(lecture?.type ?? 'video');
  const [title, setTitle] = useState(lecture?.title ?? '');
  const [titleTa, setTitleTa] = useState(lecture?.title_ta ?? '');
  const [videoUrl, setVideoUrl] = useState(lecture?.video_url ?? '');
  const [duration, setDuration] = useState<number>(lecture?.video_duration_secs ?? 0);
  const [content, setContent] = useState(lecture?.article_content ?? '');
  const [readTime, setReadTime] = useState<number>(lecture?.read_time_mins ?? 0);
  const [quizDuration, setQuizDuration] = useState<number>(lecture?.quiz_duration_mins ?? 10);
  const [isFree, setIsFree] = useState(lecture?.is_free_preview ?? false);
  const [saving, setSaving] = useState(false);

  // Quiz questions state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loadingQ, setLoadingQ] = useState(false);
  const [expandedQ, setExpandedQ] = useState<number | null>(0);

  useEffect(() => {
    if (lecture) {
      setType(lecture.type ?? 'video');
      setTitle(lecture.title ?? '');
      setTitleTa(lecture.title_ta ?? '');
      setVideoUrl(lecture.video_url ?? '');
      setDuration(lecture.video_duration_secs ?? 0);
      setContent(lecture.article_content ?? '');
      setReadTime(lecture.read_time_mins ?? 0);
      setQuizDuration(lecture.quiz_duration_mins ?? 10);
      setIsFree(lecture.is_free_preview ?? false);
    } else {
      setType('video'); setTitle(''); setTitleTa('');
      setVideoUrl(''); setDuration(0); setContent('');
      setReadTime(0); setQuizDuration(10); setIsFree(false);
    }
    setQuestions([]);
  }, [lecture, open]);

  // Load existing quiz questions when editing a quiz
  useEffect(() => {
    if (open && isEdit && lecture?.id && lecture.type === 'quiz') {
      setLoadingQ(true);
      fetchQuizQuestionsAction(lecture.id)
        .then((data) => {
          if (data.length === 0) {
            setQuestions([emptyQuestion(0)]);
          } else {
            setQuestions(data.map((q: any) => ({
              ...q,
              // Normalise options: DB may return {label,value}[] — flatten to string[]
              options: (q.options ?? ['', '', '', '']).map((o: any) =>
                typeof o === 'string' ? o : (o?.label ?? '')
              ),
              _dirty: false,
              _new: false,
            })));
          }
        })
        .catch(() => setQuestions([emptyQuestion(0)]))
        .finally(() => setLoadingQ(false));
    } else if (open && type === 'quiz' && questions.length === 0) {
      setQuestions([emptyQuestion(0)]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit]);

  // Add empty question when switching to quiz tab fresh
  useEffect(() => {
    if (type === 'quiz' && questions.length === 0) {
      setQuestions([emptyQuestion(0)]);
    }
  }, [type]);

  // ── Question helpers ──────────────────────────────────────
  const updateQuestion = (idx: number, field: keyof QuizQuestion, value: any) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value, _dirty: true } : q));
  };
  const updateOption = (qIdx: number, optIdx: number, value: string) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const opts = [...q.options];
      opts[optIdx] = value;
      return { ...q, options: opts, _dirty: true };
    }));
  };
  const addQuestion = () => {
    const next = [...questions, emptyQuestion(questions.length)];
    setQuestions(next);
    setExpandedQ(next.length - 1);
  };
  const removeQuestion = async (idx: number) => {
    const q = questions[idx];
    if (q.id) {
      await deleteQuizQuestionAction(q.id);
    }
    setQuestions(prev => prev.filter((_, i) => i !== idx).map((q, i) => ({ ...q, sort_order: i })));
    setExpandedQ(null);
  };

  // ── Save ─────────────────────────────────────────────────
  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);

    const payload = {
      course_id: courseId,
      section_id: sectionId,
      title: title.trim(),
      title_ta: titleTa || null,
      type,
      video_url: type === 'video' ? videoUrl || null : null,
      video_duration_secs: type === 'video' ? duration || null : null,
      article_content: type === 'article' ? content || null : null,
      read_time_mins: type === 'article' ? readTime || null : null,
      quiz_duration_mins: type === 'quiz' ? quizDuration || null : null,
      is_free_preview: isFree,
    };

    try {
      let lectureId = lecture?.id;
      if (isEdit && lectureId) {
        await updateLectureAction(lectureId, payload);
      } else {
        const result = await addLectureAction(sectionId, courseId, { ...payload, is_published: false, sort_order: lectureCount });
        lectureId = result?.id;
      }

      // Save quiz questions
      if (type === 'quiz' && lectureId) {
        for (const q of questions) {
          if (!q.question.trim()) continue;
          const qData = {
            question: q.question.trim(),
            options: q.options,
            correct_answer: q.correct_answer,
            explanation: q.explanation || undefined,
            sort_order: q.sort_order,
          };
          if (q._new) {
            await addQuizQuestionAction(lectureId, qData);
          } else if (q._dirty && q.id) {
            await updateQuizQuestionAction(q.id, qData);
          }
        }
      }

      onSaved();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to save lecture');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const isQuizValid = type !== 'quiz' || questions.some(q => {
    const qText = (q.question ?? q.question_text ?? '') as string;
    const filledOpts = (q.options ?? []).filter((o: any) => {
      const str = typeof o === 'string' ? o : ((o as any)?.label ?? '');
      return (str ?? '').trim().length > 0;
    });
    return qText.trim().length > 0 && filledOpts.length >= 2;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex h-11 shrink-0 items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
          <TrafficLights size="sm" />
          <span className="ml-3 flex-1 text-[13px] font-semibold text-[#1D1D1F]">
            {isEdit ? 'Edit Lecture' : 'Add Lecture'}
          </span>
          <button onClick={onClose} className="text-[#AEAEB2] hover:text-[#1D1D1F]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {/* Type selector */}
          <div>
            <label className="mb-2 block text-[13px] font-semibold text-[#1D1D1F]">Lecture Type</label>
            <div className="flex gap-2">
              {TYPE_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-medium transition-all border',
                    type === t.value
                      ? 'bg-[#1D1D1F] text-white border-transparent'
                      : 'border-[rgba(0,0,0,0.08)] bg-[#F5F5F7] text-[#6E6E73] hover:border-[rgba(0,0,0,0.15)]'
                  )}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[#1D1D1F]">Title *</label>
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Lecture title..." />
          </div>

          {/* Title Tamil */}
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[#1D1D1F]">Title in Tamil (Optional)</label>
            <input className={inputCls} value={titleTa} onChange={(e) => setTitleTa(e.target.value)} placeholder="தமிழில் தலைப்பு..." />
          </div>

          {/* ── VIDEO ─────────────────────────── */}
          {type === 'video' && (
            <>
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#1D1D1F]">Video URL</label>
                <input className={inputCls} value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/... or Vimeo" />
                <p className="mt-1 text-[11px] text-[#AEAEB2]">Paste a YouTube, Vimeo, or direct video URL.</p>
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#1D1D1F]">Duration (seconds)</label>
                <input className={inputCls} type="number" value={duration || ''} onChange={(e) => setDuration(parseInt(e.target.value) || 0)} placeholder="e.g. 480 for 8 minutes" />
              </div>
            </>
          )}

          {/* ── ARTICLE ───────────────────────── */}
          {type === 'article' && (
            <>
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#1D1D1F]">Content (Markdown supported)</label>
                <textarea className={cn(inputCls, 'resize-none')} rows={5} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write article content here..." />
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#1D1D1F]">Estimated Read Time (mins)</label>
                <input
                  className={inputCls}
                  type="number"
                  min={1}
                  value={readTime || ''}
                  onChange={(e) => setReadTime(parseInt(e.target.value) || 0)}
                  placeholder="e.g. 5"
                />
              </div>
            </>
          )}

          {/* ── QUIZ ──────────────────────────── */}
          {type === 'quiz' && (
            <div className="space-y-3">
              {/* Quiz duration */}
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#1D1D1F]">Quiz Duration (mins)</label>
                <input
                  className={inputCls}
                  type="number"
                  min={1}
                  value={quizDuration || ''}
                  onChange={(e) => setQuizDuration(parseInt(e.target.value) || 0)}
                  placeholder="e.g. 10"
                />
              </div>

              {/* Questions */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-[13px] font-semibold text-[#1D1D1F]">
                    Questions <span className="ml-1 text-[11px] font-normal text-[#AEAEB2]">({questions.length})</span>
                  </label>
                </div>

                {loadingQ ? (
                  <p className="py-4 text-center text-[13px] text-[#AEAEB2]">Loading questions...</p>
                ) : (
                  <div className="space-y-2">
                    {questions.map((q, qi) => (
                      <div key={qi} className="overflow-hidden rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#F5F5F7]">
                        {/* Question header – div avoids nested button HTML violation */}
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => setExpandedQ(expandedQ === qi ? null : qi)}
                          onKeyDown={(e) => e.key === 'Enter' && setExpandedQ(expandedQ === qi ? null : qi)}
                          className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left select-none"
                        >
                          <span className="text-[13px] font-medium text-[#1D1D1F] truncate pr-2">
                            Q{qi + 1}. {q.question || <span className="text-[#AEAEB2] font-normal">Untitled question</span>}
                          </span>
                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); removeQuestion(qi); }}
                              className="text-[#AEAEB2] hover:text-[#FF5F57] transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            {expandedQ === qi ? <ChevronUp className="h-4 w-4 text-[#AEAEB2]" /> : <ChevronDown className="h-4 w-4 text-[#AEAEB2]" />}
                          </div>
                        </div>

                        {/* Question body */}
                        {expandedQ === qi && (
                          <div className="border-t border-[rgba(0,0,0,0.06)] bg-white px-4 pb-4 pt-3 space-y-3">
                            <textarea
                              className={cn(inputCls, 'resize-none')}
                              rows={2}
                              value={q.question ?? ''}
                              onChange={(e) => updateQuestion(qi, 'question', e.target.value)}
                              placeholder="Enter question..."
                            />

                            {/* Options */}
                            <div className="space-y-2">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#AEAEB2]">Options — click radio to mark correct</p>
                              {q.options.map((opt, oi) => (
                                <div key={oi} className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => updateQuestion(qi, 'correct_answer', oi)}
                                    className={cn(
                                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold transition-all',
                                      q.correct_answer === oi
                                        ? 'border-transparent bg-[#28C840] text-white'
                                        : 'border-[rgba(0,0,0,0.15)] bg-[#F5F5F7] text-[#6E6E73] hover:border-[#28C840]'
                                    )}
                                  >
                                    {OPTION_LABELS[oi]}
                                  </button>
                                  <input
                                    className={cn(inputCls, 'flex-1 py-2 text-[13px]')}
                                    value={opt}
                                    onChange={(e) => updateOption(qi, oi, e.target.value)}
                                    placeholder={`Option ${OPTION_LABELS[oi]}...`}
                                  />
                                </div>
                              ))}
                            </div>

                            {/* Explanation */}
                            <div>
                              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#AEAEB2]">Explanation (optional)</p>
                              <textarea
                                className={cn(inputCls, 'resize-none')}
                                rows={2}
                                value={q.explanation}
                                onChange={(e) => updateQuestion(qi, 'explanation', e.target.value)}
                                placeholder="Explain why this answer is correct..."
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addQuestion}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[rgba(0,0,0,0.15)] py-3 text-[13px] font-semibold text-[#6E6E73] hover:border-[#1D1D1F] hover:text-[#1D1D1F] transition-colors"
                    >
                      <Plus className="h-4 w-4" /> Add Question
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Free preview */}
          <div className="flex items-center justify-between rounded-xl bg-[#F5F5F7] p-3">
            <div>
              <p className="text-[13px] font-medium text-[#1D1D1F]">Free Preview</p>
              <p className="text-[11px] text-[#6E6E73]">Let students watch this before enrolling</p>
            </div>
            <button
              onClick={() => setIsFree(!isFree)}
              className={cn(
                'h-6 w-11 rounded-full transition-colors',
                isFree ? 'bg-[#28C840]' : 'bg-[rgba(0,0,0,0.12)]'
              )}
            >
              <div className={cn('h-5 w-5 rounded-full bg-white shadow transition-transform mx-0.5', isFree ? 'translate-x-5' : 'translate-x-0')} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 gap-3 border-t border-[rgba(0,0,0,0.06)] px-6 py-4">
          <button onClick={onClose} className="flex-1 rounded-xl border border-[rgba(0,0,0,0.08)] py-2.5 text-[13px] font-semibold text-[#6E6E73] hover:bg-[#F5F5F7]">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving || !isQuizValid}
            className="flex-1 rounded-xl bg-[#1D1D1F] py-2.5 text-[13px] font-semibold text-white transition-all hover:opacity-80 disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Save Lecture'}
          </button>
        </div>
      </div>
    </div>
  );
}
