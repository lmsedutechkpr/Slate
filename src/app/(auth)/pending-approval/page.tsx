'use client';

import {useState, useEffect} from 'react';
import {useTranslations} from 'next-intl';
import {CheckCircle2, Hourglass, XCircle} from 'lucide-react';
import {useSearchParams} from 'next/navigation';
import {formatDistanceToNow} from 'date-fns';
import {motion} from 'framer-motion';

import AuthWindow from '@/components/auth/AuthWindow';
import {createClient} from '@/lib/supabase/client';
import {Link} from '@/i18n/navigation';

export default function PendingApprovalPage() {
  const t = useTranslations('auth.pending');
  const searchParams = useSearchParams();
  const role = searchParams.get('role') ?? 'instructor';
  const email = searchParams.get('email');

  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!email) return;

    const supabase = createClient();

    const fetchInitialData = async () => {
      const {data, error} = await supabase
        .from('registration_applications')
        .select('status, rejection_reason, submitted_at')
        .eq('email', email)
        .order('submitted_at', {ascending: false})
        .limit(1)
        .single();

      if (!error && data) {
        setStatus(data.status);
        setRejectionReason(data.rejection_reason);
        setSubmittedAt(data.submitted_at);
      }
    };

    fetchInitialData();

    const channel = supabase
      .channel(`application-status-${email}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'registration_applications',
          filter: `email=eq.${email}`
        },
        (payload) => {
          setStatus(payload.new.status);
          setRejectionReason(payload.new.rejection_reason);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [email]);

  if (status === 'approved') {
    return (
      <AuthWindow title={`Slate — ${typeof role === 'string' ? role.charAt(0).toUpperCase() + role.slice(1) : ''} Approved`} width="sm">
        <motion.div
          initial={{scale: 0.95, opacity: 0}}
          animate={{scale: 1, opacity: 1}}
          transition={{duration: 0.35, ease: 'easeOut'}}
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--traffic-green)]/20 bg-[rgba(40,200,64,0.1)]">
            <CheckCircle2 className="h-7 w-7 text-[var(--traffic-green)]" />
          </div>

          <div className="mt-4 text-center">
            <h1 className="font-sans text-[20px] font-bold text-[var(--text)]">{t('approvedTitle')}</h1>
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{t('approvedSubtitle', {role})}</p>
          </div>

          <Link
            href="/login"
            className="mx-auto mt-6 flex w-fit items-center justify-center rounded-full bg-[var(--white-surface)] px-6 py-2.5 text-[14px] font-semibold text-[var(--white-text)] shadow-sm transition-all duration-150 hover:scale-[1.01] hover:bg-[rgba(0,0,0,0.8)] hover:shadow-md"
          >
            {t('goDashboard')}
          </Link>
        </motion.div>
      </AuthWindow>
    );
  }

  if (status === 'rejected') {
    return (
      <AuthWindow title={`Slate — ${typeof role === 'string' ? role.charAt(0).toUpperCase() + role.slice(1) : ''} Rejected`} width="sm">
        <motion.div
          initial={{scale: 0.95, opacity: 0}}
          animate={{scale: 1, opacity: 1}}
          transition={{duration: 0.35, ease: 'easeOut'}}
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--traffic-red)]/20 bg-[rgba(255,95,87,0.1)]">
            <XCircle className="h-7 w-7 text-[var(--traffic-red)]" />
          </div>

          <div className="mt-4 text-center">
            <h1 className="font-sans text-[20px] font-bold text-[var(--text)]">{t('rejectedTitle')}</h1>
          </div>

          {rejectionReason && (
            <div className="mt-4 rounded-xl border border-[var(--traffic-red)]/15 bg-[rgba(255,95,87,0.06)] px-4 py-3 text-[13px] text-[var(--text-secondary)]">
              {t('reason', {reason: rejectionReason})}
            </div>
          )}

          <Link
            href={`/signup?role=${role}`}
            className="mx-auto mt-6 flex w-fit items-center justify-center gap-2 rounded-full border border-[var(--border-hover)] bg-[var(--surface-raised)] px-6 py-2.5 text-[14px] font-medium text-[var(--text)] transition-all duration-150 hover:bg-[rgba(0,0,0,0.05)]"
          >
            {t('applyAgain')}
          </Link>

          <div className="mt-4 text-center">
            <Link
              href="/support"
              className="text-[13px] font-medium text-[var(--text-secondary)] underline-offset-4 transition-colors hover:text-[var(--text)] hover:underline"
            >
              {t('contactSupport')}
            </Link>
          </div>
        </motion.div>
      </AuthWindow>
    );
  }

  return (
    <AuthWindow title="Slate — Application Received" width="sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--traffic-yellow)]/20 bg-[rgba(254,188,46,0.1)]">
        <Hourglass className="h-7 w-7 text-[var(--traffic-yellow)]" />
      </div>

      <div className="mt-4 text-center">
        <h1 className="font-sans text-[20px] font-bold text-[var(--text)]">{t('receivedTitle')}</h1>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{t('receivedSubtitle', {role})}</p>
      </div>

      <div className="mt-5 rounded-xl border border-[var(--traffic-yellow)]/15 bg-[rgba(254,188,46,0.06)] px-4 py-3 text-[13px] leading-relaxed text-[var(--text-secondary)]">
        {t('info')}
      </div>

      {submittedAt && (
        <p className="mt-4 text-center text-[12px] text-[var(--text-muted)]">
          {t('submittedAt', {time: formatDistanceToNow(new Date(submittedAt), {addSuffix: true})})}
        </p>
      )}

      <div className="mt-4 flex items-center justify-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--traffic-yellow)]" />
        <span className="text-[12px] font-medium text-[var(--text-muted)]">{t('waiting')}</span>
      </div>
    </AuthWindow>
  );
}
