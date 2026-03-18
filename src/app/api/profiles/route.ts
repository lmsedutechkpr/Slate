import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ids = req.nextUrl.searchParams.get('ids');
  if (!ids) return NextResponse.json({ error: 'Missing ids' }, { status: 400 });

  const idList = ids.split(',').filter(Boolean);
  if (idList.length === 0) return NextResponse.json({ profiles: [] });

  const admin = createAdminClient();
  const { data: profiles, error } = await admin
    .from('profiles')
    .select('id, full_name, avatar_url, phone')
    .in('id', idList);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profiles: profiles || [] });
}
