'use client';

import { CalendarClock, Clock3, MessageSquare, RotateCcw, ShieldAlert, Store, User, X } from 'lucide-react';
import { Sheet, SheetClose, SheetContent } from '@/components/ui/sheet';

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function pendingHours(createdAt?: string) {
  if (!createdAt) return 0;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return 0;
  const diff = Date.now() - date.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
}

export default function ReturnDetailDrawer({
  open,
  onOpenChange,
  row,
  onApprove,
  onReject,
  onRemindSeller,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  row: any | null;
  onApprove: (row: any) => Promise<void>;
  onReject: (row: any) => Promise<void>;
  onRemindSeller: (row: any) => Promise<void>;
}) {
  const status = String(row?.status || '').toLowerCase();
  const isPending = status === 'requested' || status === 'pending';
  const canRemindSeller = isPending && pendingHours(row?.created_at) > 24;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="!max-w-[560px] !w-[92vw] !bg-white !text-[#1D1D1F] border-l border-[rgba(0,0,0,0.08)] p-0">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.08)] px-5 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#AEAEB2]">Return Details</p>
              <h3 className="mt-1 font-mono text-[14px] font-bold text-[#1D1D1F]">#{String(row?.id || '').slice(0, 8)}</h3>
            </div>
            <SheetClose asChild>
              <button className="rounded-lg border border-[rgba(0,0,0,0.08)] p-1.5 text-[#6E6E73]">
                <X className="h-4 w-4" />
              </button>
            </SheetClose>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <section className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-[#FAFAFB] p-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#AEAEB2]">Product</p>
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 overflow-hidden rounded-xl bg-[#F2F2F7]">
                  {row?.order_items?.products?.images?.[0] ? (
                    <img src={row.order_items.products.images[0]} alt="product" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div>
                  <p className="line-clamp-2 text-[13px] font-semibold text-[#1D1D1F]">{row?.order_items?.products?.name || 'Product'}</p>
                  <p className="mt-0.5 text-[12px] text-[#6E6E73]">Amount: ₹{Math.round(Number(row?.order_items?.total_price || 0)).toLocaleString('en-IN')}</p>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#AEAEB2]">Customer</p>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-[#6E6E73]" />
                  <p className="text-[13px] font-medium text-[#1D1D1F]">{row?.profiles?.full_name || row?.profiles?.display_name || 'Customer'}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#AEAEB2]">Seller</p>
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-[#6E6E73]" />
                  <p className="text-[13px] font-medium text-[#1D1D1F]">{row?.order_items?.seller_profiles?.store_name || 'Seller'}</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#AEAEB2]">Reason</p>
              <p className="text-[13px] font-semibold text-[#1D1D1F]">{String(row?.reason || 'other').replace(/_/g, ' ')}</p>
              <p className="mt-2 text-[12px] leading-relaxed text-[#6E6E73]">{row?.description || 'No description provided.'}</p>
            </section>

            <section className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[#AEAEB2]">Timeline</p>
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-[12px]">
                  <RotateCcw className="mt-0.5 h-3.5 w-3.5 text-[#007AFF]" />
                  <div>
                    <p className="font-semibold text-[#1D1D1F]">Return Requested</p>
                    <p className="text-[#6E6E73]">{formatDate(row?.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-[12px]">
                  <MessageSquare className="mt-0.5 h-3.5 w-3.5 text-[#FEBC2E]" />
                  <div>
                    <p className="font-semibold text-[#1D1D1F]">Seller Response</p>
                    <p className="text-[#6E6E73]">{row?.seller_response || 'Awaiting response'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-[12px]">
                  <CalendarClock className="mt-0.5 h-3.5 w-3.5 text-[#28C840]" />
                  <div>
                    <p className="font-semibold text-[#1D1D1F]">Last Updated</p>
                    <p className="text-[#6E6E73]">{formatDate(row?.updated_at)}</p>
                  </div>
                </div>

                {isPending ? (
                  <div className="flex items-start gap-2 text-[12px]">
                    <Clock3 className="mt-0.5 h-3.5 w-3.5 text-[#FF5F57]" />
                    <div>
                      <p className="font-semibold text-[#1D1D1F]">Pending Duration</p>
                      <p className="text-[#6E6E73]">{pendingHours(row?.created_at)} hours</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          </div>

          <div className="border-t border-[rgba(0,0,0,0.08)] px-5 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => row && onApprove(row)}
                className="h-9 rounded-xl bg-[#28C840] px-4 text-[12px] font-semibold text-white disabled:opacity-60"
                disabled={!row || !isPending}
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => row && onReject(row)}
                className="h-9 rounded-xl bg-[#FF5F57] px-4 text-[12px] font-semibold text-white disabled:opacity-60"
                disabled={!row || !isPending}
              >
                Reject
              </button>
              {canRemindSeller ? (
                <button
                  type="button"
                  onClick={() => row && onRemindSeller(row)}
                  className="inline-flex h-9 items-center gap-1 rounded-xl border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[12px] font-semibold text-[#1D1D1F]"
                >
                  <ShieldAlert className="h-3.5 w-3.5 text-[#FEBC2E]" />
                  Send Seller Reminder
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
