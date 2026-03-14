'use client';

import { useState, useRef } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import TrafficLights from '@/components/auth/TrafficLights';
import { cn } from '@/lib/utils';

interface Props {
  course: any;
  categories: { id: string; name: string; slug: string }[];
  onUpdate: (data: Partial<any>) => void;
  setSaveStatus: (s: 'idle' | 'saving' | 'saved' | 'error') => void;
  setLastSaved: (d: Date) => void;
}

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
const LANGUAGES = [{ value: 'en', label: 'English' }, { value: 'ta', label: 'தமிழ்' }];

function MacCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
      <div className="flex h-11 items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
        <TrafficLights size="sm" />
        <span className="ml-3 text-[13px] font-semibold text-[#1D1D1F]">{title}</span>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-semibold text-[#1D1D1F]">{label}</label>
      {hint && <p className="mb-2 text-[12px] text-[#6E6E73]">{hint}</p>}
      {children}
    </div>
  );
}

const inputCls = 'w-full rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#F5F5F7] px-4 py-2.5 text-[14px] text-[#1D1D1F] placeholder:text-[#AEAEB2] focus:border-[rgba(0,0,0,0.2)] focus:outline-none';

export function BasicInfoForm({ course, categories, onUpdate, setSaveStatus, setLastSaved }: Props) {
  const supabase = createClient();
  const [title, setTitle] = useState(course.title === 'Untitled Course' ? '' : (course.title ?? ''));
  const [titleTa, setTitleTa] = useState(course.title_ta ?? '');
  const [subtitle, setSubtitle] = useState(course.subtitle ?? '');
  const [description, setDescription] = useState(course.description ?? '');
  const [category, setCategory] = useState(course.category_id ?? '');
  const [difficulty, setDifficulty] = useState(course.difficulty ?? 'beginner');
  const [language, setLanguage] = useState(course.language ?? 'en');
  const [tags, setTags] = useState<string[]>(course.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [outcomes, setOutcomes] = useState<string[]>(course.what_you_learn ?? ['', '', '', '']);
  const [outcomeErrors, setOutcomeErrors] = useState<Record<number, string>>({});
  const [requirements, setRequirements] = useState<string[]>(course.requirements ?? ['']);

  const NOTIFY_FIELDS = ['title', 'description', 'subtitle', 'title_ta'];

  const save = async (field: string, value: unknown) => {
    setSaveStatus('saving');
    onUpdate({ [field]: value });
    const { error } = await supabase
      .from('courses')
      .update({ [field]: value })
      .eq('id', course.id);
    if (error) { setSaveStatus('error'); return; }
    setSaveStatus('saved');
    setLastSaved(new Date());

    // Notify enrolled students on meaningful content changes
    if (NOTIFY_FIELDS.includes(field)) {
      const courseTitle = field === 'title' ? (value as string) : (course.title ?? 'Your Course');
      const fieldLabels: Record<string, string> = {
        title: 'course title', description: 'course description',
        subtitle: 'course subtitle', title_ta: 'course title (Tamil)',
      };
      fetch('/api/notify-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          type: 'course_update',
          title: `Course Updated — ${courseTitle}`,
          message: `The ${fieldLabels[field] ?? field} of "${courseTitle}" has been updated.`,
          actionUrl: `/student/courses/${course.id}`,
          metadata: { field, course_id: course.id },
        }),
      }).catch(console.error); // fire-and-forget
    }
  };

  const addTag = () => {
    if (!tagInput.trim() || tags.includes(tagInput.trim())) return;
    const next = [...tags, tagInput.trim()];
    setTags(next);
    setTagInput('');
    save('tags', next);
  };

  const removeTag = (t: string) => {
    const next = tags.filter((x) => x !== t);
    setTags(next);
    save('tags', next);
  };

  const updateOutcome = (i: number, v: string) => {
    const next = [...outcomes]; next[i] = v; setOutcomes(next);
    if (v.trim() !== '') {
      setOutcomeErrors(prev => { const nextErr = {...prev}; delete nextErr[i]; return nextErr; });
    }
  };
  const addOutcome = () => setOutcomes([...outcomes, '']);
  const removeOutcome = (i: number) => { 
    const next = outcomes.filter((_, idx) => idx !== i); 
    setOutcomes(next); 
    
    // Shift errors down
    setOutcomeErrors(prev => {
      const nextErr: Record<number, string> = {};
      Object.keys(prev).forEach(key => {
        const k = parseInt(key);
        if (k < i) nextErr[k] = prev[k];
        if (k > i) nextErr[k - 1] = prev[k];
      });
      return nextErr;
    });

    const validOutcomes = next.filter(o => o.trim() !== '');
    save('what_you_learn', validOutcomes.length > 0 ? validOutcomes : null); 
  };
  
  const validateAndSaveOutcomes = (index: number) => {
    const val = outcomes[index];
    if (val.trim() === '') {
      setOutcomeErrors(prev => ({ ...prev, [index]: 'Learning outcome cannot be empty.' }));
      return;
    }
    const validOutcomes = outcomes.filter(o => o.trim() !== '');
    if (validOutcomes.length > 0) {
      save('what_you_learn', validOutcomes);
    }
  };

  const updateRequirement = (i: number, v: string) => {
    const next = [...requirements]; next[i] = v; setRequirements(next);
  };
  const addRequirement = () => setRequirements([...requirements, '']);
  const removeRequirement = (i: number) => { const next = requirements.filter((_, idx) => idx !== i); setRequirements(next); save('requirements', next); };

  return (
    <div>
      <h2 className="mb-6 font-sans text-[22px] font-bold text-[#1D1D1F]">Basic Information</h2>

      <MacCard title="Course Details">
        <div className="space-y-5">
          {/* Title */}
          <Field label="Course Title *">
            <div className="relative">
              <input
                className={inputCls}
                value={title}
                maxLength={100}
                placeholder="e.g. Next.js 15 Full Stack Masterclass"
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  const t = title || 'Untitled Course';
                  if (t !== (course.title || 'Untitled Course')) save('title', t);
                }}
              />
              <span className="absolute right-3 top-2.5 text-[11px] text-[#AEAEB2]">{title.length}/100</span>
            </div>
          </Field>

          <Field label="Course Title in Tamil (Optional)">
            <input
              className={inputCls}
              value={titleTa}
              placeholder="தமிழில் தலைப்பு"
              onChange={(e) => setTitleTa(e.target.value)}
              onBlur={() => {
                if (titleTa !== (course.title_ta || '')) save('title_ta', titleTa);
              }}
            />
          </Field>

          <Field label="Subtitle *">
            <div className="relative">
              <input
                className={inputCls}
                value={subtitle}
                maxLength={200}
                placeholder="A brief description shown in search results"
                onChange={(e) => setSubtitle(e.target.value)}
                onBlur={() => {
                  if (subtitle !== (course.subtitle || '')) save('subtitle', subtitle);
                }}
              />
              <span className="absolute right-3 top-2.5 text-[11px] text-[#AEAEB2]">{subtitle.length}/200</span>
            </div>
          </Field>

          <Field label="Description *" hint="Explain what students will learn, who it's for, and why they should take this course. (min 200 chars)">
            <textarea
              className={cn(inputCls, 'resize-none')}
              rows={6}
              value={description}
              placeholder="Write a detailed course description..."
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => {
                if (description !== (course.description || '')) save('description', description);
              }}
            />
            <span className="mt-1 block text-right text-[11px] text-[#AEAEB2]">{description.length} chars</span>
          </Field>

          {/* Category */}
          <Field label="Category *">
            <select
              className={inputCls}
              value={category}
              onChange={(e) => { setCategory(e.target.value); save('category_id', e.target.value); }}
            >
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>

          {/* Difficulty */}
          <Field label="Difficulty Level *">
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => { setDifficulty(d); save('difficulty', d); }}
                  className={cn(
                    'rounded-full border px-4 py-2 text-[13px] capitalize',
                    difficulty === d
                      ? 'bg-[#1D1D1F] text-white border-transparent'
                      : 'border-[rgba(0,0,0,0.08)] bg-[#F5F5F7] text-[#6E6E73] hover:border-[rgba(0,0,0,0.2)]'
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </Field>

          {/* Language */}
          <Field label="Language *">
            <div className="flex gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.value}
                  onClick={() => { setLanguage(l.value); save('language', l.value); }}
                  className={cn(
                    'rounded-full border px-4 py-2 text-[13px]',
                    language === l.value
                      ? 'bg-[#1D1D1F] text-white border-transparent'
                      : 'border-[rgba(0,0,0,0.08)] bg-[#F5F5F7] text-[#6E6E73] hover:border-[rgba(0,0,0,0.2)]'
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </Field>

          {/* Tags */}
          <Field label="Tags (Optional)" hint="Helps students find your course">
            <div className="flex flex-wrap gap-2 rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#F5F5F7] p-3">
              {tags.map((t) => (
                <span key={t} className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[12px] font-medium text-[#1D1D1F] shadow-sm">
                  {t}
                  <button onClick={() => removeTag(t)} className="text-[#AEAEB2] hover:text-[#FF5F57]">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder={tags.length === 0 ? 'Add relevant tags... (press Enter)' : ''}
                className="flex-1 bg-transparent text-[13px] text-[#1D1D1F] placeholder:text-[#AEAEB2] focus:outline-none min-w-[140px]"
              />
            </div>
          </Field>
        </div>
      </MacCard>

      {/* Learning Outcomes */}
      <MacCard title="What You Will Learn">
        <div className="space-y-2">
          {outcomes.map((o, i) => (
            <div key={i}>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0 text-[#28C840]" />
                <input
                  className={cn(inputCls, 'flex-1', outcomeErrors[i] && 'border-[#FF5F57] focus:border-[#FF5F57]')}
                  value={o}
                  placeholder="Students will be able to..."
                  onChange={(e) => updateOutcome(i, e.target.value)}
                  onBlur={() => validateAndSaveOutcomes(i)}
                />
                {outcomes.length > 1 && (
                  <button onClick={() => removeOutcome(i)} className="text-[#AEAEB2] hover:text-[#FF5F57]">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {outcomeErrors[i] && (
                <p className="mt-1.5 ml-6 text-[11px] font-medium text-[#FF5F57]">{outcomeErrors[i]}</p>
              )}
            </div>
          ))}
          <button
            onClick={addOutcome}
            className="mt-2 text-[13px] font-semibold text-[#1D1D1F] hover:underline"
          >
            + Add learning outcome
          </button>
        </div>
      </MacCard>

      {/* Requirements */}
      <MacCard title="Requirements (Optional)">
        <div className="space-y-2">
          {requirements.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className={cn(inputCls, 'flex-1')}
                value={r}
                placeholder="e.g. Basic JavaScript knowledge"
                onChange={(e) => updateRequirement(i, e.target.value)}
                onBlur={() => save('requirements', requirements)}
              />
              {requirements.length > 1 && (
                <button onClick={() => removeRequirement(i)} className="text-[#AEAEB2] hover:text-[#FF5F57]">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addRequirement}
            className="mt-2 text-[13px] font-semibold text-[#1D1D1F] hover:underline"
          >
            + Add requirement
          </button>
        </div>
      </MacCard>
    </div>
  );
}
