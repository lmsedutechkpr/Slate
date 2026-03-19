import PayoutsPageClient from '@/components/admin/payouts/PayoutsPageClient';
import { getHydratedPayouts } from '@/app/api/admin/payouts/route';

export const dynamic = 'force-dynamic';

export default async function AdminPayoutsPage() {
  const data = await getHydratedPayouts();
  const { payoutTransactions, instructorsPending, sellersPending } = data;

  const pendingAmount = payoutTransactions
    .filter((p: any) => (p.status || '').toLowerCase() === 'pending')
    .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

  const pendingRequests = payoutTransactions.filter(
    (p: any) => (p.status || '').toLowerCase() === 'pending'
  ).length;

  const currentMonthPrefix = new Date().toISOString().slice(0, 7);
  const processedThisMonthDetails = payoutTransactions.filter(
    (p: any) =>
      ['processed', 'completed', 'approved'].includes((p.status || '').toLowerCase()) &&
      String(p.completed_at || p.processed_at || p.created_at || '').startsWith(currentMonthPrefix)
  );

  const processedThisMonth = processedThisMonthDetails.length;
  const totalProcessedAmount = processedThisMonthDetails.reduce(
    (sum: number, p: any) => sum + Number(p.amount || 0),
    0
  );

  const totalPaidOutFromTransactions = payoutTransactions
    .filter((p: any) => ['processed', 'completed', 'approved'].includes((p.status || '').toLowerCase()))
    .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

  const totalPaidOutFromProfiles =
    instructorsPending.reduce((sum: number, p: any) => sum + Number(p.total_paid_out || 0), 0) +
    sellersPending.reduce((sum: number, p: any) => sum + Number(p.total_paid_out || 0), 0);

  const totalPaidOut = totalPaidOutFromTransactions || totalPaidOutFromProfiles;

  const instructorsWaitingCount = payoutTransactions.filter(
    (p: any) =>
      (p.status || '').toLowerCase() === 'pending' &&
      String(p.role || p.recipient_type || '').toLowerCase() !== 'seller'
  ).length;

  const sellersWaitingCount = payoutTransactions.filter(
    (p: any) =>
      (p.status || '').toLowerCase() === 'pending' &&
      String(p.role || p.recipient_type || '').toLowerCase() === 'seller'
  ).length;

  return (
    <div className="p-6">
      <PayoutsPageClient
        payoutTransactions={payoutTransactions}
        instructorsPending={instructorsPending}
        sellersPending={sellersPending}
        stats={{
          totalPending: pendingAmount,
          totalPaidOut,
          instructorsPending: instructorsWaitingCount || instructorsPending.length,
          sellersPending: sellersWaitingCount || sellersPending.length,
          pendingRequests,
          processedThisMonth,
          totalProcessedAmount,
          pendingAmount,
        }}
      />
    </div>
  );
}
