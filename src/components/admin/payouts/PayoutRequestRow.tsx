'use client';

import Image from 'next/image';

function statusClass(status?: string) {
  const s = (status || '').toLowerCase();
  if (s === 'processed' || s === 'completed' || s === 'approved') return 'bg-[#EDFAF0] text-[#28C840]';
  if (s === 'failed' || s === 'rejected') return 'bg-[#FFF0EF] text-[#FF5F57]';
  return 'bg-[#FFF8EC] text-[#FEBC2E]';
}

function getRecipientName(row: any) {
  const fullName = row?.profiles?.full_name || row?.profiles?.display_name;
  if (fullName) return String(fullName);

  const email = row?.profiles?.email;
  if (email && String(email).includes('@')) {
    return String(email).split('@')[0];
  }

  const id = String(row?.recipient_id || row?.instructor_id || row?.user_id || '').trim();
  if (id) return `User ${id.slice(0, 8)}`;

  return 'Unknown User';
}

export default function PayoutRequestRow({
  row,
  onProcess,
  onReject,
}: {
  row: any;
  onProcess: (row: any) => void;
  onReject: (row: any) => void;
}) {
  const created = row.created_at ? new Date(row.created_at) : null;

  return (
    <div className="grid min-w-[1060px] grid-cols-[250px_110px_170px_130px_150px_120px_130px] items-center gap-4 border-b border-[rgba(0,0,0,0.06)] px-5 py-4 hover:bg-[#F5F5F7]">
      <div className="flex items-center gap-2">
        <div className="relative h-8 w-8 overflow-hidden rounded-full bg-[#F5F5F7]">
          {row.profiles?.avatar_url ? <Image src={row.profiles.avatar_url} alt="avatar" fill className="object-cover" /> : null}
        </div>
        <div className="min-w-0">
            <p className="truncate text-[12px] text-[#1D1D1F]">{getRecipientName(row)}</p>
            <p className="truncate text-[11px] text-[#AEAEB2]">{row.profiles?.role || row.role || row.recipient_type || '-'}</p>
        </div>
      </div>

      <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold ${
        row.role === 'seller' ? 'bg-[#EDFAF0] text-[#28C840]' : 'bg-[#EFF6FF] text-[#3B82F6]'
      }`}>
        {row.role || row.profiles?.role || 'instructor'}
      </span>

      <div>
        <p className="text-[15px] font-bold text-[#1D1D1F]">₹{Math.round(row.amount || row.pending_balance || 0).toLocaleString('en-IN')}</p>
        <p className="text-[10px] text-[#AEAEB2]">of ₹{Math.round(row.pending_balance || row.amount || 0).toLocaleString('en-IN')} pending</p>
      </div>

      <div>
        <span className="rounded-full bg-[#F5F5F7] px-3 py-1 text-[11px] text-[#6E6E73]">{row.payout_method || 'bank'}</span>
      </div>

      <div>
        <p className="text-[12px] text-[#1D1D1F]">{created ? created.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</p>
        <p className="text-[10px] text-[#AEAEB2]">{created ? created.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}</p>
      </div>

      <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusClass(row.status)}`}>
          {String(row.status || 'pending').toLowerCase()}
      </span>

      <div>
        {(row.status || 'pending') === 'pending' ? (
          <>
            <button onClick={() => onProcess(row)} className="rounded-full bg-[#1D1D1F] px-4 py-1.5 text-[11px] font-semibold text-white">Process</button>
            <button onClick={() => onReject(row)} className="ml-1.5 rounded-full border border-[#FF5F57]/30 px-3 py-1.5 text-[11px] font-semibold text-[#FF5F57]">Reject</button>
          </>
        ) : (
          <span className="text-[11px] text-[#AEAEB2]">No actions</span>
        )}
      </div>
    </div>
  );
}
