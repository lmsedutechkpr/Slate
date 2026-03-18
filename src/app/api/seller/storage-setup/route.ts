import { NextResponse } from 'next/server';
import { createClient as createAdmin } from '@supabase/supabase-js';

function adminDb() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// POST /api/seller/storage-setup
// Ensures storage buckets exist for store assets
export async function POST() {
  const db = adminDb();

  const buckets = [
    { id: 'store-banners', public: true },
    { id: 'store-logos', public: true },
  ];

  const results: Record<string, string> = {};

  for (const bucket of buckets) {
    const { data: existing } = await db.storage.getBucket(bucket.id);

    if (existing) {
      results[bucket.id] = 'exists';
      continue;
    }

    const { error } = await db.storage.createBucket(bucket.id, {
      public: bucket.public,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    });

    results[bucket.id] = error ? `error: ${error.message}` : 'created';
  }

  return NextResponse.json({ success: true, results });
}
