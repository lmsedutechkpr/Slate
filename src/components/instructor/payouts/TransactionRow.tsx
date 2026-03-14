'use client';

import { format } from 'date-fns';
import { ArrowDownLeft, ArrowUpRight, Clock, AlertCircle } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'enrollment' | 'payout';
  status: 'paid' | 'pending' | 'failed';
  description: string;
  course_title?: string;
  gross_amount: number;
  net_amount: number;
  created_at: string;
}

interface Props {
  transaction: Transaction;
}

const statusStyles = {
  paid:    { bg: 'bg-[#EDFAF0]', text: 'text-[#28C840]', label: 'Paid' },
  pending: { bg: 'bg-[#FFF8EC]', text: 'text-[#FEBC2E]', label: 'Pending' },
  failed:  { bg: 'bg-[#FFF0EF]', text: 'text-[#FF5F57]', label: 'Failed' },
};

export default function TransactionRow({ transaction: t }: Props) {
  const ss = statusStyles[t.status] || statusStyles.pending;
  const isPayout = t.type === 'payout';

  let Icon = ArrowDownLeft;
  let iconColor = 'text-[#28C840]';
  if (t.status === 'pending') { Icon = Clock; iconColor = 'text-[#FEBC2E]'; }
  else if (t.status === 'failed') { Icon = AlertCircle; iconColor = 'text-[#FF5F57]'; }
  else if (isPayout) { Icon = ArrowUpRight; iconColor = 'text-[#1D1D1F]'; }

  const amountColor =
    t.status === 'failed' ? 'text-[#FF5F57]' :
    t.status === 'pending' ? 'text-[#FEBC2E]' :
    isPayout ? 'text-[#1D1D1F]' : 'text-[#28C840]';

  const amountPrefix = isPayout ? '−₹' : '+₹';

  return (
    <div className="px-4 py-3 flex items-center gap-3 hover:bg-[#F5F5F7] transition-colors">
      {/* Icon box */}
      <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-[#F5F5F7] flex items-center justify-center">
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>

      {/* Center */}
      <div className="flex-1 min-w-0">
        <div className="font-[DM_Sans] font-medium text-[13px] text-[#1D1D1F] truncate">
          {t.description}
        </div>
        <div className="text-[11px] text-[#AEAEB2] mt-0.5">
          {format(new Date(t.created_at), 'dd MMM yyyy')}
        </div>
      </div>

      {/* Right */}
      <div className="text-right flex-shrink-0">
        <div className={`font-[DM_Sans] font-bold text-[14px] ${amountColor}`}>
          {amountPrefix}{t.net_amount.toLocaleString('en-IN')}
        </div>
        <div className={`inline-flex items-center mt-1 font-[DM_Sans] font-semibold text-[10px] rounded-full px-2 py-0.5 ${ss.bg} ${ss.text}`}>
          {ss.label}
        </div>
      </div>
    </div>
  );
}
