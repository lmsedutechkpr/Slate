import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';

function adminDb() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Ensure bucket exists, create if missing
async function ensureBucket(admin: ReturnType<typeof adminDb>, bucketId: string) {
  const { data } = await admin.storage.getBucket(bucketId);
  if (data) return;
  await admin.storage.createBucket(bucketId, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  });
}

// POST /api/seller/upload
// Body: FormData with fields: file, bucket (store-banners | store-logos), prefix (banner | logo)
export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const bucket = (formData.get('bucket') as string) || 'store-banners';
  const prefix = (formData.get('prefix') as string) || 'image';

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // Validate size
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large. Max 5MB.' }, { status: 400 });
  }

  // Validate type
  if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, GIF, WEBP allowed.' }, { status: 400 });
  }

  // Only allow our store buckets
  if (!['store-banners', 'store-logos'].includes(bucket)) {
    return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 });
  }

  const admin = adminDb();

  // Ensure bucket exists
  await ensureBucket(admin, bucket);

  // Build path
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${user.id}/${prefix}-${Date.now()}.${ext}`;

  // Convert File to Buffer for upload
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload via admin client (bypasses RLS)
  const { error: uploadError } = await admin.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: `Upload failed: ${uploadError.message}` },
      { status: 500 }
    );
  }

  // Get public URL
  const { data: { publicUrl } } = admin.storage
    .from(bucket)
    .getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
