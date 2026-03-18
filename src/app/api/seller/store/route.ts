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

// PUT /api/seller/store
// Upserts seller_profiles row for the authenticated user
export async function PUT(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
    store_name,
    store_name_ta,
    store_slug,
    store_description,
    business_type,
    banner_url,
    logo_url,
    contact_email,
    social_links,
  } = body;

  if (!store_name?.trim()) {
    return NextResponse.json({ error: 'Store name is required' }, { status: 400 });
  }
  if (!store_slug?.trim() || store_slug.length < 3) {
    return NextResponse.json({ error: 'Store slug must be at least 3 characters' }, { status: 400 });
  }

  const db = adminDb();

  // Check slug uniqueness (exclude this user's own slug)
  const { data: existing } = await db
    .from('seller_profiles')
    .select('user_id')
    .eq('store_slug', store_slug)
    .neq('user_id', user.id);

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'This store slug is already taken' }, { status: 409 });
  }

  const { error } = await db
    .from('seller_profiles')
    .upsert(
      {
        user_id: user.id,
        store_name: store_name.trim(),
        store_name_ta: store_name_ta?.trim() || null,
        store_slug: store_slug.trim(),
        store_description: store_description?.trim() || null,
        business_type: business_type || 'individual',
        banner_url: banner_url || null,
        store_logo_url: logo_url || null,
        contact_email: contact_email?.trim() || null,
        social_links: social_links || {},
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    if (error.code === '23505' && error.message?.includes('store_slug')) {
      return NextResponse.json({ error: 'This store slug is already taken' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
