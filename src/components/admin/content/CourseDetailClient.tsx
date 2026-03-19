'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Award, Check, AlertCircle, ChevronRight, Play, FileText, CheckSquare, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { assignCourseInstructorAction, moderateContentAction } from '@/app/actions/admin';
import ReviewPanel from './ReviewPanel';
import ApprovalActionBar from './ApprovalActionBar';
import type { CourseItem, InstructorOption } from './types';

function formatMinutes(total?: number | null) {
  const mins = total || 0;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function money(course: CourseItem) {
  if (course.is_free) return 'Free';
  return `₹${Math.round(course.discounted_price || course.price || 0).toLocaleString('en-IN')}`;
}

function getCreator(course: CourseItem) {
  const primary = course.course_instructors?.find((row) => row.is_primary);
  const row = (primary || course.course_instructors?.[0])?.profiles;
  const share = (primary || course.course_instructors?.[0])?.revenue_share;
  return {
    id: row?.id || '',
    name: row?.full_name || 'Instructor',
    avatar: row?.avatar_url || null,
    bio: row?.bio || null,
    headline: row?.instructor_profiles?.headline || null,
    totalStudents: row?.instructor_profiles?.total_students || 0,
    totalCourses: row?.instructor_profiles?.total_courses || 0,
    rating: row?.instructor_profiles?.avg_rating || 0,
    share: typeof share === 'number' ? share : 70,
  };
}

function lectureMinutes(lecture: {
  video_duration_secs?: number | null;
  read_time_mins?: number | null;
  quiz_duration_mins?: number | null;
}) {
  if (typeof lecture.video_duration_secs === 'number' && lecture.video_duration_secs > 0) {
    return Math.ceil(lecture.video_duration_secs / 60);
  }
  if (typeof lecture.read_time_mins === 'number' && lecture.read_time_mins > 0) {
    return lecture.read_time_mins;
  }
  if (typeof lecture.quiz_duration_mins === 'number' && lecture.quiz_duration_mins > 0) {
    return lecture.quiz_duration_mins;
  }
  return 0;
}

function trimContent(value?: string | null, max = 180) {
  const text = (value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
}

export default function CourseDetailClient({
  course,
  adminId,
  instructorOptions,
}: {
  course: CourseItem;
  adminId: string;
  instructorOptions: InstructorOption[];
}) {
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [descExpanded, setDescExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [assigningInstructor, setAssigningInstructor] = useState(false);
  const [selectedInstructorId, setSelectedInstructorId] = useState('');

  const creator = getCreator(course);
  const isPending = (course.status || '').toLowerCase() === 'pending';

  const sections = useMemo(() => {
    return [...(course.course_sections || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [course.course_sections]);

  const lectureCount = sections.reduce((acc, s) => acc + (s.lectures?.length || 0), 0);
  const publishedLectureCount = sections.reduce(
    (acc, s) => acc + (s.lectures || []).filter((l) => l.is_published).length,
    0
  );
  const freePreviewCount = sections.reduce(
    (acc, s) => acc + (s.lectures || []).filter((l) => l.is_free_preview).length,
    0
  );
  const realDurationMins = sections.reduce(
    (acc, section) => acc + (section.lectures || []).reduce((inner, lecture) => inner + lectureMinutes(lecture), 0),
    0
  );
  const effectiveDuration = realDurationMins > 0 ? realDurationMins : course.total_duration_mins || 0;
  const effectiveLectureCount = lectureCount > 0 ? lectureCount : course.total_lectures || 0;

  const grossRevenue = Math.round((course.discounted_price || course.price || 0) * (course.total_enrolled || 0));
  const instructorRevenue = Math.round(grossRevenue * ((creator.share || 70) / 100));
  const platformRevenue = Math.max(0, grossRevenue - instructorRevenue);

  const checklist = [
    { label: 'At least 1 section', pass: sections.length >= 1 },
    { label: 'At least 5 published lectures', pass: publishedLectureCount >= 5 },
    { label: 'Thumbnail uploaded', pass: Boolean(course.thumbnail_url) },
    { label: 'Description >= 200 chars', pass: (course.description || '').trim().length >= 200 },
    { label: 'At least 4 learning outcomes', pass: (course.learning_outcomes || []).length >= 4 },
    { label: 'Price set or marked free', pass: Boolean(course.is_free) || Boolean(course.price) },
    { label: 'At least 1 free preview lecture', pass: freePreviewCount >= 1 },
  ];

  const doAction = async (action: 'approve' | 'reject' | 'revoke' | 'pending', note?: string) => {
    setActionLoading(true);
    const result = await moderateContentAction({
      itemId: course.id,
      adminId,
      type: 'course',
      action,
      note,
    });
    setActionLoading(false);

    if (!result.success) {
      toast.error(result.error || 'Action failed');
      return;
    }

    if (action === 'approve') toast.success('Course approved and live!');
    if (action === 'reject') toast.success('Course rejected. Creator notified.');
    if (action === 'revoke') toast.success('Course approval revoked.');
    if (action === 'pending') toast.success('Course moved back to pending review.');

    router.refresh();
  };

  useEffect(() => {
    setSelectedInstructorId(creator.id);
  }, [creator.id]);

  useEffect(() => {
    if (!isPending || sections.length === 0) return;
    setExpandedSections((prev) => {
      const next = { ...prev };
      sections.forEach((section) => {
        next[section.id] = true;
      });
      return next;
    });
  }, [isPending, sections]);

  const assignInstructor = async () => {
    if (!selectedInstructorId) {
      toast.error('Select an instructor first.');
      return;
    }
    setAssigningInstructor(true);
    const result = await assignCourseInstructorAction({
      courseId: course.id,
      instructorId: selectedInstructorId,
      setPrimary: true,
      revenueShare: creator.share || 70,
    });
    setAssigningInstructor(false);

    if (!result.success) {
      toast.error(result.error || 'Failed to assign instructor.');
      return;
    }

    toast.success('Instructor assigned to course.');
    router.refresh();
  };

  const desc = course.description || '';
  const shownDesc = descExpanded ? desc : desc.slice(0, 300);

  return (
    <div className="pb-24 font-[DM_Sans] lg:pb-0">
      <button
        type="button"
        onClick={() => router.push('/admin/courses')}
        className="mb-4 inline-flex items-center gap-2 text-[13px] font-semibold text-[#1D1D1F]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Courses
      </button>

      <h1 className="mb-4 text-[26px] font-bold text-[#1D1D1F]">Course Review</h1>

      <button
        type="button"
        onClick={() => router.push(`/admin/courses/${course.id}/evaluate`)}
        className="mb-4 rounded-full border border-[rgba(0,0,0,0.12)] bg-white px-4 py-2 text-[12px] font-semibold text-[#1D1D1F]"
      >
        Open Full Course Evaluation
      </button>

      {isPending ? (
        <ReviewPanel
          type="course"
          submittedAt={course.created_at}
          creatorName={creator.name}
          onApprove={() => doAction('approve')}
          onReject={() => doAction('reject', 'Please update the content and resubmit with required quality improvements.')}
        />
      ) : null}

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1">
          <div className="mb-5 overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
            <div className="border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-4 py-3 text-[12px] font-semibold text-[#6E6E73]">
              Course Overview
            </div>

            <div className="p-6">
              <div className="relative mb-5 h-[200px] w-full overflow-hidden rounded-2xl bg-[#F5F5F7]">
                {course.thumbnail_url ? <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover" /> : null}
              </div>

              <h2 className="text-[24px] font-extrabold text-[#1D1D1F]">{course.title}</h2>
              {course.title_ta ? <p className="mt-1 text-[13px] text-[#6E6E73]">தமிழ்: {course.title_ta}</p> : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#F5F5F7] px-3 py-1 text-[12px] text-[#6E6E73]">{course.categories?.name || 'General'}</span>
                <span className="rounded-full bg-[#F5F5F7] px-3 py-1 text-[12px] text-[#6E6E73]">{course.difficulty || 'General'}</span>
                <span className="rounded-full bg-[#F5F5F7] px-3 py-1 text-[12px] text-[#6E6E73]">{course.language?.toLowerCase() === 'ta' ? 'தமிழ்' : 'EN'}</span>
                <span className="rounded-full bg-[#F5F5F7] px-3 py-1 text-[12px] text-[#1D1D1F]">{money(course)}</span>
                {course.certificate_enabled ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#EDFAF0] px-3 py-1 text-[12px] text-[#28C840]">
                    <Award className="h-3.5 w-3.5" /> Certificate
                  </span>
                ) : null}
              </div>

              <div className="mt-5">
                <p className="mb-2 text-[13px] font-semibold uppercase text-[#AEAEB2]">Description</p>
                <p className="text-[14px] leading-relaxed text-[#1D1D1F]">{shownDesc}</p>
                {desc.length > 300 ? (
                  <button
                    type="button"
                    onClick={() => setDescExpanded((v) => !v)}
                    className="mt-2 text-[12px] font-semibold text-[#1D1D1F] underline"
                  >
                    {descExpanded ? 'Show less' : 'View full description'}
                  </button>
                ) : null}
              </div>

              {(course.learning_outcomes || []).length > 0 ? (
                <div className="mt-5">
                  <h3 className="mb-3 text-[14px] font-semibold text-[#1D1D1F]">What Students Will Learn</h3>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {(course.learning_outcomes || []).map((item) => (
                      <div key={item} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-3 w-3 text-[#28C840]" />
                        <p className="text-[12px] text-[#6E6E73]">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {(course.requirements || []).length > 0 ? (
                <div className="mt-4">
                  <h3 className="mb-2 text-[14px] font-semibold text-[#1D1D1F]">Requirements</h3>
                  <div className="space-y-1.5">
                    {(course.requirements || []).map((req) => (
                      <div key={req} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#AEAEB2]" />
                        <p className="text-[12px] text-[#6E6E73]">{req}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mb-5 overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-4 py-3">
              <span className="text-[12px] font-semibold text-[#6E6E73]">Curriculum</span>
              <span className="text-[12px] text-[#AEAEB2]">
                {sections.length} sections · {effectiveLectureCount} lectures · {formatMinutes(effectiveDuration)}
              </span>
            </div>

            <div className="p-4">
              <div className="mb-5 rounded-xl bg-[#F5F5F7] p-4">
                <p className="mb-3 text-[13px] font-semibold text-[#1D1D1F]">Content Checklist:</p>
                <div className="space-y-2">
                  {checklist.map((item) => (
                    <div key={item.label} className="flex items-center gap-2 text-[12px]">
                      {item.pass ? (
                        <Check className="h-3.5 w-3.5 text-[#28C840]" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 text-[#FF5F57]" />
                      )}
                      <span className={item.pass ? 'text-[#1D1D1F]' : 'text-[#FF5F57]'}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {sections.length === 0 ? (
                  <div className="rounded-xl bg-[#FFF8EC] p-3 text-[12px] text-[#FEBC2E]">
                    No sections were found for this course in DB.
                  </div>
                ) : null}

                {sections.map((section) => {
                  const open = Boolean(expandedSections[section.id]);
                  const lectures = [...(section.lectures || [])].sort(
                    (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
                  );

                  return (
                    <div key={section.id}>
                      <button
                        type="button"
                        onClick={() => setExpandedSections((prev) => ({ ...prev, [section.id]: !open }))}
                        className="flex w-full items-center justify-between rounded-xl bg-[#F5F5F7] p-3 text-left"
                      >
                        <span className="flex items-center gap-2 text-[13px] text-[#1D1D1F]">
                          <ChevronRight className={`h-4 w-4 text-[#6E6E73] transition-transform ${open ? 'rotate-90' : ''}`} />
                          {section.title}
                        </span>
                        <span className="text-[11px] text-[#AEAEB2]">{lectures.length} lectures</span>
                      </button>

                      {open ? (
                        <div className="pl-8 pt-1">
                          {lectures.map((lecture) => {
                            const TypeIcon =
                              lecture.type === 'video' ? Play : lecture.type === 'article' ? FileText : CheckSquare;
                            const articlePreview = trimContent(lecture.article_content, 220);
                            const videoLink = (lecture.video_url || '').trim();
                            const quizMeta = lecture.quiz;
                            const hasQuizMeta = lecture.type === 'quiz' && Boolean(quizMeta);
                            const hasContentPreview = Boolean(articlePreview) || Boolean(videoLink) || hasQuizMeta;
                            return (
                              <div key={lecture.id} className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-3">
                                <div className="flex items-center gap-3">
                                  <TypeIcon className="h-3.5 w-3.5 text-[#6E6E73]" />
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-[12px] font-medium text-[#1D1D1F]">{lecture.title}</p>
                                    {lecture.title_ta ? <p className="truncate text-[10px] text-[#6E6E73]">தமிழ்: {lecture.title_ta}</p> : null}
                                  </div>
                                  <span className="text-[11px] text-[#AEAEB2]">{lectureMinutes(lecture) || '-'}m</span>
                                  {lecture.is_free_preview ? (
                                    <span className="rounded-full bg-[#EDFAF0] px-2 py-0.5 text-[10px] text-[#28C840]">Free</span>
                                  ) : null}
                                  {!lecture.is_published ? (
                                    <span className="rounded-full bg-[#F5F5F7] px-2 py-0.5 text-[10px] text-[#AEAEB2]">Draft</span>
                                  ) : null}
                                </div>

                                {lecture.type === 'video' && videoLink ? (
                                  <p className="mt-2 break-all text-[11px] text-[#1D1D1F]">
                                    Video source:{' '}
                                    <a href={videoLink} target="_blank" rel="noreferrer" className="font-medium underline">
                                      {videoLink}
                                    </a>
                                  </p>
                                ) : null}

                                {lecture.type === 'article' && articlePreview ? (
                                  <p className="mt-2 text-[11px] leading-relaxed text-[#1D1D1F]">Article preview: {articlePreview}</p>
                                ) : null}

                                {lecture.type === 'quiz' && quizMeta ? (
                                  <div className="mt-2 rounded-lg bg-[#F5F5F7] px-2.5 py-2 text-[11px] text-[#1D1D1F]">
                                    <p className="font-medium">
                                      Quiz: {quizMeta.question_count || 0} questions · Pass {quizMeta.pass_percentage ?? 60}%
                                    </p>
                                    <p className="mt-0.5 text-[#6E6E73]">
                                      {typeof quizMeta.time_limit_mins === 'number' && quizMeta.time_limit_mins > 0
                                        ? `Time limit: ${quizMeta.time_limit_mins} min`
                                        : 'No time limit'}
                                      {' · '}
                                      {quizMeta.is_published ? 'Quiz published' : 'Quiz draft'}
                                    </p>
                                  </div>
                                ) : null}

                                {!hasContentPreview ? (
                                  <p className="mt-2 text-[11px] text-[#AEAEB2]">No lecture content attached yet.</p>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[340px]">
          <div className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-1">
            <ApprovalActionBar
              item={course}
              type="course"
              loading={actionLoading}
              onApprove={(note) => doAction('approve', note)}
              onReject={(reason) => doAction('reject', reason)}
              onRevoke={(reason) => doAction('revoke', reason)}
              onMarkPending={() => doAction('pending')}
            />

            <div className="mt-4 overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
            <div className="border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-4 py-3 text-[12px] font-semibold text-[#6E6E73]">
              Instructor
            </div>
            <div className="p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="relative h-11 w-11 overflow-hidden rounded-full bg-[#F5F5F7]">
                  {creator.avatar ? <Image src={creator.avatar} alt={creator.name} fill className="object-cover" /> : null}
                </div>
                <div>
                  <p className="text-[15px] font-bold text-[#1D1D1F]">{creator.name}</p>
                  <p className="text-[12px] text-[#6E6E73]">{creator.headline || 'Instructor'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#F5F5F7] p-3">
                  <p className="text-[14px] font-bold text-[#1D1D1F]">{creator.totalCourses}</p>
                  <p className="text-[11px] text-[#6E6E73]">Courses</p>
                </div>
                <div className="rounded-xl bg-[#F5F5F7] p-3">
                  <p className="text-[14px] font-bold text-[#1D1D1F]">{creator.totalStudents}</p>
                  <p className="text-[11px] text-[#6E6E73]">Students</p>
                </div>
                <div className="rounded-xl bg-[#F5F5F7] p-3">
                  <p className="text-[14px] font-bold text-[#FEBC2E]">{creator.rating.toFixed(1)}★</p>
                  <p className="text-[11px] text-[#6E6E73]">Rating</p>
                </div>
                <div className="rounded-xl bg-[#F5F5F7] p-3">
                  <p className="text-[14px] font-bold text-[#1D1D1F]">{creator.share}%</p>
                  <p className="text-[11px] text-[#6E6E73]">Share</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-[11px] uppercase tracking-wide text-[#AEAEB2]">Assign / Change Instructor</p>
                <div className="flex gap-2">
                  <select
                    value={selectedInstructorId}
                    onChange={(e) => setSelectedInstructorId(e.target.value)}
                    className="h-9 flex-1 rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-3 text-[12px] text-[#1D1D1F] outline-none"
                  >
                    <option value="">Select instructor</option>
                    {instructorOptions.map((instructor) => (
                      <option key={instructor.id} value={instructor.id}>
                        {instructor.full_name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!selectedInstructorId || assigningInstructor}
                    onClick={assignInstructor}
                    className="h-9 rounded-xl border border-[rgba(0,0,0,0.1)] px-3 text-[12px] font-semibold text-[#1D1D1F] disabled:opacity-50"
                  >
                    {assigningInstructor ? 'Saving...' : 'Assign'}
                  </button>
                </div>
              </div>

              {creator.id ? (
                <button
                  type="button"
                  onClick={() => router.push(`/admin/users/${creator.id}`)}
                  className="mt-3 text-[12px] font-medium text-[#1D1D1F]"
                >
                  View Profile {'->'}
                </button>
              ) : null}
            </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
            <div className="border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-4 py-3 text-[12px] font-semibold text-[#6E6E73]">
              Course Stats
            </div>
            <div className="grid grid-cols-2 gap-3 p-4">
              <div className="rounded-xl bg-[#F5F5F7] p-3">
                <p className="text-[14px] font-bold text-[#1D1D1F]">{course.total_enrolled || 0}</p>
                <p className="text-[11px] text-[#6E6E73]">Enrolled</p>
              </div>
              <div className="rounded-xl bg-[#F5F5F7] p-3">
                <p className="text-[14px] font-bold text-[#1D1D1F]">{course.total_reviews || 0}</p>
                <p className="text-[11px] text-[#6E6E73]">Reviews</p>
              </div>
              <div className="rounded-xl bg-[#F5F5F7] p-3">
                <p className="text-[14px] font-bold text-[#FEBC2E]">{(course.avg_rating || 0).toFixed(1)}★</p>
                <p className="text-[11px] text-[#6E6E73]">Rating</p>
              </div>
              <div className="rounded-xl bg-[#F5F5F7] p-3">
                <p className="text-[14px] font-bold text-[#1D1D1F]">{effectiveLectureCount}</p>
                <p className="text-[11px] text-[#6E6E73]">Lectures</p>
              </div>
              <div className="rounded-xl bg-[#F5F5F7] p-3">
                <p className="text-[14px] font-bold text-[#1D1D1F]">{sections.length}</p>
                <p className="text-[11px] text-[#6E6E73]">Sections</p>
              </div>
              <div className="rounded-xl bg-[#F5F5F7] p-3">
                <p className="text-[14px] font-bold text-[#1D1D1F]">{formatMinutes(effectiveDuration)}</p>
                <p className="text-[11px] text-[#6E6E73]">Duration</p>
              </div>
            </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
            <div className="border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-4 py-3 text-[12px] font-semibold text-[#6E6E73]">
              Course Income
            </div>
            <div className="grid grid-cols-1 gap-3 p-4">
              <div className="rounded-xl bg-[#F5F5F7] p-3">
                <p className="text-[11px] text-[#AEAEB2]">Gross Revenue (Course)</p>
                <p className="text-[16px] font-bold text-[#1D1D1F]">₹{grossRevenue.toLocaleString('en-IN')}</p>
              </div>
              <div className="rounded-xl bg-[#EDFAF0] p-3">
                <p className="text-[11px] text-[#6E6E73]">Instructor Income ({creator.share}%)</p>
                <p className="text-[16px] font-bold text-[#28C840]">₹{instructorRevenue.toLocaleString('en-IN')}</p>
              </div>
              <div className="rounded-xl bg-[#FFF8EC] p-3">
                <p className="text-[11px] text-[#6E6E73]">Platform Income</p>
                <p className="text-[16px] font-bold text-[#FEBC2E]">₹{platformRevenue.toLocaleString('en-IN')}</p>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
