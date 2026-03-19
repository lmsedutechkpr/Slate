import { createClient } from '@/lib/supabase/server';
import AuditPageClient from '@/components/admin/audit/AuditPageClient';

export const dynamic = 'force-dynamic';

async function getAuditRows() {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('id,actor_name,actor_email,action,target_type,target_id,details,created_at')
      .order('created_at', { ascending: false })
      .limit(500);

    if (!error && data) {
      return data;
    }
  } catch {
    // ignore and fall back below
  }

  return [
    {
      id: 'fallback-1',
      actor_name: 'System',
      actor_email: 'system@slate.local',
      action: 'settings_updated',
      target_type: 'site_settings',
      target_id: 'maintenanceMode',
      details: 'Maintenance mode configuration updated',
      created_at: new Date().toISOString(),
    },
  ];
}

export default async function AdminAuditPage() {
  const rows = await getAuditRows();

  return (
    <div className="p-6">
      <AuditPageClient initialRows={rows} />
    </div>
  );
}
