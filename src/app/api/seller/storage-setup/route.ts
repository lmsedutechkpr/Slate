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
    { id: 'store-banners', name: 'store-banners', public: true },
    { id: 'store-logos', name: 'store-logos', public: true },
  ];

  const results: Record<string, string> = {};

  for (const bucket of buckets) {
    // Check if bucket exists
    const { data: existing } = await db.storage.getBucket(bucket.id);

    if (existing) {
      results[bucket.id] = 'already exists';
      continue;
    }

    // Create bucket
    const { error } = await db.storage.createBucket(bucket.id, {
      public: bucket.public,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    });

    if (error) {
      results[bucket.id] = `error: ${error.message}`;
    } else {
      results[bucket.id] = 'created';
    }
  }

  // Also ensure seller_profiles has the necessary columns by attempting an
  // ALTER TABLE. If columns exist, Postgres silently ignores IF NOT EXISTS.
  try {
    const columns = [
      { name: 'store_name', type: 'text' },
      { name: 'store_name_ta', type: 'text' },
      { name: 'store_slug', type: 'text' },
      { name: 'store_description', type: 'text' },
      { name: 'business_type', type: 'text DEFAULT \'individual\'' },
      { name: 'commission_rate', type: 'numeric DEFAULT 85' },
      { name: 'contact_email', type: 'text' },
      { name: 'banner_url', type: 'text' },
      { name: 'store_logo_url', type: 'text' },
      { name: 'social_links', type: 'jsonb DEFAULT \'{}\'::jsonb' },
      { name: 'status', type: 'text DEFAULT \'pending\'' },
      { name: 'avg_rating', type: 'numeric DEFAULT 0' },
      { name: 'total_sales', type: 'integer DEFAULT 0' },
      { name: 'total_revenue', type: 'numeric DEFAULT 0' },
      { name: 'total_orders', type: 'integer DEFAULT 0' },
      { name: 'pending_payout', type: 'numeric DEFAULT 0' },
      { name: 'total_paid_out', type: 'numeric DEFAULT 0' },
      { name: 'payout_method', type: 'text' },
      { name: 'payout_details', type: 'jsonb DEFAULT \'{}\'::jsonb' },
    ];

    for (const col of columns) {
      try {
        await db.rpc('exec_sql', {
          query: `ALTER TABLE seller_profiles ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};`
        });
      } catch {
        // rpc may not exist, ignore
      }
    }

    // Add unique constraint on store_slug
    try {
      await db.rpc('exec_sql', {
        query: `DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'seller_profiles_store_slug_unique'
            ) THEN
              ALTER TABLE seller_profiles ADD CONSTRAINT seller_profiles_store_slug_unique UNIQUE (store_slug);
            END IF;
          END $$;`
      });
    } catch {
      // ignore if rpc not available
    }

    results['db_columns'] = 'attempted';
  } catch {
    results['db_columns'] = 'skipped (manual setup required)';
  }

  return NextResponse.json({ success: true, results });
}
