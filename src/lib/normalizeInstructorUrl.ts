/**
 * normalizeInstructorUrl
 *
 * Maps any notification / search action_url to a valid instructor portal route.
 * The instructor portal only has these top-level pages:
 *   /instructor/dashboard
 *   /instructor/courses/[id]  (course detail exists)
 *   /instructor/students
 *   /instructor/live
 *   /instructor/qa
 *   /instructor/messages
 *   /instructor/payouts
 *   /instructor/notifications
 *   /instructor/profile
 */

const KNOWN_INSTRUCTOR_PREFIXES = [
  '/instructor/dashboard',
  '/instructor/courses',
  '/instructor/students',
  '/instructor/live',
  '/instructor/qa',
  '/instructor/messages',
  '/instructor/payouts',
  '/instructor/notifications',
  '/instructor/profile',
];

function isValidInstructorUrl(url: string): boolean {
  return KNOWN_INSTRUCTOR_PREFIXES.some(prefix => url === prefix || url.startsWith(prefix + '/'));
}

export function normalizeInstructorUrl(raw: string | null | undefined): string {
  if (!raw) return '/instructor/dashboard';

  const url = raw.trim();

  // Already a valid instructor route — keep it, but strip deep sub-paths that
  // don't have their own pages (e.g. /instructor/qa/[questionId]).
  if (url.startsWith('/instructor/')) {
    // These pages support deep linking
    if (url.startsWith('/instructor/courses/') || url.startsWith('/instructor/live/')) {
      return url;
    }
    // Everything else: strip to the section root
    for (const prefix of KNOWN_INSTRUCTOR_PREFIXES) {
      if (url.startsWith(prefix)) return prefix;
    }
    return '/instructor/dashboard';
  }

  // Student portal links → map to the closest instructor equivalent
  if (url.startsWith('/student/messages') || url.startsWith('/messages')) {
    return '/instructor/messages';
  }
  if (url.startsWith('/student/courses'))    return '/instructor/courses';
  if (url.startsWith('/student/live'))       return '/instructor/live';
  if (url.startsWith('/student/dashboard'))  return '/instructor/dashboard';
  if (url.startsWith('/student'))            return '/instructor/dashboard';

  // Other bare paths — try to map
  if (url.startsWith('/messages'))           return '/instructor/messages';
  if (url.startsWith('/courses'))            return '/instructor/courses';

  // Fallback
  return '/instructor/dashboard';
}
