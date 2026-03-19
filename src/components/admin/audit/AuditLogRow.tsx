'use client';

function formatTime(v?: string | null) {
  if (!v) return '-';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString();
}

export default function AuditLogRow({
  row,
}: {
  row: {
    id: string;
    actor_name?: string | null;
    actor_email?: string | null;
    action: string;
    target_type?: string | null;
    target_id?: string | null;
    details?: string | null;
    created_at?: string | null;
  };
}) {
  return (
    <div className="grid min-w-[1100px] grid-cols-[220px_220px_220px_150px_1fr] items-center gap-4 border-b border-[rgba(0,0,0,0.06)] px-5 py-3 text-[13px] text-[#1D1D1F]">
      <div>
        <p className="font-semibold">{row.actor_name || 'System'}</p>
        <p className="text-[12px] text-[#8E8E93]">{row.actor_email || 'system@slate.local'}</p>
      </div>
      <div className="font-medium">{row.action}</div>
      <div className="text-[#6E6E73]">
        {row.target_type || '-'}
        {row.target_id ? ` #${row.target_id}` : ''}
      </div>
      <div className="text-[#6E6E73]">{formatTime(row.created_at)}</div>
      <div className="truncate text-[#6E6E73]">{row.details || '-'}</div>
    </div>
  );
}
