'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Play, FileText, CheckSquare, ChevronRight, ChevronLeft } from 'lucide-react';
import type { CourseItem, CourseLecture } from './types';

function lectureDurationLabel(lecture: CourseLecture) {
  if (lecture.type === 'video' && typeof lecture.video_duration_secs === 'number' && lecture.video_duration_secs > 0) {
    return `${Math.ceil(lecture.video_duration_secs / 60)}m`;
  }
  if (lecture.type === 'article' && typeof lecture.read_time_mins === 'number' && lecture.read_time_mins > 0) {
    return `${lecture.read_time_mins}m read`;
  }
  if (lecture.type === 'quiz' && typeof lecture.quiz_duration_mins === 'number' && lecture.quiz_duration_mins > 0) {
    return `${lecture.quiz_duration_mins}m`;
  }
  return '-';
}

function resolveYoutubeEmbed(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '').trim();
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    return null;
  }
  return null;
}

function normalizeOptionLabel(option: { label?: string | null; value?: string | null } | string) {
  if (typeof option === 'string') return option;
  return option?.label || option?.value || '';
}

function isCorrectOption(
  option: { label?: string | null; value?: string | null } | string,
  idx: number,
  correctAnswer: string | null | undefined
) {
  const expected = String(correctAnswer ?? '');
  if (!expected) return false;
  if (typeof option === 'string') return String(idx) === expected;
  if (option?.value != null) return String(option.value) === expected;
  return String(idx) === expected;
}

export default function CourseEvaluationPlayer({ course }: { course: CourseItem }) {
  const router = useRouter();
  const sections = useMemo(() => {
    return [...(course.course_sections || [])]
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((section) => ({
        ...section,
        lectures: [...(section.lectures || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
      }));
  }, [course.course_sections]);

  const orderedLectures = useMemo(() => sections.flatMap((section) => section.lectures || []), [sections]);
  const [activeLectureId, setActiveLectureId] = useState<string>(orderedLectures[0]?.id || '');

  const activeLecture = orderedLectures.find((lecture) => lecture.id === activeLectureId) || null;
  const activeIndex = orderedLectures.findIndex((lecture) => lecture.id === activeLectureId);

  const prevLecture = activeIndex > 0 ? orderedLectures[activeIndex - 1] : null;
  const nextLecture = activeIndex >= 0 && activeIndex < orderedLectures.length - 1 ? orderedLectures[activeIndex + 1] : null;

  return (
    <div className="pb-10 font-[DM_Sans]">
      <button
        type="button"
        onClick={() => router.push(`/admin/courses/${course.id}`)}
        className="mb-4 inline-flex items-center gap-2 text-[13px] font-semibold text-[#1D1D1F]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Course Review
      </button>

      <h1 className="text-[26px] font-bold text-[#1D1D1F]">Full Course Evaluation</h1>
      <p className="mt-1 text-[13px] text-[#6E6E73]">Attend all sections and lectures exactly as a learner would before moderation decisions.</p>

      <div className="mt-5 grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="max-h-[calc(100vh-9rem)] overflow-y-auto rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-3 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
          {sections.length === 0 ? (
            <p className="p-2 text-[12px] text-[#AEAEB2]">No curriculum found.</p>
          ) : null}

          <div className="space-y-2">
            {sections.map((section) => (
              <div key={section.id} className="rounded-xl border border-[rgba(0,0,0,0.05)] bg-[#FAFAFA] p-2">
                <p className="px-1 pb-1 text-[12px] font-semibold text-[#1D1D1F]">{section.title}</p>
                <div className="space-y-1">
                  {(section.lectures || []).map((lecture) => {
                    const isActive = lecture.id === activeLectureId;
                    const Icon = lecture.type === 'video' ? Play : lecture.type === 'article' ? FileText : CheckSquare;
                    return (
                      <button
                        key={lecture.id}
                        type="button"
                        onClick={() => setActiveLectureId(lecture.id)}
                        className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-left ${
                          isActive ? 'bg-[#1D1D1F] text-white' : 'bg-white text-[#1D1D1F]'
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate text-[12px]">{lecture.title}</span>
                        </span>
                        <span className={`shrink-0 text-[10px] ${isActive ? 'text-white/80' : 'text-[#AEAEB2]'}`}>
                          {lectureDurationLabel(lecture)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="min-h-[560px] rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
          {!activeLecture ? (
            <div className="p-6 text-[13px] text-[#6E6E73]">Select a lecture from the left panel.</div>
          ) : (
            <>
              <div className="border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5 py-4">
                <p className="text-[11px] uppercase tracking-wide text-[#AEAEB2]">Now Evaluating</p>
                <h2 className="mt-1 text-[20px] font-bold text-[#1D1D1F]">{activeLecture.title}</h2>
                {activeLecture.title_ta ? <p className="mt-1 text-[12px] text-[#6E6E73]">தமிழ்: {activeLecture.title_ta}</p> : null}
              </div>

              <div className="p-5">
                {activeLecture.type === 'video' ? (
                  <div className="space-y-3">
                    {activeLecture.video_url ? (
                      <>
                        {resolveYoutubeEmbed(activeLecture.video_url) ? (
                          <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
                            <iframe
                              title={activeLecture.title}
                              src={resolveYoutubeEmbed(activeLecture.video_url) || undefined}
                              className="h-full w-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        ) : (
                          <video controls className="w-full rounded-xl bg-black" src={activeLecture.video_url}>
                            Your browser does not support embedded video playback.
                          </video>
                        )}
                        <p className="break-all text-[12px] text-[#6E6E73]">Source: {activeLecture.video_url}</p>
                      </>
                    ) : (
                      <p className="text-[13px] text-[#AEAEB2]">No video URL available for this lecture.</p>
                    )}
                  </div>
                ) : null}

                {activeLecture.type === 'article' ? (
                  <div className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-[#FAFAFA] p-4">
                    <p className="mb-2 text-[12px] font-semibold text-[#1D1D1F]">Full Article Content</p>
                    <div className="max-h-[560px] overflow-y-auto whitespace-pre-wrap text-[13px] leading-relaxed text-[#1D1D1F]">
                      {activeLecture.article_content || 'No article content available.'}
                    </div>
                  </div>
                ) : null}

                {activeLecture.type === 'quiz' ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-[#FAFAFA] p-4 text-[13px] text-[#1D1D1F]">
                      <p>
                        Questions: <span className="font-semibold">{activeLecture.quiz?.question_count || 0}</span>
                      </p>
                      <p>
                        Pass mark: <span className="font-semibold">{activeLecture.quiz?.pass_percentage ?? 60}%</span>
                      </p>
                      <p>
                        Time limit:{' '}
                        <span className="font-semibold">
                          {typeof activeLecture.quiz?.time_limit_mins === 'number' && activeLecture.quiz.time_limit_mins > 0
                            ? `${activeLecture.quiz.time_limit_mins} min`
                            : 'No time limit'}
                        </span>
                      </p>
                    </div>

                    <div className="space-y-3">
                      {(activeLecture.quiz?.questions || []).length === 0 ? (
                        <p className="text-[13px] text-[#AEAEB2]">No quiz questions found.</p>
                      ) : null}

                      {(activeLecture.quiz?.questions || []).map((q, index) => (
                        <div key={q.id} className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-4">
                          <p className="text-[13px] font-semibold text-[#1D1D1F]">
                            Q{index + 1}. {q.question || q.question_text || 'Untitled question'}
                          </p>
                          <div className="mt-2 space-y-1.5">
                            {(q.options || []).map((option, idx) => (
                              <p
                                key={`${q.id}-${idx}`}
                                className={`rounded-lg px-2 py-1 text-[12px] ${
                                  isCorrectOption(option, idx, q.correct_answer)
                                    ? 'bg-[#EDFAF0] text-[#1D1D1F]'
                                    : 'bg-[#F5F5F7] text-[#6E6E73]'
                                }`}
                              >
                                {normalizeOptionLabel(option)}
                              </p>
                            ))}
                          </div>
                          {q.explanation ? <p className="mt-2 text-[12px] text-[#6E6E73]">Explanation: {q.explanation}</p> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-between border-t border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5 py-3">
                <button
                  type="button"
                  disabled={!prevLecture}
                  onClick={() => prevLecture && setActiveLectureId(prevLecture.id)}
                  className="inline-flex items-center gap-1 rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-3 py-2 text-[12px] disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </button>
                <p className="text-[11px] text-[#AEAEB2]">
                  {Math.max(0, activeIndex + 1)} / {orderedLectures.length} lectures
                </p>
                <button
                  type="button"
                  disabled={!nextLecture}
                  onClick={() => nextLecture && setActiveLectureId(nextLecture.id)}
                  className="inline-flex items-center gap-1 rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-3 py-2 text-[12px] disabled:opacity-40"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
