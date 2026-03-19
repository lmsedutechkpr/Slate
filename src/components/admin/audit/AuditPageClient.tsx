'use client';

import { useMemo, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import AuditLogRow from './AuditLogRow';

function toCsv(rows: any[]) {
  const headers = ['actor_name', 'actor_email', 'action', 'target_type', 'target_id', 'details', 'created_at'];
  const escape = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','));
  }
  return lines.join('\n');
}

export default function AuditPageClient({ initialRows }: { initialRows: any[] }) {
  const [rows, setRows] = useState<any[]>(initialRows || []);
  const [query, setQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('admin-audit-stream')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload) => {
        setRows((prev) => [payload.new as any, ...prev].slice(0, 500));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const actions = useMemo(() => {
    const uniq = new Set<string>();
    rows.forEach((r) => uniq.add(String(r.action || 'unknown')));
    return ['all', ...Array.from(uniq)];
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (actionFilter !== 'all' && String(row.action) !== actionFilter) return false;
      if (!query.trim()) return true;
      const hay = `${row.actor_name || ''} ${row.actor_email || ''} ${row.action || ''} ${row.details || ''}`.toLowerCase();
      return hay.includes(query.trim().toLowerCase());
    });
  }, [rows, actionFilter, query]);

  const exportCsv = () => {
    const csv = toCsv(filtered);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="font-[DM_Sans]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold text-[#1D1D1F]">Audit Logs</h1>
          <p className="mt-1 text-[13px] text-[#6E6E73]">Track critical admin and platform actions</p>
        </div>
        <button
          onClick={exportCsv}
          className="rounded-full border border-[rgba(0,0,0,0.14)] bg-white px-4 py-2 text-[12px] font-semibold text-[#1D1D1F]"
        >
          Export CSV
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search actor, action or details"
          className="h-9 min-w-[260px] rounded-full border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[12px]"
        />
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="h-9 rounded-full border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[12px]"
        >
          {actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
        <div className="flex h-11 items-center justify-between border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-4">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
              <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
              <span className="h-2 w-2 rounded-full bg-[#28C840]" />
            </div>
            <p className="text-[12px] font-semibold text-[#6E6E73]">Activity Stream</p>
          </div>
          <p className="text-[12px] text-[#6E6E73]">{filtered.length} events</p>
        </div>

        <div className="grid min-w-[1100px] grid-cols-[220px_220px_220px_150px_1fr] gap-4 border-b border-[rgba(0,0,0,0.06)] px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#AEAEB2]">
          <span>Actor</span>
          <span>Action</span>
          <span>Target</span>
          <span>Time</span>
          <span>Details</span>
        </div>

        {filtered.map((row) => (
          <AuditLogRow key={row.id} row={row} />
        ))}

        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-[13px] text-[#AEAEB2]">No audit events found.</div>
        ) : null}
      </div>
    </div>
  );
}
