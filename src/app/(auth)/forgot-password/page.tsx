'use client';

import {useState, useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import * as z from 'zod';
import {useTranslations} from 'next-intl';
import {AlertCircle, CheckCircle2, Loader2} from 'lucide-react';

import AuthWindow from '@/components/auth/AuthWindow';
import {createClient} from '@/lib/supabase/client';
import {Link} from '@/i18n/navigation';

const forgotSchema = z.object({
  email: z.string().email('Enter a valid email')
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword');
  const tLogin = useTranslations('auth.login');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [emailSentTo, setEmailSentTo] = useState('');
  const [countdown, setCountdown] = useState(0);

  const {
    register,
    handleSubmit,
    formState: {errors}
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema)
  });

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const onSubmit = async (data: ForgotFormValues) => {
    setStatus('loading');
    setErrorCode(null);

    try {
      const supabase = createClient();
      const {error} = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        setErrorCode(error.message);
        setStatus('error');
        return;
      }

      setEmailSentTo(data.email);
      setStatus('sent');
      setCountdown(60);
    } catch {
      setErrorCode('default');
      setStatus('error');
    }
  };

  const resendEmail = async () => {
    if (countdown > 0) return;
    setStatus('loading');
    try {
      const supabase = createClient();
      await supabase.auth.resetPasswordForEmail(emailSentTo, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      setCountdown(60);
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <AuthWindow title={t('title')} width="sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--traffic-green)]/20 bg-[rgba(40,200,64,0.1)]">
          <CheckCircle2 className="h-7 w-7 text-[var(--traffic-green)]" />
        </div>
        <div className="text-center">
          <h1 className="font-sans text-[20px] font-bold text-[var(--text)]">{t('sentTitle')}</h1>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{t('sentSubtitle', {email: emailSentTo})}</p>
        </div>

        <button
          onClick={resendEmail}
          disabled={countdown > 0}
          className="mx-auto mt-6 block w-fit rounded-full border border-[var(--border-hover)] bg-[var(--surface-raised)] px-6 py-2.5 text-[13px] font-medium text-[var(--text)] transition-all hover:bg-[rgba(0,0,0,0.05)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {countdown > 0 ? t('resendWait', {seconds: countdown}) : t('resend')}
        </button>

        <div className="mt-8 text-center">
          <Link href="/login" className="text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text)]">
            {t('backLogin')}
          </Link>
        </div>
      </AuthWindow>
    );
  }

  return (
    <AuthWindow title={t('title')} width="sm">
      <div className="text-center">
        <h1 className="font-sans text-[22px] font-bold text-[var(--text)]">{t('title')}</h1>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{t('subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">
            {tLogin('email')}
          </label>
          <input
            {...register('email')}
            type="email"
            id="email"
            placeholder={tLogin('emailPlaceholder')}
            className={`w-full rounded-xl border bg-[var(--surface-raised)] px-4 py-2.5 text-[14px] text-[var(--text)] transition-all duration-150 placeholder:text-[var(--text-muted)] focus:bg-[var(--surface)] focus:outline-none ${
              errors.email
                ? 'border-[var(--traffic-red)] bg-[rgba(255,95,87,0.05)]'
                : 'border-[var(--border)] focus:border-[rgba(0,0,0,0.25)]'
            }`}
          />
          {errors.email && (
            <p className="mt-1.5 flex items-center gap-1 text-[12px] text-[var(--traffic-red)]">
              <AlertCircle className="h-3 w-3" />
              {errors.email.message}
            </p>
          )}
        </div>

        {errorCode && (
          <div className="flex items-start gap-2 rounded-xl border border-[var(--traffic-red)]/20 bg-[rgba(255,95,87,0.08)] px-4 py-3 text-[13px] text-[var(--traffic-red)]">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>{tLogin('errors.default')}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full rounded-full bg-[var(--white-surface)] py-2.5 text-[14px] font-semibold text-[var(--white-text)] transition-all duration-150 hover:scale-[1.01] hover:bg-[rgba(0,0,0,0.8)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === 'loading' ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : t('submit')}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="text-[13px] font-medium text-[var(--text-secondary)] underline-offset-4 transition-colors hover:text-[var(--text)] hover:underline"
        >
          {t('remembered')}
        </Link>
      </div>
    </AuthWindow>
  );
}
