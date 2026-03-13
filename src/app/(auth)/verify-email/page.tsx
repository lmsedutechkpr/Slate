'use client';

import {useState, useEffect} from 'react';
import {useTranslations} from 'next-intl';
import {Mail} from 'lucide-react';
import {useSearchParams} from 'next/navigation';
import AuthWindow from '@/components/auth/AuthWindow';
import {createClient} from '@/lib/supabase/client';
import {Link} from '@/i18n/navigation';

export default function VerifyEmailPage() {
  const t = useTranslations('auth.verifyEmail');
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleResend = async () => {
    if (countdown > 0 || !email) return;
    try {
      const supabase = createClient();
      await supabase.auth.resend({
        type: 'signup',
        email: email
      });
      setCountdown(60);
      alert(t('resentSuccess')); // Replace with toast if available
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthWindow title={t('title')} width="sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(0,0,0,0.1)] bg-[rgba(0,0,0,0.05)]">
        <Mail className="h-7 w-7 text-[var(--text)]" />
      </div>

      <div className="mt-5 text-center">
        <h1 className="font-sans text-[22px] font-bold text-[var(--text)]">{t('title')}</h1>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{t('subtitle')}</p>
      </div>

      <div className="mx-auto mt-2 w-fit rounded-xl bg-[var(--surface-raised)] px-4 py-2 text-center text-[14px] font-medium text-[var(--text)] shadow-sm">
        {email ?? 'No email provided'}
      </div>

      <p className="mt-4 text-center text-[13px] leading-relaxed text-[var(--text-muted)]">{t('instructions')}</p>

      <div className="my-6 h-px w-full bg-[var(--border)]" />

      <button
        onClick={handleResend}
        disabled={countdown > 0 || !email}
        className="mx-auto block w-fit rounded-full border border-[var(--border-hover)] bg-[var(--surface-raised)] px-6 py-2.5 text-[13px] font-medium text-[var(--text)] transition-all hover:bg-[rgba(0,0,0,0.05)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {countdown > 0 ? `Resend in ${countdown}s` : t('resend')}
      </button>

      <div className="mt-6 text-center">
        <Link
          href="/signup"
          className="text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors underline-offset-4 hover:underline"
        >
          {t('wrongEmail')}
        </Link>
      </div>
    </AuthWindow>
  );
}
