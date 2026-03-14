'use client';

import { useTranslations } from 'next-intl';
import { BookOpen, ShoppingBag, Hourglass } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

import AuthWindow from '@/components/auth/AuthWindow';
import { Link } from '@/i18n/navigation';

export default function PendingApprovalPage() {
  const t = useTranslations('auth.pending');
  const searchParams = useSearchParams();
  const role = searchParams.get('role');

  if (role === 'instructor') {
    return (
      <AuthWindow title="Application Received" width="sm">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="flex flex-col items-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#FEBC2E]/20 bg-[rgba(254,188,46,0.1)]">
            <BookOpen className="h-10 w-10 text-[#FEBC2E]" />
          </div>

          <div className="mt-5 text-center">
            <h1 className="font-sans text-[20px] font-bold text-[var(--text)]">Application Received! 🎓</h1>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">
              Our team is reviewing your instructor application. You'll receive an email within 24–48 hours.
            </p>
          </div>

          <Link
            href="/login"
            className="mt-8 flex w-full items-center justify-center rounded-full bg-[var(--text)] px-6 py-3 text-[14px] font-semibold text-[var(--bg)] transition-all duration-150 hover:opacity-90"
          >
            Return to Login
          </Link>
        </motion.div>
      </AuthWindow>
    );
  }

  if (role === 'seller') {
    return (
      <AuthWindow title="Application Received" width="sm">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="flex flex-col items-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#FEBC2E]/20 bg-[rgba(254,188,46,0.1)]">
            <ShoppingBag className="h-10 w-10 text-[#FEBC2E]" />
          </div>

          <div className="mt-5 text-center">
            <h1 className="font-sans text-[20px] font-bold text-[var(--text)]">Application Received! 🛍️</h1>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">
              Our team is reviewing your seller application. We'll verify your store details and get back to you within 24–48 hours.
            </p>
          </div>

          <Link
            href="/login"
            className="mt-8 flex w-full items-center justify-center rounded-full bg-[var(--text)] px-6 py-3 text-[14px] font-semibold text-[var(--bg)] transition-all duration-150 hover:opacity-90"
          >
            Return to Login
          </Link>
        </motion.div>
      </AuthWindow>
    );
  }

  // DEFAULT (Student email verification or general pending)
  return (
    <AuthWindow title="Application Received" width="sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#FEBC2E]/20 bg-[rgba(254,188,46,0.1)]">
        <Hourglass className="h-7 w-7 text-[#FEBC2E]" />
      </div>

      <div className="mt-4 text-center">
        <h1 className="font-sans text-[20px] font-bold text-[var(--text)]">Verify your email</h1>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Please check your inbox to verify your account.</p>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#FEBC2E]" />
        <span className="text-[12px] font-medium text-[var(--text-secondary)]">{t('waiting')}</span>
      </div>
      
      <Link
        href="/login"
        className="mt-8 flex w-full items-center justify-center rounded-full bg-[var(--text)] px-6 py-3 text-[14px] font-semibold text-[var(--bg)] transition-all duration-150 hover:opacity-90"
      >
        Return to Login
      </Link>
    </AuthWindow>
  );
}
