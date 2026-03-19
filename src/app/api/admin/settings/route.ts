import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const supabase = await createClient();

    const rows = Object.entries(payload || {}).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString(),
    }));

    if (!rows.length) {
      return NextResponse.json({ success: true });
    }

    const { error } = await supabase.from('site_settings').upsert(rows, {
      onConflict: 'key',
    });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
  }
}
