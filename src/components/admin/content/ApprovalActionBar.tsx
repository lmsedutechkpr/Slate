'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog';
import type { ContentType } from './types';

interface ApprovalActionBarProps {
  item: {
    id: string;
    status?: string | null;
    created_at?: string | null;
    published_at?: string | null;
    rejection_reason?: string | null;
    title?: string | null;
    name?: string | null;
    thumbnail_url?: string | null;
    images?: string[] | null;
  };
  type: ContentType;
  loading?: boolean;
  onApprove: (note: string) => void;
  onReject: (reason: string) => void;
  onRevoke: (reason: string) => void;
  onMarkPending: () => void;
}

const COURSE_REASONS = [
  'Incomplete content',
  'Low quality lectures',
  'Misleading description',
  'Copyright violation',
  'Inappropriate content',
  'Pricing issues',
  'Technical problems',
  'Insufficient lectures (min 5)',
];

const PRODUCT_REASONS = [
  'Prohibited item',
  'Misleading description',
  'Poor quality images',
  'Pricing too high',
  'Counterfeit concern',
  'Incomplete information',
  'Category mismatch',
];

function statusVisual(statusRaw?: string | null) {
  const status = (statusRaw || 'draft').toLowerCase();
  if (status === 'pending') {
    return {
      icon: Clock3,
      badgeClass: 'bg-[#FFF8EC] text-[#FEBC2E]',
      label: 'Pending Review',
      helper: 'Submitted and waiting for moderation',
    };
  }
  if (status === 'approved' || status === 'active') {
    return {
      icon: CheckCircle2,
      badgeClass: 'bg-[#EDFAF0] text-[#28C840]',
      label: 'Live on Platform',
      helper: 'Visible to customers',
    };
  }
  if (status === 'rejected') {
    return {
      icon: XCircle,
      badgeClass: 'bg-[#FFF0EF] text-[#FF5F57]',
      label: 'Rejected',
      helper: 'Waiting for creator updates',
    };
  }
  return {
    icon: Clock3,
    badgeClass: 'bg-[#F5F5F7] text-[#AEAEB2]',
    label: 'Draft',
    helper: 'Not visible on platform',
  };
}

export default function ApprovalActionBar({
  item,
  type,
  loading = false,
  onApprove,
  onReject,
  onRevoke,
  onMarkPending,
}: ApprovalActionBarProps) {
  const [notes, setNotes] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [rejectMessage, setRejectMessage] = useState('');
  const [revokeReason, setRevokeReason] = useState('');

  const label = item.title || item.name || (type === 'course' ? 'Course' : 'Product');
  const reasons = type === 'course' ? COURSE_REASONS : PRODUCT_REASONS;
  const visual = statusVisual(item.status);
  const submittedAgo = item.created_at
    ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true })
    : 'recently';

  const rejectTemplate = useMemo(() => {
    const list = selectedReasons.length > 0 ? selectedReasons.join(', ') : '[reasons]';
    if (type === 'course') {
      return `Thank you for submitting your course. After review, we found the following issues that need to be addressed: ${list}. Please update and resubmit.`;
    }
    return `Thank you for listing your product. Please address the following before resubmission: ${list}.`;
  }, [selectedReasons, type]);

  const rejectionPayload = useMemo(() => {
    const merged = `${selectedReasons.join(', ')}: ${rejectMessage}`.trim();
    return merged.replace(/^:\s*/, '');
  }, [selectedReasons, rejectMessage]);

  const submitReject = () => {
    if (rejectMessage.trim().length < 50) return;
    onReject(rejectionPayload);
    setRejectOpen(false);
  };

  const DesktopCard = (
    <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] lg:sticky lg:top-6">
      <div className="flex items-center gap-2 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-4 py-3">
        <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
        <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
        <span className="h-2 w-2 rounded-full bg-[#28C840]" />
        <span className="ml-1 text-[12px] font-semibold text-[#6E6E73]">Review Decision</span>
      </div>

      <div className="p-5">
        <div className={`rounded-2xl p-4 text-center ${visual.badgeClass}`}>
          <visual.icon className="mx-auto h-5 w-5" />
          <p className="mt-2 font-[DM_Sans] text-[16px] font-bold">{visual.label}</p>
          <p className="text-[12px] opacity-80">{visual.helper}</p>
        </div>

        <p className="mt-2 text-center text-[12px] text-[#AEAEB2]">Submitted {submittedAgo}</p>

        <div className="mt-5">
          <label className="mb-2 block text-[12px] uppercase tracking-wide text-[#AEAEB2]">
            Internal notes (optional):
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add review notes..."
            className="w-full resize-none rounded-xl border-0 bg-[#F5F5F7] p-3 text-[12px] text-[#1D1D1F] outline-none"
          />
        </div>

        {(item.status || '').toLowerCase() === 'pending' ? (
          <>
            <button
              type="button"
              disabled={loading}
              onClick={() => onApprove(notes)}
              className="mt-4 w-full rounded-full bg-[#28C840] py-3 text-[14px] font-bold text-white disabled:opacity-60"
            >
              Approve & Publish
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => setRejectOpen(true)}
              className="mt-3 w-full rounded-full border border-[#FF5F57]/30 py-3 text-[14px] font-semibold text-[#FF5F57] disabled:opacity-60"
            >
              Reject with Feedback
            </button>
          </>
        ) : (item.status || '').toLowerCase() === 'approved' || (item.status || '').toLowerCase() === 'active' ? (
          <>
            <div className="mt-4 rounded-xl bg-[#EDFAF0] p-3 text-[12px] text-[#28C840]">
              Published {item.published_at ? new Date(item.published_at).toLocaleDateString() : 'recently'}
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={() => setRevokeOpen(true)}
              className="mt-3 w-full rounded-full border border-[#FEBC2E]/30 py-2.5 text-[13px] text-[#FEBC2E] disabled:opacity-60"
            >
              Revoke Approval
            </button>
          </>
        ) : (item.status || '').toLowerCase() === 'rejected' ? (
          <>
            <div className="mt-4 rounded-xl bg-[#FFF0EF] p-3 text-[12px] text-[#FF5F57]">
              Rejected: {item.rejection_reason || 'Feedback shared with creator.'}
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={onMarkPending}
              className="mt-3 w-full rounded-full border border-[rgba(0,0,0,0.1)] py-2.5 text-[13px] text-[#1D1D1F] disabled:opacity-60"
            >
              Mark as Pending (Re-review)
            </button>
          </>
        ) : null}
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden lg:block">{DesktopCard}</div>

      <div className="fixed inset-x-4 bottom-4 z-20 rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-3 shadow-[0_2px_12px_rgba(0,0,0,0.08)] lg:hidden">
        {(item.status || '').toLowerCase() === 'pending' ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => onApprove(notes)}
              className="rounded-full bg-[#28C840] px-4 py-2.5 text-[13px] font-semibold text-white"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => setRejectOpen(true)}
              className="rounded-full border border-[#FF5F57]/30 px-4 py-2.5 text-[13px] font-semibold text-[#FF5F57]"
            >
              Reject
            </button>
          </div>
        ) : (item.status || '').toLowerCase() === 'approved' || (item.status || '').toLowerCase() === 'active' ? (
          <button
            type="button"
            disabled={loading}
            onClick={() => setRevokeOpen(true)}
            className="w-full rounded-full border border-[#FEBC2E]/30 px-4 py-2.5 text-[13px] text-[#FEBC2E]"
          >
            Revoke Approval
          </button>
        ) : (item.status || '').toLowerCase() === 'rejected' ? (
          <button
            type="button"
            disabled={loading}
            onClick={onMarkPending}
            className="w-full rounded-full border border-[rgba(0,0,0,0.1)] px-4 py-2.5 text-[13px] text-[#1D1D1F]"
          >
            Mark as Pending
          </button>
        ) : null}
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent
          className="max-w-md overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
          showCloseButton={false}
        >
          <div className="p-6">
            <h3 className="font-[DM_Sans] text-[18px] font-bold text-[#1D1D1F]">
              Reject {type === 'course' ? 'Course' : 'Product'}
            </h3>

            <p className="mt-2 line-clamp-2 text-[13px] text-[#6E6E73]">{label}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {reasons.map((reason) => {
                const active = selectedReasons.includes(reason);
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() =>
                      setSelectedReasons((prev) =>
                        prev.includes(reason) ? prev.filter((x) => x !== reason) : [...prev, reason]
                      )
                    }
                    className={`rounded-full px-3 py-1.5 text-[12px] ${
                      active ? 'bg-[#FF5F57] text-white' : 'bg-[#F5F5F7] text-[#6E6E73]'
                    }`}
                  >
                    {reason}
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              <textarea
                rows={4}
                value={rejectMessage}
                onChange={(e) => setRejectMessage(e.target.value)}
                placeholder="Explain what needs to be fixed before resubmission..."
                className="w-full resize-none rounded-xl bg-[#F5F5F7] p-3 text-[13px] text-[#1D1D1F] outline-none"
              />
              <p className="mt-1 text-[11px] text-[#AEAEB2]">Minimum 50 characters required.</p>
            </div>

            <button
              type="button"
              onClick={() => setRejectMessage(rejectTemplate)}
              className="mt-2 text-[12px] font-semibold text-[#1D1D1F] underline"
            >
              Use template
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-6 py-4">
            <DialogClose asChild>
              <button className="rounded-full px-4 py-2 text-[13px] text-[#6E6E73]">Cancel</button>
            </DialogClose>
            <button
              type="button"
              disabled={rejectMessage.trim().length < 50 || loading}
              onClick={submitReject}
              className="rounded-full bg-[#FF5F57] px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
            >
              Send Rejection
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <DialogContent className="max-w-md rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-0" showCloseButton={false}>
          <div className="p-6">
            <h3 className="font-[DM_Sans] text-[18px] font-bold text-[#1D1D1F]">Revoke Approval</h3>
            <p className="mt-2 text-[13px] text-[#6E6E73]">
              Provide a reason for revoking this {type}. It will be moved back to draft.
            </p>
            <textarea
              rows={4}
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="Optional explanation for creator..."
              className="mt-4 w-full resize-none rounded-xl bg-[#F5F5F7] p-3 text-[13px] text-[#1D1D1F] outline-none"
            />
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-6 py-4">
            <DialogClose asChild>
              <button className="rounded-full px-4 py-2 text-[13px] text-[#6E6E73]">Cancel</button>
            </DialogClose>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                onRevoke(revokeReason);
                setRevokeOpen(false);
              }}
              className="rounded-full border border-[#FEBC2E]/30 px-5 py-2 text-[13px] font-semibold text-[#FEBC2E]"
            >
              Revoke Now
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
