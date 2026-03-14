'use client';

import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import * as z from 'zod';
import {useTranslations} from 'next-intl';
import {AlertCircle, Loader2} from 'lucide-react';
import {useRouter, useSearchParams} from 'next/navigation';
import AuthWindow from '@/components/auth/AuthWindow';
import {PasswordInput} from '@/components/auth/PasswordInput';
import {createClient} from '@/lib/supabase/client';
import {Link} from '@/i18n/navigation';
import {Checkbox} from '@/components/ui/checkbox';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean()
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const tAuth = useTranslations('auth');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  const {
    register,
    handleSubmit,
    formState: {errors}
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false
    }
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setErrorCode(null);

    try {
      const supabase = createClient();
      const {data: authData, error} = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (error) {
        setErrorCode(error.message);
        return;
      }

      if (authData.user) {
        // Fetch profile
        const {data: profile} = await supabase
          .from('profiles')
          .select('id, role, status, must_change_password, first_login_at')
          .eq('id', authData.user.id)
          .single();

        if (profile?.status === 'pending_approval') {
          router.push('/pending-approval');
          return;
        }

        if (profile?.status === 'suspended') {
          setErrorCode('suspended');
          await supabase.auth.signOut();
          return;
        }

        if (profile && !profile.first_login_at) {
          await supabase.from('profiles').update({first_login_at: new Date().toISOString()}).eq('id', authData.user.id);
        }

        if (profile?.must_change_password) {
          router.push('/reset-password?forced=true');
          return;
        }

        if (callbackUrl && callbackUrl.startsWith('/')) {
          router.push(callbackUrl);
          return;
        }

        const redirectMap: Record<string, string> = {
          admin: '/admin/dashboard',
          instructor: '/instructor/dashboard',
          seller: '/seller/dashboard',
          student: '/student/dashboard'
        };

        router.push(redirectMap[profile?.role ?? 'student'] ?? '/student/dashboard');
      }
    } catch {
      setErrorCode('default');
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  };

  const getFriendlyErrorMessage = (code: string) => {
    if (code.includes('Invalid login credentials')) return t('errors.invalidCredentials');
    if (code.includes('Email not confirmed')) return t('errors.emailNotConfirmed');
    if (code === 'suspended') return t('errors.suspended');
    return t('errors.default');
  };

  return (
    <AuthWindow title={t('title', {action: 'Sign In'})} width="sm">
      <div className="text-center">
        <h1 className="font-sans text-[24px] font-bold text-[var(--text)]">{t('title')}</h1>
        <p className="mt-1 text-[14px] text-[var(--text-secondary)]">{t('subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">
            {t('email')}
          </label>
          <input
            {...register('email')}
            type="email"
            id="email"
            placeholder={t('emailPlaceholder')}
            autoComplete="email"
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

        <div>
          <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">
            {t('password')}
          </label>
          <div className="relative">
            <PasswordInput
              {...register('password')}
              id="password"
              placeholder={t('passwordPlaceholder')}
              autoComplete="current-password"
              className={`w-full rounded-xl border bg-[var(--surface-raised)] px-4 py-2.5 text-[14px] text-[var(--text)] transition-all duration-150 placeholder:text-[var(--text-muted)] focus:bg-[var(--surface)] focus:outline-none ${
                errors.password
                  ? 'border-[var(--traffic-red)] bg-[rgba(255,95,87,0.05)]'
                  : 'border-[var(--border)] focus:border-[rgba(0,0,0,0.25)]'
              }`}
            />
          </div>
          {errors.password && (
            <p className="mt-1.5 flex items-center gap-1 text-[12px] text-[var(--traffic-red)]">
              <AlertCircle className="h-3 w-3" />
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox id="remember" className="border-[var(--border-hover)] data-[state=checked]:bg-[var(--text)] data-[state=checked]:border-[var(--text)] data-[state=checked]:text-[var(--bg)]" {...register('remember')} />
            <label
              htmlFor="remember"
              className="text-[13px] font-medium leading-none text-[var(--text-secondary)] peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {t('rememberMe')}
            </label>
          </div>
          <Link
            href="/forgot-password"
            className="text-[13px] font-medium text-[var(--text-secondary)] underline-offset-4 transition-colors hover:text-[var(--text)] hover:underline"
          >
            {t('forgotPassword')}
          </Link>
        </div>

        {errorCode && (
          <div className="flex items-start gap-2 rounded-xl border border-[var(--traffic-red)]/20 bg-[rgba(255,95,87,0.08)] px-4 py-3 text-[13px] text-[var(--traffic-red)]">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>{getFriendlyErrorMessage(errorCode)}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-full bg-[var(--text)] py-2.5 text-[14px] font-semibold text-[var(--bg)] transition-all duration-150 hover:scale-[1.01] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : t('submit')}
        </button>
      </form>

      <div className="mt-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--border)]" />
        <span className="text-[12px] text-[var(--text-muted)]">{tAuth('or')}</span>
        <div className="h-px flex-1 bg-[var(--border)]" />
      </div>

      <button
        type="button"
        onClick={signInWithGoogle}
        className="mt-6 flex w-full justify-center items-center gap-2 rounded-full border border-[var(--border-hover)] bg-[var(--surface-raised)] py-2.5 text-[14px] font-medium text-[var(--text)] transition-all duration-150 hover:bg-[rgba(0,0,0,0.05)]"
      >
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
          <path d="M1 1h22v22H1z" fill="none" />
        </svg>
        {t('google')}
      </button>

      <p className="mt-6 text-center text-[13px] text-[var(--text-secondary)]">
        {t('noAccount')}
        <Link
          href="/signup"
          className="font-medium text-[var(--text)] underline-offset-4 transition-colors hover:underline"
        >
          {t('signUpLink')}
        </Link>
      </p>
    </AuthWindow>
  );
}
