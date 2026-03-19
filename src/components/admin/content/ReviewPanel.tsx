'use client';

import { AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { ContentType } from './types';

interface ReviewPanelProps {
  type: ContentType;
  submittedAt?: string | null;
  creatorName: string;
  isResubmission?: boolean;
  onApprove: () => void;
  onReject: () => void;
}

export default function ReviewPanel({
  type,
  submittedAt,
  creatorName,
  isResubmission = false,
  onApprove,
  onReject,
}: ReviewPanelProps) {
  const ago = submittedAt ? formatDistanceToNow(new Date(submittedAt), { addSuffix: true }) : 'recently';

  return (
    <div className="mb-6 rounded-2xl border border-[#FEBC2E]/30 bg-[#FFF8EC] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#FEBC2E]" />

        <div className="flex-1">
          <h3 className="font-[DM_Sans] text-[15px] font-bold text-[#1D1D1F]">Awaiting Your Review</h3>
          <p className="mt-1 text-[13px] text-[#6E6E73]">
            This {type} was submitted {ago} and is waiting for approval before going live.
          </p>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[#6E6E73]">
            <span>
              Submitted by: <strong className="font-[DM_Sans] font-semibold text-[#1D1D1F]">{creatorName}</strong>
            </span>
            <span>
              Date: {submittedAt ? new Date(submittedAt).toLocaleDateString() : 'N/A'}
            </span>
            <span>Version: {isResubmission ? 'Resubmission' : 'First submission'}</span>
          </div>
        </div>

        <div className="flex gap-2 lg:ml-auto">
          <button
            type="button"
            onClick={onApprove}
            className="rounded-full bg-[#28C840] px-5 py-2 text-[13px] font-semibold text-white"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={onReject}
            className="rounded-full border border-[#FF5F57]/30 px-5 py-2 text-[13px] font-semibold text-[#FF5F57]"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
