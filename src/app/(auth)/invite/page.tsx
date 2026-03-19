'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthWindow from '@/components/auth/AuthWindow';

type InviteRole = 'student' | 'instructor' | 'seller' | 'admin';

function normalizeRole(value: string | null): InviteRole {
  if (value === 'student' || value === 'instructor' || value === 'seller' || value === 'admin') {
    return value;
  }
  return 'student';
}

export default function InviteLandingPage() {
  const searchParams = useSearchParams();
  const role = normalizeRole(searchParams.get('role'));
  const email = searchParams.get('email') || '';

  const title = useMemo(() => {
    if (role === 'admin') return 'Admin Invite';
    if (role === 'instructor') return 'Instructor Invite';
    if (role === 'seller') return 'Seller Invite';
    return 'Student Invite';
  }, [role]);

  const ctaHref = useMemo(() => {
    if (role === 'admin') return '/login';
    return `/signup?role=${role}${email ? `&email=${encodeURIComponent(email)}` : ''}`;
  }, [role, email]);

  const ctaLabel = role === 'admin' ? 'Continue to Admin Sign In' : `Continue as ${role[0].toUpperCase()}${role.slice(1)}`;

  return (
    <div className="w-full flex justify-center">
      <AuthWindow title={title} width="md">
        <div className="space-y-4 text-center">
          <h1 className="text-[24px] font-bold text-[var(--text)]">{title}</h1>
          {email ? <p className="text-[13px] text-[var(--text-secondary)]">Invitation email: {email}</p> : null}

          {role === 'admin' ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left text-[13px] text-[var(--text-secondary)]">
              <p className="font-semibold text-[var(--text)]">Admin accounts do not use public signup.</p>
              <p className="mt-2">
                Use the invitation email action link to finalize your admin access. If the link expired, ask the platform owner to resend the invite.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left text-[13px] text-[var(--text-secondary)]">
              <p>Continue to the role-specific signup form and complete your invited profile details.</p>
            </div>
          )}

          <Link
            href={ctaHref}
            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[var(--text)] px-4 text-[14px] font-semibold text-[var(--bg)] transition hover:opacity-90"
          >
            {ctaLabel}
          </Link>

          <p className="text-[12px] text-[var(--text-muted)]">
            <Link href="/" className="underline">
              Back to Slate
            </Link>
          </p>
        </div>
      </AuthWindow>
    </div>
  );
}
