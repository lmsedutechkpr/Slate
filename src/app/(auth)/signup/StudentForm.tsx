'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { PasswordInput } from '@/components/auth/PasswordInput';
import { PasswordStrengthBar } from '@/components/auth/PasswordStrengthBar';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import AuthWindow from '@/components/auth/AuthWindow';

const studentSchema = z
  .object({
    full_name: z.string().min(2, 'Name must be at least 2 chars'),
    email: z.string().email(),
    password: z
      .string()
      .min(8, 'Min 8 characters')
      .regex(/[A-Z]/, 'Must contain one uppercase letter')
      .regex(/[0-9]/, 'Must contain one number'),
    confirm_password: z.string(),
    language: z.enum(['en', 'ta'])
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password']
  });

type StudentFormValues = z.infer<typeof studentSchema>;

export function StudentForm({ onBack }: { onBack: () => void }) {
  const t = useTranslations('auth.signup');
  const tLogin = useTranslations('auth.login');
  const tAuth = useTranslations('auth');
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const {
    register: registerStudent,
    handleSubmit: handleSubmitStudent,
    watch: watchStudent,
    setValue: setStudentValue,
    formState: { errors: studentErrors }
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: { language: 'en' }
  });

  const studentLang = watchStudent('language');
  const studentPassword = watchStudent('password');

  const onStudentSubmit = async (data: StudentFormValues) => {
    setIsLoading(true);
    setErrorCode(null);

    try {
      const supabase = createClient();
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            role: 'student'
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        setErrorCode(error.message);
        return;
      }

      if (authData.user) {
        // Redundant upsert but keeps it perfectly synced
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          full_name: data.full_name,
          role: 'student',
          status: 'pending_verification',
          preferred_language: data.language,
          registration_source: 'self'
        });

        await supabase.from('user_preferences').upsert({
          user_id: authData.user.id,
          language: data.language
        });

        if (!authData.session) {
          router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
        } else {
          await supabase.from('profiles').update({ status: 'active' }).eq('id', authData.user.id);
          router.push('/student/dashboard');
        }
      }
    } catch {
      setErrorCode('default');
    } finally {
      setIsLoading(false);
    }
  };

  const getFriendlyErrorMessage = (code: string) => {
    if (code.includes('already registered')) return 'User already registered.';
    if (code.includes('Rate limit')) return 'Too many attempts. Try again later.';
    return tLogin('errors.default');
  };

  return (
    <AuthWindow title={`${tLogin('title').split(' ')[0]} — ${t('role.student')} Signup`} width="lg">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-1 text-[13px] text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
      >
        <ArrowLeft className="h-[13px] w-[13px]" />
        {t('student.changeRole')}
      </button>

      <div>
        <h1 className="font-sans text-[22px] font-bold text-[var(--text)]">{t('student.title')}</h1>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{t('student.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmitStudent(onStudentSubmit)} className="mt-8 space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">
              {t('student.fullName')}
            </label>
            <input
              {...registerStudent('full_name')}
              type="text"
              placeholder={t('student.fullNamePlaceholder')}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2.5 text-[14px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[rgba(0,0,0,0.25)] focus:bg-[var(--surface)] focus:outline-none"
            />
            {studentErrors.full_name && (
              <p className="mt-1.5 flex items-center gap-1 text-[12px] text-[var(--traffic-red)]">
                <AlertCircle className="h-3 w-3" />
                {studentErrors.full_name.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">
              {tLogin('email')}
            </label>
            <input
              {...registerStudent('email')}
              type="email"
              placeholder={tLogin('emailPlaceholder')}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2.5 text-[14px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[rgba(0,0,0,0.25)] focus:bg-[var(--surface)] focus:outline-none"
            />
            {studentErrors.email && (
              <p className="mt-1.5 flex items-center gap-1 text-[12px] text-[var(--traffic-red)]">
                <AlertCircle className="h-3 w-3" />
                {studentErrors.email.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">
              {tLogin('password')}
            </label>
            <div className="relative">
              <PasswordInput
                {...registerStudent('password')}
                placeholder={tLogin('passwordPlaceholder')}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2.5 text-[14px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[rgba(0,0,0,0.25)] focus:bg-[var(--surface)] focus:outline-none"
              />
            </div>
            <PasswordStrengthBar password={studentPassword} />
            {studentErrors.password && (
              <p className="mt-1.5 flex items-center gap-1 text-[12px] text-[var(--traffic-red)]">
                <AlertCircle className="h-3 w-3" />
                {studentErrors.password.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">
              {t('student.confirmPassword')}
            </label>
            <div className="relative">
              <PasswordInput
                {...registerStudent('confirm_password')}
                placeholder={tLogin('passwordPlaceholder')}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2.5 text-[14px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[rgba(0,0,0,0.25)] focus:bg-[var(--surface)] focus:outline-none"
              />
            </div>
            {studentErrors.confirm_password && (
              <p className="mt-1.5 flex items-center gap-1 text-[12px] text-[var(--traffic-red)]">
                <AlertCircle className="h-3 w-3" />
                {studentErrors.confirm_password.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">
            {t('student.language')}
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStudentValue('language', 'en')}
              className={cn(
                'rounded-full border px-4 py-1.5 text-[13px] font-medium transition-colors',
                studentLang === 'en'
                  ? 'border-[var(--text)] bg-[var(--surface-hover)] text-[var(--text)]'
                  : 'border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
              )}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setStudentValue('language', 'ta')}
              className={cn(
                'rounded-full border px-4 py-1.5 text-[13px] font-medium transition-colors',
                studentLang === 'ta'
                  ? 'border-[var(--text)] bg-[var(--surface-hover)] text-[var(--text)]'
                  : 'border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
              )}
            >
              தமிழ்
            </button>
          </div>
        </div>

        <label className="flex items-start gap-2 pt-2">
          <input type="checkbox" required className="mt-1 shrink-0" />
          <span className="text-[13px] text-[var(--text-secondary)]">{t('student.terms')}</span>
        </label>

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
          {isLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : t('student.submit')}
        </button>
      </form>

      <div className="mt-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--border)]" />
        <span className="text-[12px] text-[var(--text-muted)]">{tAuth('or')}</span>
        <div className="h-px flex-1 bg-[var(--border)]" />
      </div>

      <button
        type="button"
        onClick={() => {
          const supabase = createClient();
          supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/auth/callback` }
          });
        }}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-[var(--border-hover)] bg-[var(--surface-raised)] py-2.5 text-[14px] font-medium text-[var(--text)] transition-all duration-150 hover:bg-[rgba(0,0,0,0.05)]"
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
        {tLogin('google')}
      </button>

      <p className="mt-6 text-center text-[13px] text-[var(--text-secondary)]">
        <button onClick={() => router.push('/login')} className="font-medium text-[var(--text)] underline-offset-4 transition-colors hover:underline">
          {t('role.hasAccount')}
        </button>
      </p>
    </AuthWindow>
  );
}
