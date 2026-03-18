import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdmin } from '@supabase/supabase-js';

function adminDb() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// GET /api/seller/store/check-slug?slug=xxx&userId=yyy
// Checks if a store slug is already used by another seller
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  const userId = searchParams.get('userId');

  if (!slug) {
    return NextResponse.json({ available: false, error: 'Slug is required' }, { status: 400 });
  }

  const db = adminDb();

  let query = db
    .from('seller_profiles')
    .select('user_id')
    .eq('store_slug', slug);

  // Exclude the current user's own slug
  if (userId) {
    query = query.neq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ available: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    available: !data || data.length === 0,
    slug,
  });
}
