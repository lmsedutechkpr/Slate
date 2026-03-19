'use client';

import { useState, useCallback } from 'react';
import { CourseEditorSidebar } from './CourseEditorSidebar';
import { BasicInfoForm } from './BasicInfoForm';
import { CurriculumBuilder } from './CurriculumBuilder';
import { CourseMediaForm } from './CourseMediaForm';
import { PricingForm } from './PricingForm';
import { PublishPanel } from './PublishPanel';

interface Props {
  course: any;
  categories: { id: string; name: string; slug: string }[];
  commissionRate: number;
  userId: string;
  listPath?: string;
  backLabel?: string;
}

// Steps that are considered "complete" based on course data
function computeCompleted(course: any): Set<number> {
  const s = new Set<number>();
  if (course.title && course.title !== 'Untitled Course' && course.description) s.add(1);
  if ((course.total_lectures ?? 0) >= 1) s.add(2);
  if (course.thumbnail_url) s.add(3);
  if (course.is_free || course.price > 0) s.add(4);
  return s;
}

export function CourseEditorClient({
  course: initialCourse,
  categories,
  commissionRate,
  userId,
  listPath = '/instructor/courses',
  backLabel = 'Course Builder',
}: Props) {
  const [step, setStep] = useState(1);
  const [course, setCourse] = useState(initialCourse);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const completedSteps = computeCompleted(course);

  const handleCourseUpdate = (updates: Partial<any>) => {
    setCourse((prev: any) => ({ ...prev, ...updates }));
  };

  const handleSaveDraft = async () => {
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
      setLastSaved(new Date());
    }, 600);
  };

  const stepComponents: Record<number, React.ReactNode> = {
    1: (
      <BasicInfoForm
        course={course}
        categories={categories}
        onUpdate={handleCourseUpdate}
        setSaveStatus={setSaveStatus}
        setLastSaved={setLastSaved}
      />
    ),
    2: (
      <CurriculumBuilder
        courseId={course.id}
        onUpdate={handleCourseUpdate}
      />
    ),
    3: (
      <CourseMediaForm
        course={course}
        onUpdate={handleCourseUpdate}
        setSaveStatus={setSaveStatus}
        setLastSaved={setLastSaved}
      />
    ),
    4: (
      <PricingForm
        course={course}
        commissionRate={commissionRate}
        onUpdate={handleCourseUpdate}
        setSaveStatus={setSaveStatus}
        setLastSaved={setLastSaved}
      />
    ),
    5: (
      <PublishPanel
        course={course}
        courseId={course.id}
        categories={categories}
        listPath={listPath}
      />
    ),
  };

  return (
    <div className="flex h-full min-h-0 w-full">
      <CourseEditorSidebar
        currentStep={step}
        completedSteps={completedSteps}
        courseTitle={course.title}
        onStepChange={setStep}
        onSaveDraft={handleSaveDraft}
        saveStatus={saveStatus}
        lastSaved={lastSaved}
        backPath={listPath}
        backLabel={backLabel}
      />
      <main className="h-full min-w-0 flex-1 overflow-y-auto p-8">
        {stepComponents[step]}
      </main>
    </div>
  );
}
