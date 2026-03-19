'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import TrafficLights from '@/components/auth/TrafficLights';

type Step = { id: number; name: string; hint: string };

const STEPS: Step[] = [
  { id: 1, name: 'Basic Info', hint: 'Title, description' },
  { id: 2, name: 'Curriculum', hint: 'Sections & lectures' },
  { id: 3, name: 'Media', hint: 'Thumbnail & video' },
  { id: 4, name: 'Pricing', hint: 'Price & discounts' },
  { id: 5, name: 'Publish', hint: 'Review & submit' },
];

interface Props {
  currentStep: number;
  completedSteps: Set<number>;
  courseTitle: string;
  onStepChange: (step: number) => void;
  onSaveDraft: () => void;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
  backPath?: string;
  backLabel?: string;
}

export function CourseEditorSidebar({
  currentStep,
  completedSteps,
  courseTitle,
  onStepChange,
  onSaveDraft,
  saveStatus,
  lastSaved,
  backPath = '/instructor/courses',
  backLabel = 'Course Builder',
}: Props) {
  const router = useRouter();

  const completionPct = Math.round((completedSteps.size / STEPS.length) * 100);

  const saveLabel =
    saveStatus === 'saving' ? 'Saving...' :
    saveStatus === 'saved' ? `Saved` :
    saveStatus === 'error' ? 'Save failed — retry' : 'Save Draft';

  return (
    <div className="flex h-full w-[240px] shrink-0 flex-col border-r border-[rgba(0,0,0,0.08)] bg-white">
      {/* Top */}
      <div className="p-5">
        <TrafficLights size="sm" />
        <button
          onClick={() => router.push(backPath)}
          className="mt-4 flex items-center gap-2 text-[15px] font-bold text-[#1D1D1F] hover:text-[#6E6E73] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </button>
        <p className="mt-2 line-clamp-2 text-[13px] text-[#6E6E73]">
          {courseTitle || 'Untitled Course'}
        </p>

        {/* Progress */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[rgba(0,0,0,0.06)]">
          <div
            className="h-full rounded-full bg-[#1D1D1F] transition-all"
            style={{ width: `${completionPct}%` }}
          />
        </div>
        <p className="mt-1 text-[10px] text-[#AEAEB2]">{completionPct}% complete</p>
      </div>

      {/* Steps */}
      <nav className="flex-1 px-3 py-4">
        {STEPS.map((step) => {
          const isActive = currentStep === step.id;
          const isComplete = completedSteps.has(step.id);
          return (
            <button
              key={step.id}
              onClick={() => onStepChange(step.id)}
              className={cn(
                'mb-1 flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 transition-all text-left',
                isActive ? 'border-l-2 border-[#1D1D1F] bg-[#F5F5F7]' : 'hover:bg-[#F5F5F7]'
              )}
            >
              {/* Step indicator */}
              <div className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                isComplete ? 'bg-[#28C840] text-white' :
                isActive ? 'bg-[#1D1D1F] text-white' :
                'border-2 border-[rgba(0,0,0,0.1)] text-[#AEAEB2]'
              )}>
                {isComplete ? <Check className="h-3 w-3" /> : step.id}
              </div>
              <div>
                <p className={cn(
                  'text-[13px] font-medium',
                  isActive || isComplete ? 'text-[#1D1D1F]' : 'text-[#6E6E73]'
                )}>
                  {step.name}
                </p>
                <p className="text-[11px] text-[#AEAEB2]">{step.hint}</p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-[rgba(0,0,0,0.06)] p-4">
        <button
          onClick={onSaveDraft}
          className={cn(
            'w-full rounded-xl border border-[rgba(0,0,0,0.08)] py-2 text-[13px] font-semibold transition-all',
            saveStatus === 'error'
              ? 'border-[#FF5F57]/30 text-[#FF5F57]'
              : saveStatus === 'saved'
              ? 'border-[#28C840]/30 text-[#28C840]'
              : 'text-[#1D1D1F] hover:bg-[#F5F5F7]'
          )}
        >
          {saveLabel}
        </button>
        {lastSaved && saveStatus === 'saved' && (
          <p className="mt-2 text-center text-[11px] text-[#AEAEB2]">
            Saved just now
          </p>
        )}
      </div>
    </div>
  );
}
