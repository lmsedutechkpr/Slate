'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertCircle, ArrowLeft, Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { PasswordInput } from '@/components/auth/PasswordInput';
import { PasswordStrengthBar } from '@/components/auth/PasswordStrengthBar';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import AuthWindow from '@/components/auth/AuthWindow';
import { signupInstructorAction } from '@/app/actions/auth';

const instructorSchema = z
  .object({
    full_name: z.string().min(2, 'Name is required'),
    email: z.string().email('Valid email is required'),
    password: z
      .string()
      .min(8, 'Min 8 characters')
      .regex(/[A-Z]/, 'Must contain one uppercase letter')
      .regex(/[0-9]/, 'Must contain one number'),
    confirm_password: z.string(),
    headline: z.string().min(10, 'Headline is required (min 10 chars)'),
    expertise_tags: z.array(z.string()).min(1, 'Add at least one expertise tag'),
    teaching_languages: z.array(z.string()).min(1, 'Select at least one language'),
    short_bio: z.string().min(100, 'Bio must be at least 100 characters').max(500),
    motivation: z.string().min(50, 'Please share your motivation (min 50 chars)'),
    linkedin_url: z.string().url('Must be a valid URL').optional().or(z.literal(''))
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password']
  });

type FormValues = z.infer<typeof instructorSchema>;

export function InstructorForm({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [tagInput, setTagInput] = useState('');

  const parseSignupError = (err: unknown) => {
    const fallback = 'Unable to complete signup right now. Please try again.';

    if (!err || typeof err !== 'object') {
      const raw = typeof err === 'string' ? err : '';
      return {
        raw,
        display: raw.trim() ? fallback : fallback,
        isRateLimited: false,
      };
    }

    const maybe = err as {
      message?: unknown;
      error_description?: unknown;
      error?: unknown;
      code?: unknown;
      status?: unknown;
    };

    const message =
      (typeof maybe.message === 'string' && maybe.message) ||
      (typeof maybe.error_description === 'string' && maybe.error_description) ||
      (typeof maybe.error === 'string' && maybe.error) ||
      '';
    const code = typeof maybe.code === 'string' ? maybe.code : '';
    const status = typeof maybe.status === 'number' ? maybe.status : null;
    const normalized = `${message} ${code}`.toLowerCase();

    if (normalized.includes('already registered') || normalized.includes('user_already_exists')) {
      return { raw: message || code, display: 'User already registered.', isRateLimited: false };
    }

    if (
      normalized.includes('rate limit') ||
      normalized.includes('too many requests') ||
      normalized.includes('over_email_send_rate_limit') ||
      status === 429
    ) {
      if (cooldownLeft > 0) {
        return {
          raw: message || code,
          display: `Too many signup attempts right now. Try again in ${cooldownLeft}s.`,
          isRateLimited: true,
        };
      }
      return {
        raw: message || code,
        display: 'Too many signup attempts right now. Please wait 2 minutes and try again.',
        isRateLimited: true,
      };
    }

    if (normalized.includes('email address') && normalized.includes('invalid')) {
      return { raw: message || code, display: 'Please enter a valid email address.', isRateLimited: false };
    }

    if (normalized.includes('signup is disabled') || normalized.includes('signups not allowed')) {
      return {
        raw: message || code,
        display: 'Signup is currently disabled in authentication settings.',
        isRateLimited: false,
      };
    }

    if (normalized.includes('redirect') && normalized.includes('not allowed')) {
      return {
        raw: message || code,
        display: 'Auth redirect URL is not allowed. Please contact admin to update Supabase URL settings.',
        isRateLimited: false,
      };
    }

    if (normalized.includes('failed to fetch') || normalized.includes('network')) {
      return {
        raw: message || code,
        display: 'Network issue while signing up. Check your connection and try again.',
        isRateLimited: false,
      };
    }

    return { raw: message || code, display: fallback, isRateLimited: false };
  };

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const timer = window.setInterval(() => {
      setCooldownLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownLeft]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(instructorSchema),
    defaultValues: {
      expertise_tags: [],
      teaching_languages: ['en'],
      linkedin_url: ''
    }
  });

  const password = watch('password');
  const bio = watch('short_bio') || '';
  const tags = watch('expertise_tags') || [];
  const langs = watch('teaching_languages') || [];

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/,$/, '');
      if (val && !tags.includes(val)) {
        setValue('expertise_tags', [...tags, val], { shouldValidate: true });
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue(
      'expertise_tags',
      tags.filter((t) => t !== tagToRemove),
      { shouldValidate: true }
    );
  };

  const toggleLang = (lang: string) => {
    if (langs.includes(lang)) {
      if (langs.length > 1) {
        setValue('teaching_languages', langs.filter((l) => l !== lang), { shouldValidate: true });
      }
    } else {
      setValue('teaching_languages', [...langs, lang], { shouldValidate: true });
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setErrorCode(null);

    try {
      const result = await signupInstructorAction(data);

      if (!result.success) {
        if (result.errorCode === 'signup_rate_limited') {
          setCooldownLeft(120);
        }
        setErrorCode(result.error || 'Unable to complete signup right now. Please try again.');
        return;
      }

      router.push(result.nextPath || `/pending-approval?role=instructor&email=${encodeURIComponent(data.email)}`);
    } catch (err: unknown) {
      console.error('Instructor signup failed:', err);
      const parsed = parseSignupError(err);
      if (parsed.isRateLimited) {
        setCooldownLeft(120);
      }
      setErrorCode(parsed.display);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthWindow title="Instructor Application" width="lg">
      <div className="mb-5 flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-raised)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="font-sans text-[20px] font-bold text-[var(--text)]">Instructor Application</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Email & Name */}
          <div>
            <input
              {...register('full_name')}
              type="text"
              placeholder="Full Name"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none"
            />
            {errors.full_name && <p className="mt-1 text-[11px] text-[var(--traffic-red)]">{errors.full_name.message}</p>}
          </div>

          <div>
            <input
              {...register('email')}
              type="email"
              placeholder="Email Address"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none"
            />
            {errors.email && <p className="mt-1 text-[11px] text-[var(--traffic-red)]">{errors.email.message}</p>}
          </div>

          {/* Passwords */}
          <div>
            <PasswordInput
              {...register('password')}
              placeholder="Password"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none"
            />
            <PasswordStrengthBar password={password} />
            {errors.password && <p className="mt-1 text-[11px] text-[var(--traffic-red)]">{errors.password.message}</p>}
          </div>

          <div>
            <PasswordInput
              {...register('confirm_password')}
              placeholder="Confirm Password"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none"
            />
            {errors.confirm_password && (
              <p className="mt-1 text-[11px] text-[var(--traffic-red)]">{errors.confirm_password.message}</p>
            )}
          </div>
        </div>

        <div className="my-2 flex items-center gap-3">
          <div className="h-px w-full bg-[var(--border)]" />
          <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">About You</span>
          <div className="h-px w-full bg-[var(--border)]" />
        </div>

        {/* Headline */}
        <div>
          <input
            {...register('headline')}
            type="text"
            placeholder="Headline (e.g. Senior React Developer · 8 years exp)"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none"
          />
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">Shown on your instructor profile</p>
          {errors.headline && <p className="mt-1 text-[11px] text-[var(--traffic-red)]">{errors.headline.message}</p>}
        </div>

        {/* Expertise Tags */}
        <div>
          <div className="flex min-h-[36px] flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1.5 text-[13px] focus-within:border-[var(--border-strong)]">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-0.5 text-[11px] text-[var(--text)]"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-[var(--text-muted)] hover:text-[var(--traffic-red)] focus:outline-none"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder={tags.length === 0 ? "Expertise Tags (e.g. React). Press Enter to add." : "Add tag..."}
              className="min-w-[120px] flex-1 bg-transparent text-[13px] text-[var(--text)] outline-none placeholder:text-[var(--text-muted)]"
            />
          </div>
          {errors.expertise_tags && <p className="mt-1 text-[11px] text-[var(--traffic-red)]">{errors.expertise_tags.message}</p>}
        </div>

        {/* Language Toggles */}
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">Teaching Language</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => toggleLang('en')}
              className={cn(
                'rounded-full border px-4 py-1 text-[12px] font-medium transition-colors',
                langs.includes('en')
                  ? 'border-[var(--text)] bg-[var(--surfaace-hover)] text-[var(--text)]'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'
              )}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => toggleLang('ta')}
              className={cn(
                'rounded-full border px-4 py-1 text-[12px] font-medium transition-colors',
                langs.includes('ta')
                  ? 'border-[var(--text)] bg-[var(--surfaace-hover)] text-[var(--text)]'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'
              )}
            >
              தமிழ்
            </button>
          </div>
          {errors.teaching_languages && (
            <p className="mt-1 text-[11px] text-[var(--traffic-red)]">{errors.teaching_languages.message}</p>
          )}
        </div>

        {/* Short Bio */}
        <div>
          <textarea
            {...register('short_bio')}
            rows={3}
            placeholder="Tell students about your background, experience and what you will teach them..."
            className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none"
          />
          <div className="mt-1 flex justify-between text-[11px]">
            {errors.short_bio ? (
              <span className="text-[var(--traffic-red)]">{errors.short_bio.message}</span>
            ) : (
              <span className="text-transparent">.</span>
            )}
            <span className={bio.length > 500 ? 'text-[var(--traffic-red)]' : 'text-[var(--text-muted)]'}>
              {bio.length}/500
            </span>
          </div>
        </div>

        {/* Motivation */}
        <div>
          <textarea
            {...register('motivation')}
            rows={2}
            placeholder="Why do you want to teach on Slate? Share your motivation..."
            className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none"
          />
          {errors.motivation && <p className="mt-1 text-[11px] text-[var(--traffic-red)]">{errors.motivation.message}</p>}
        </div>

        {/* LinkedIn */}
        <div>
          <input
            {...register('linkedin_url')}
            type="url"
            placeholder="LinkedIn / Portfolio URL (optional) — e.g. https://linkedin.com/in/..."
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none"
          />
          {errors.linkedin_url && <p className="mt-1 text-[11px] text-[var(--traffic-red)]">{errors.linkedin_url.message}</p>}
        </div>

        {errorCode && (
          <div className="flex items-start gap-2 rounded-xl border border-[var(--traffic-red)]/20 bg-[var(--traffic-red)]/10 px-4 py-2.5 text-[12px] text-[var(--traffic-red)]">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>{errorCode}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || cooldownLeft > 0}
          className="mt-2 w-full rounded-full bg-[var(--text)] py-2.5 text-[13px] font-semibold text-[var(--bg)] transition-all duration-150 hover:scale-[1.01] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : cooldownLeft > 0 ? `Please wait ${cooldownLeft}s` : 'Submit Application →'}
        </button>

        <div className="my-3 flex items-center gap-3">
          <div className="h-px w-full bg-[var(--border)]" />
          <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">or</span>
          <div className="h-px w-full bg-[var(--border)]" />
        </div>

        <button
          type="button"
          onClick={() => {
            const supabase = createClient();
            supabase.auth.signInWithOAuth({
              provider: 'google',
              options: {
                redirectTo: `${window.location.origin}/auth/callback?role=instructor&lang=${langs.includes('ta') ? 'ta' : 'en'}`,
              },
            });
          }}
          className="w-full rounded-full border border-[var(--border)] bg-[var(--surface-raised)] py-2.5 text-[13px] font-semibold text-[var(--text)] transition-colors hover:bg-[var(--surface-hover)]"
        >
          Continue with Google
        </button>
      </form>
    </AuthWindow>
  );
}
