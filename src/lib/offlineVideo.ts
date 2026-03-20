export type OfflineLectureType = 'video' | 'article' | 'quiz';

export type OfflineLectureEntry = {
  lectureId: string;
  courseId: string;
  userId: string;
  title: string;
  type: OfflineLectureType;
  videoUrl: string | null;
  videoDataUrl: string | null;
  payload: Record<string, any> | null;
  downloadedAt: string;
};

const MAX_STORED_VIDEO_BYTES = 3 * 1024 * 1024;
const VIDEO_CACHE_PREFIX = 'slate.offline.video.cache.';

function keyFor(userId: string) {
  return `slate.offline.videos.${userId}`;
}

function safeRead(userId: string): OfflineLectureEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(keyFor(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OfflineLectureEntry[]) : [];
  } catch {
    return [];
  }
}

function safeWrite(userId: string, entries: OfflineLectureEntry[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(keyFor(userId), JSON.stringify(entries));
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function cacheNameFor(userId: string) {
  return `${VIDEO_CACHE_PREFIX}${userId}`;
}

async function storeVideoInCache(userId: string, lectureId: string, videoUrl: string) {
  if (typeof window === 'undefined' || !('caches' in window)) return null;
  const response = await fetch(videoUrl, { cache: 'no-store' });
  if (!response.ok) return null;

  const key = `https://slate-offline.local/video/${encodeURIComponent(lectureId)}`;
  const cache = await caches.open(cacheNameFor(userId));
  await cache.put(key, response.clone());
  return key;
}

async function deleteVideoFromCache(userId: string, cacheKey: string | null | undefined) {
  if (!cacheKey || typeof window === 'undefined' || !('caches' in window)) return;
  const cache = await caches.open(cacheNameFor(userId));
  await cache.delete(cacheKey);
}

export async function saveOfflineLectureForUser(params: {
  userId: string;
  courseId: string;
  lectureId: string;
  title: string;
  type: OfflineLectureType;
  videoUrl?: string | null;
  payload?: Record<string, any> | null;
}) {
  const { userId, courseId, lectureId, title, type, videoUrl, payload } = params;

  let videoDataUrl: string | null = null;
  let cacheKey: string | null = null;

  if (type === 'video') {
    if (!videoUrl) {
      if (!payload?.allowMockFallback) {
        return { saved: false as const, reason: 'missing_video_url' as const };
      }
      const prev = safeRead(userId).filter((e) => e.lectureId !== lectureId);
      prev.push({
        lectureId,
        courseId,
        userId,
        title,
        type,
        videoUrl: null,
        videoDataUrl: null,
        payload: { ...(payload || {}), mockOnly: true, cacheKey: null },
        downloadedAt: new Date().toISOString(),
      });
      safeWrite(userId, prev);
      return { saved: true as const, reason: null, persistedVia: 'mock' as const };
    }

    try {
      cacheKey = await storeVideoInCache(userId, lectureId, videoUrl);

      // Small-file fallback for browsers where Cache Storage is unavailable.
      if (!cacheKey) {
        const res = await fetch(videoUrl, { cache: 'no-store' });
        if (res.ok) {
          const blob = await res.blob();
          if (blob.size <= MAX_STORED_VIDEO_BYTES) {
            videoDataUrl = await blobToDataUrl(blob);
          }
        }
      }
    } catch {
      return { saved: false as const, reason: 'fetch_failed' as const };
    }

    if (!cacheKey && !videoDataUrl) {
      return { saved: false as const, reason: 'persist_failed' as const };
    }
  }

  const prev = safeRead(userId).filter((e) => e.lectureId !== lectureId);
  prev.push({
    lectureId,
    courseId,
    userId,
    title,
    type,
    videoUrl: videoUrl || null,
    videoDataUrl,
    payload: { ...(payload || {}), cacheKey },
    downloadedAt: new Date().toISOString(),
  });
  safeWrite(userId, prev);

  return {
    saved: true as const,
    reason: null,
    persistedVia: cacheKey ? ('cache' as const) : ('localStorage' as const),
  };
}

export async function saveOfflineVideoForUser(params: {
  userId: string;
  courseId: string;
  lectureId: string;
  title: string;
  videoUrl?: string | null;
  payload?: Record<string, any> | null;
}) {
  return saveOfflineLectureForUser({ ...params, type: 'video' });
}

export function removeOfflineVideosForLectureIds(userId: string, lectureIds: string[]) {
  const ids = new Set(lectureIds);
  const current = safeRead(userId);
  current
    .filter((e) => ids.has(e.lectureId))
    .forEach((entry) => {
      deleteVideoFromCache(userId, entry.payload?.cacheKey).catch(() => {});
    });
  const next = current.filter((e) => !ids.has(e.lectureId));
  safeWrite(userId, next);
}

export function removeOfflineLectureForUser(userId: string, lectureId: string) {
  const current = safeRead(userId);
  const target = current.find((e) => e.lectureId === lectureId) || null;
  if (target) {
    deleteVideoFromCache(userId, target.payload?.cacheKey).catch(() => {});
  }
  const next = current.filter((e) => e.lectureId !== lectureId);
  safeWrite(userId, next);
}

export function listOfflineLectureIds(userId: string) {
  return safeRead(userId).map((e) => e.lectureId);
}

export function hasOfflineAccess(userId: string, lectureId: string) {
  return safeRead(userId).some((e) => e.userId === userId && e.lectureId === lectureId);
}

export async function getOfflineVideoSource(userId: string, lectureId: string) {
  const match = safeRead(userId).find((e) => e.userId === userId && e.lectureId === lectureId);
  if (!match) return null;

  if (match.videoDataUrl) return match.videoDataUrl;

  const cacheKey = match.payload?.cacheKey;
  if (!cacheKey || typeof window === 'undefined' || !('caches' in window)) return null;

  try {
    const cache = await caches.open(cacheNameFor(userId));
    const response = await cache.match(cacheKey);
    if (!response) return null;
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

export function getOfflineLectureEntry(userId: string, lectureId: string) {
  return safeRead(userId).find((e) => e.userId === userId && e.lectureId === lectureId) || null;
}
