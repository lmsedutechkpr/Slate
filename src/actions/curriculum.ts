'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { notifyEnrolledStudentsAction } from '@/app/actions/notifications';

export async function fetchSectionsAction(courseId: string) {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('course_sections')
    .select('id, title, title_ta, sort_order, lectures(id, title, title_ta, type, video_duration_secs, read_time_mins, quiz_duration_mins, is_free_preview, is_published, sort_order, video_url, article_content)')
    .eq('course_id', courseId)
    .order('sort_order');
  
  if (error) {
    console.error('fetchSectionsAction error:', error);
    throw new Error(error.message);
  }
  return data ? JSON.parse(JSON.stringify(data)) : [];
}

export async function addSectionAction(courseId: string, title: string, sortOrder: number) {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('course_sections')
    .insert({ course_id: courseId, title, sort_order: sortOrder })
    .select('id, title, title_ta, sort_order')
    .single();
  if (error) throw new Error(error.message);
  return data ? JSON.parse(JSON.stringify(data)) : null;
}

export async function updateSectionAction(sectionId: string, updates: any) {
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('course_sections')
    .update(updates)
    .eq('id', sectionId);
  if (error) {
    console.error('updateSectionAction error:', error);
    throw new Error(error.message);
  }
  return true;
}

export async function deleteSectionAction(sectionId: string) {
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('course_sections')
    .delete()
    .eq('id', sectionId);
  if (error) throw new Error(error.message);
  return true;
}

// LECTURES
export async function addLectureAction(sectionId: string, courseId: string, lectureData: any) {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('lectures')
    .insert({ ...lectureData, section_id: sectionId, course_id: courseId })
    .select('*')
    .single();
  if (error) throw new Error(error.message);

  // Fetch course title for the notification message
  if (data) {
    const { data: course } = await adminClient
      .from('courses')
      .select('title')
      .eq('id', courseId)
      .single();

    const typeLabel = data.type === 'video' ? 'Video' : data.type === 'article' ? 'Article' : 'Quiz';
    // Fire-and-forget — won't block save even if it fails
    notifyEnrolledStudentsAction({
      courseId,
      type: 'new_lecture',
      title: `New ${typeLabel} Added — ${course?.title ?? 'Your Course'}`,
      message: `A new ${typeLabel.toLowerCase()} lecture "${data.title}" has been added to your course.`,
      actionUrl: `/student/courses/${courseId}`,
      metadata: { lecture_id: data.id, lecture_title: data.title, lecture_type: data.type },
    }).catch(console.error);
  }

  return data ? JSON.parse(JSON.stringify(data)) : null;
}

export async function updateLectureAction(lectureId: string, updates: any) {
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('lectures')
    .update(updates)
    .eq('id', lectureId);
  if (error) {
    console.error('updateLectureAction error:', error);
    throw new Error(error.message);
  }

  // Only notify for meaningful content changes (not sort_order / publish-toggle alone)
  const meaningfulFields = ['title', 'article_content', 'video_url', 'title_ta'];
  const isMeaningfulUpdate = Object.keys(updates).some(k => meaningfulFields.includes(k));
  if (isMeaningfulUpdate) {
    // Fetch lecture + course info for the notification
    const { data: lecture } = await adminClient
      .from('lectures')
      .select('title, type, is_published, course_id, courses(title)')
      .eq('id', lectureId)
      .single();

    if (lecture?.is_published && lecture?.course_id) {
      const courseTitle = (lecture.courses as any)?.title ?? 'Your Course';
      const typeLabel = lecture.type === 'video' ? 'Video' : lecture.type === 'article' ? 'Article' : 'Quiz';
      notifyEnrolledStudentsAction({
        courseId: lecture.course_id,
        type: 'lecture_updated',
        title: `${typeLabel} Updated — ${courseTitle}`,
        message: `The ${typeLabel.toLowerCase()} "${updates.title ?? lecture.title}" has been updated with new content.`,
        actionUrl: `/student/courses/${lecture.course_id}`,
        metadata: { lecture_id: lectureId, lecture_title: lecture.title, lecture_type: lecture.type },
      }).catch(console.error);
    }
  }

  return true;
}

export async function deleteLectureAction(lectureId: string) {
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('lectures')
    .delete()
    .eq('id', lectureId);
  if (error) throw new Error(error.message);
  return true;
}

// MEDIA UPLOADS
export async function createThumbnailUploadUrlAction(courseId: string, ext: string) {
  if (!courseId || !ext) {
    throw new Error('Missing file data');
  }

  const path = `${courseId}.${ext}`;
  const adminClient = createAdminClient();

  // Generate a signed upload URL valid for 60 seconds
  const { data, error } = await adminClient.storage
    .from('course-thumbnails')
    .createSignedUploadUrl(path);

  if (error) {
    console.error('createSignedUploadUrl error:', error);
    throw new Error(error.message);
  }

  const { data: publicUrlData } = adminClient.storage
    .from('course-thumbnails')
    .getPublicUrl(path);

  return {
    signedUrl: data.signedUrl,
    token: data.token,
    path,
    publicUrl: publicUrlData.publicUrl
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// QUIZ QUESTIONS — CANONICAL FORMAT
// options       : [{label: "Text", value: "0"},...] value = 0-based index string
// correct_answer: "0" | "1" | "2" | "3"  matches opt.value of correct option
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchQuizQuestionsAction(lectureId: string) {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('quiz_questions')
    .select('id, lecture_id, question, question_text, options, correct_answer, explanation, sort_order')
    .eq('lecture_id', lectureId)
    .order('sort_order');
  if (error) throw new Error(error.message);

  const normalized = (data ?? []).map((q: any) => {
    const questionText = (q.question ?? q.question_text ?? '') as string;
    const rawOpts: any[] = Array.isArray(q.options) ? q.options : [];
    const isObjects = rawOpts.length > 0 && typeof rawOpts[0] === 'object';

    // Flatten to string labels for the instructor modal
    const stringOpts = rawOpts.map((o: any) =>
      typeof o === 'string' ? o : (o?.label ?? '')
    );
    while (stringOpts.length < 4) stringOpts.push('');

    // Resolve correct_answer to 0-based radio index:
    //   Canonical: options.value = '0','1','2','3'  correct_answer = '1'
    //   → findIndex(o.value === '1') = 1 ✓
    const rawCA = String(q.correct_answer ?? '0');
    let correctIndex = 0;
    if (isObjects) {
      const idx = rawOpts.findIndex((o: any) => String(o?.value) === rawCA);
      correctIndex = idx >= 0 ? idx : (parseInt(rawCA) || 0);
    } else {
      correctIndex = parseInt(rawCA) || 0;
    }

    return {
      ...q,
      question: questionText,
      options: stringOpts,          // string[] for modal
      correct_answer: correctIndex, // 0-based number for modal radio
      explanation: q.explanation ?? '',
    };
  });
  return JSON.parse(JSON.stringify(normalized));
}


export async function addQuizQuestionAction(lectureId: string, question: {
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
  sort_order: number;
}) {
  const adminClient = createAdminClient();

  // Look up the quiz_id for this lecture so new questions are linked to the quiz
  const { data: quizRow } = await adminClient
    .from('quizzes')
    .select('id')
    .eq('lecture_id', lectureId)
    .eq('is_published', true)
    .maybeSingle();

  // correct_answer stored as 0-based index string
  const correctAnswerStr = String(question.correct_answer);

  // Convert plain string options to {label, value}[] with 0-based index values
  // This is the standard format: value = '0','1','2','3' matching correct_answer
  const dbOptions = question.options.map((label, i) => ({ label, value: String(i) }));

  const { data, error } = await adminClient
    .from('quiz_questions')
    .insert({
      lecture_id: lectureId,
      quiz_id: quizRow?.id ?? null,
      question: question.question,
      question_text: question.question,
      options: dbOptions,
      correct_answer: correctAnswerStr,  // 0-based index string
      explanation: question.explanation ?? null,
      sort_order: question.sort_order,
    })
    .select('id, lecture_id, quiz_id, question, options, correct_answer, explanation, sort_order')
    .single();
  if (error) throw new Error(error.message);
  return data ? JSON.parse(JSON.stringify(data)) : null;
}

export async function updateQuizQuestionAction(questionId: string, updates: {
  question?: string;
  options?: string[];
  correct_answer?: number;
  explanation?: string;
  sort_order?: number;
}) {
  const adminClient = createAdminClient();
  const payload: any = { ...updates };

  // Mirror question to question_text (original NOT NULL column)
  if (payload.question) {
    payload.question_text = payload.question;
  }

  // Convert plain string options to {label, value}[] with 0-based index values
  if (Array.isArray(payload.options)) {
    const isAlreadyObjects = payload.options.length > 0 && typeof payload.options[0] === 'object';
    if (!isAlreadyObjects) {
      payload.options = (payload.options as string[]).map((label: string, i: number) => ({
        label,
        value: String(i), // 0-based index
      }));
    }
  }

  // Cast correct_answer to 0-based index string (DB stores as text)
  if (typeof payload.correct_answer === 'number') {
    payload.correct_answer = String(payload.correct_answer);
  }

  const { error } = await adminClient
    .from('quiz_questions')
    .update(payload)
    .eq('id', questionId);
  if (error) throw new Error(error.message);
  return true;
}

export async function deleteQuizQuestionAction(questionId: string) {
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('quiz_questions')
    .delete()
    .eq('id', questionId);
  if (error) throw new Error(error.message);
  return true;
}

export async function submitCourseForReviewAction(courseId: string) {
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('courses')
    .update({ status: 'pending' })
    .eq('id', courseId);
  if (error) throw new Error(error.message);
  return true;
}

export async function duplicateCourseAction(courseId: string, instructorId: string) {
  const adminClient = createAdminClient();

  // 1. Fetch the original course — only the safe/content columns
  const { data: original, error: fetchErr } = await adminClient
    .from('courses')
    .select(`
      title, title_ta, slug, subtitle, subtitle_ta,
      description, description_ta, category_id,
      thumbnail_url, preview_video_url, language,
      difficulty, tags, what_you_learn, requirements,
      target_audience, is_free, price, discounted_price,
      currency, certificate_enabled
    `)
    .eq('id', courseId)
    .single();

  if (fetchErr || !original) throw new Error(fetchErr?.message ?? 'Course not found');

  // 2. Build slug for the copy
  const suffix = Math.random().toString(36).slice(2, 10);
  const newSlug = `${(original.slug ?? 'course')}-copy-${suffix}`;

  // 3. Insert the duplicate
  const { data: newCourse, error: insertErr } = await adminClient
    .from('courses')
    .insert({
      ...original,
      title: `${original.title} (Copy)`,
      slug: newSlug,
      status: 'draft',
      // Nullify review/publish fields
      admin_notes: null,
      reviewed_by: null,
      reviewed_at: null,
      published_at: null,
    })
    .select('id')
    .single();

  if (insertErr || !newCourse) throw new Error(insertErr?.message ?? 'Failed to create copy');

  // 4. Link the instructor
  const { error: instErr } = await adminClient
    .from('course_instructors')
    .insert({
      course_id: newCourse.id,
      instructor_id: instructorId,
      is_primary: true,
    });

  if (instErr) {
    // Non-fatal: course was created, just log
    console.error('Failed to link instructor to duplicate course:', instErr.message);
  }

  return JSON.parse(JSON.stringify(newCourse));
}


