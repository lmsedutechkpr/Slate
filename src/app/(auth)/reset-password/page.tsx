'use client';

import {useState, useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import * as z from 'zod';
import {useTranslations} from 'next-intl';
import {AlertCircle, Loader2} from 'lucide-react';
import {useRouter, useSearchParams} from 'next/navigation';

import AuthWindow from '@/components/auth/AuthWindow';
import {PasswordStrengthBar} from '@/components/auth/PasswordStrengthBar';
import {createClient} from '@/lib/supabase/client';

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Min 8 characters')
      .regex(/[A-Z]/, 'Must contain one uppercase letter')
      .regex(/[0-9]/, 'Must contain one number'),
    confirm: z.string()
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords don't match",
    path: ['confirm']
  });

type ResetFormValues = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const t = useTranslations('auth.resetPassword');
  const tLogin = useTranslations('auth.login');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const forced = searchParams.get('forced') === 'true';
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const {
        data: {session}
      } = await supabase.auth.getSession();
      if (!session && !forced) {
        router.push('/forgot-password');
      }
    };
    checkSession();
  }, [forced, router]);

  const {
    register,
    handleSubmit,
    watch,
    formState: {errors}
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema)
  });

  const passwordValue = watch('password');

  const onSubmit = async (data: ResetFormValues) => {
    setIsLoading(true);
    setErrorCode(null);

    try {
      const supabase = createClient();
      const {error, data: authData} = await supabase.auth.updateUser({
        password: data.password
      });

      if (error) {
        setErrorCode(error.message);
        return;
      }

      if (authData.user) {
        await supabase.from('profiles').update({must_change_password: false}).eq('id', authData.user.id);

        const {data: profile} = await supabase.from('profiles').select('role').eq('id', authData.user.id).single();

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

  return (
    <AuthWindow title={t('title')} width="sm">
      <div className="text-center">
        {forced ? (
          <>
            <h1 className="font-sans text-[22px] font-bold text-[var(--text)]">{t('forcedTitle')}</h1>
            <div className="mx-auto mt-3 max-w-[90%] rounded-xl border border-[var(--traffic-yellow)]/20 bg-[rgba(254,188,46,0.08)] px-4 py-3 text-[13px] text-[var(--traffic-yellow)]">
              {t('forcedSubtitle')}
            </div>
          </>
        ) : (
          <>
            <h1 className="font-sans text-[22px] font-bold text-[var(--text)]">{t('title')}</h1>
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{t('subtitle')}</p>
          </>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">
            {t('newPassword')}
          </label>
          <div className="relative">
            <input
              {...register('password')}
              type="password"
              placeholder={tLogin('passwordPlaceholder')}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2.5 text-[14px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[rgba(0,0,0,0.25)] focus:bg-[var(--surface)] focus:outline-none"
            />
          </div>
          <PasswordStrengthBar password={passwordValue} />
          {errors.password && (
            <p className="mt-1.5 flex items-center gap-1 text-[12px] text-[var(--traffic-red)]">
              <AlertCircle className="h-3 w-3" />
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">
            {t('confirmPassword')}
          </label>
          <div className="relative">
            <input
              {...register('confirm')}
              type="password"
              placeholder={tLogin('passwordPlaceholder')}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2.5 text-[14px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[rgba(0,0,0,0.25)] focus:bg-[var(--surface)] focus:outline-none"
            />
          </div>
          {errors.confirm && (
            <p className="mt-1.5 flex items-center gap-1 text-[12px] text-[var(--traffic-red)]">
              <AlertCircle className="h-3 w-3" />
              {errors.confirm.message}
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
          disabled={isLoading}
          className="w-full rounded-full bg-[var(--white-surface)] py-2.5 text-[14px] font-semibold text-[var(--white-text)] transition-all duration-150 hover:scale-[1.01] hover:bg-[rgba(0,0,0,0.8)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : t('submit')}
        </button>
      </form>
    </AuthWindow>
  );
}
