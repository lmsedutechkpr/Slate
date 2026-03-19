import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { analyzeAdminCommerceSchema } from '@/lib/admin/commerceSchema';

type Row = Record<string, any>;

async function safeSelect(table: string, queryBuilder: (q: any) => any): Promise<Row[]> {
  const supabase = createAdminClient();
  try {
    const query = queryBuilder(supabase.from(table));
    const { data, error } = await query;
    if (error) return [];
    return (data || []) as Row[];
  } catch {
    return [];
  }
}

async function firstNonEmpty(candidates: Array<() => Promise<Row[]>>) {
  for (const candidate of candidates) {
    const rows = await candidate();
    if (rows.length > 0) return rows;
  }
  return [] as Row[];
}

export async function getHydratedPayouts() {
  try {
    const schema = await analyzeAdminCommerceSchema();

    const payoutTransactionsRaw =
      schema.payouts.sourceTable === 'payouts'
        ? await firstNonEmpty([
            () =>
              safeSelect('payouts', (q) =>
                q
                  .select('id,recipient_id,recipient_type,amount,status,created_at,processed_at,payout_method,currency,notes,reference')
                  .order('created_at', { ascending: false })
                  .limit(300),
              ),
            () =>
              safeSelect('payouts', (q) =>
                q
                  .select('id,recipient_id,recipient_type,amount,status,created_at')
                  .order('created_at', { ascending: false })
                  .limit(300),
              ),
          ])
        : await firstNonEmpty([
            () =>
              safeSelect('payout_transactions', (q) =>
                q
                  .select('id,user_id,instructor_id,seller_id,amount,payout_method,status,created_at,processed_at,notes,reference')
                  .order('created_at', { ascending: false })
                  .limit(300),
              ),
            () =>
              safeSelect('payout_transactions', (q) =>
                q
                  .select('id,instructor_id,amount,payout_method,status,created_at,processed_at,notes')
                  .order('created_at', { ascending: false })
                  .limit(300),
              ),
          ]);

    const instructorsRaw =
      schema.payoutProfiles.instructorTable === 'instructor_profiles'
        ? await firstNonEmpty([
            () =>
              safeSelect('instructor_profiles', (q) =>
                q
                  .select('user_id,pending_payout,pending_balance,total_paid_out,payout_method')
                  .limit(500),
              ),
          ])
        : schema.payoutProfiles.instructorTable === 'instructor_payouts'
          ? await firstNonEmpty([
              () =>
                safeSelect('instructor_payouts', (q) =>
                  q
                    .select('user_id,pending_balance,total_paid_out,payout_method')
                    .limit(500),
                ),
            ])
          : [];

    const sellersRaw =
      schema.payoutProfiles.sellerTable === 'seller_profiles'
        ? await firstNonEmpty([
            () =>
              safeSelect('seller_profiles', (q) =>
                q
                  .select('user_id,pending_payout,pending_balance,total_paid_out,payout_method')
                  .limit(500),
              ),
          ])
        : schema.payoutProfiles.sellerTable === 'seller_payouts'
          ? await firstNonEmpty([
              () =>
                safeSelect('seller_payouts', (q) =>
                  q
                    .select('user_id,pending_balance,total_paid_out,payout_method')
                    .limit(500),
                ),
            ])
          : [];

    const userIds = new Set<string>();
    payoutTransactionsRaw.forEach((row) => {
      const id = String(row.recipient_id || row.user_id || row.instructor_id || row.seller_id || '').trim();
      if (id) userIds.add(id);
    });
    instructorsRaw.forEach((row) => {
      const id = String(row.user_id || '').trim();
      if (id) userIds.add(id);
    });
    sellersRaw.forEach((row) => {
      const id = String(row.user_id || '').trim();
      if (id) userIds.add(id);
    });

    const profileMap = new Map<string, Row>();
    if (userIds.size > 0) {
      const ids = Array.from(userIds);
      const profileRows = await safeSelect('profiles', (q) =>
        q.select('id,full_name,display_name,avatar_url,role').in('id', ids),
      );
      profileRows.forEach((row) => profileMap.set(String(row.id), row));
    }

    const payoutTransactions = payoutTransactionsRaw.map((row) => {
      const uid = String(row.recipient_id || row.user_id || row.instructor_id || row.seller_id || '').trim();
      const profile = uid ? profileMap.get(uid) || null : null;
      const roleFromDb = String(row.recipient_type || row.role || profile?.role || 'instructor').toLowerCase();
      const role = roleFromDb === 'seller' ? 'seller' : 'instructor';
      return {
        ...row,
        instructor_id: row.instructor_id || row.user_id || row.seller_id || row.recipient_id || null,
        profiles: profile,
        role,
        payout_method: row.payout_method || 'bank',
      };
    });

    const instructorsPending = instructorsRaw
      .map((row) => {
        const pending = Number(row.pending_balance ?? row.pending_payout ?? 0);
        return {
          ...row,
          pending_balance: pending,
          profiles: profileMap.get(String(row.user_id)) || null,
        };
      })
      .filter((row) => Number(row.pending_balance || 0) > 0);

    const sellersPending = sellersRaw
      .map((row) => {
        const pending = Number(row.pending_balance ?? row.pending_payout ?? 0);
        return {
          ...row,
          pending_balance: pending,
          profiles: profileMap.get(String(row.user_id)) || null,
        };
      })
      .filter((row) => Number(row.pending_balance || 0) > 0);

    return {
      payoutTransactions,
      instructorsPending,
      sellersPending,
    };
  } catch {
    return {
      payoutTransactions: [],
      instructorsPending: [],
      sellersPending: [],
    };
  }
}

export async function GET() {
  const data = await getHydratedPayouts();
  return NextResponse.json(data);
}
