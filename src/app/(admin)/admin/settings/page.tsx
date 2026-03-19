import { createClient } from '@/lib/supabase/server';
import SettingsPageClient from '@/components/admin/settings/SettingsPageClient';

export const dynamic = 'force-dynamic';

async function getSettings() {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('key,value')
      .limit(200);

    if (error) {
      return { canPersistToDb: false, settings: {} as Record<string, any> };
    }

    const settings = (data || []).reduce((acc: Record<string, any>, row: any) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    return { canPersistToDb: true, settings };
  } catch {
    return { canPersistToDb: false, settings: {} as Record<string, any> };
  }
}

export default async function AdminSettingsPage() {
  const { settings, canPersistToDb } = await getSettings();

  return (
    <div className="p-6">
      <SettingsPageClient initial={settings} canPersistToDb={canPersistToDb} />
    </div>
  );
}
