'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthWindow from '@/components/auth/AuthWindow';
import { resendInviteSetupLinkAction } from '@/app/actions/admin';

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
  const initialEmail = searchParams.get('email') || '';
  const [email, setEmail] = useState(initialEmail);
  const [sendingSetup, setSendingSetup] = useState(false);
  const [setupMessage, setSetupMessage] = useState<string | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [nextSetupUrl, setNextSetupUrl] = useState<string | null>(null);

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

  const sendPasswordSetupLink = async () => {
    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      setSetupError('Enter a valid invitation email to receive the password setup link.');
      setSetupMessage(null);
      return;
    }

    setSendingSetup(true);
    setSetupError(null);
    setSetupMessage(null);
    setNextSetupUrl(null);

    try {
      const res = await resendInviteSetupLinkAction({
        email: targetEmail,
        role,
      });

      if (!res.success) {
        setSetupError(res.error || 'Unable to send setup link right now.');
        return;
      }

      setSetupMessage(
        res.message || `Invitation email sent to ${targetEmail}. Open your email and continue from the provided link.`
      );
      if (res.nextUrl) {
        setNextSetupUrl(res.nextUrl);
      }
    } catch {
      setSetupError('Unable to send setup link right now. Please try again in a minute.');
    } finally {
      setSendingSetup(false);
    }
  };

  return (
    <div className="w-full flex justify-center">
      <AuthWindow title={title} width="md">
        <div className="space-y-4 text-center">
          <h1 className="text-[24px] font-bold text-[var(--text)]">{title}</h1>
          {email ? <p className="text-[13px] text-[var(--text-secondary)]">Invitation email: {email}</p> : null}

          {role === 'admin' ? (
            <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left text-[13px] text-[var(--text-secondary)]">
              <p className="font-semibold text-[var(--text)]">Admin accounts do not use public signup.</p>
              <p>Use a secure invite/reset link to set your password and activate admin access.</p>

              <div>
                <label className="mb-1 block text-[12px] text-[var(--text-muted)]">Invitation Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-[13px] text-[var(--text)] outline-none"
                />
              </div>

              <button
                type="button"
                onClick={sendPasswordSetupLink}
                disabled={sendingSetup}
                className="inline-flex h-10 w-full items-center justify-center rounded-full bg-[var(--text)] px-4 text-[13px] font-semibold text-[var(--bg)] disabled:opacity-50"
              >
                {sendingSetup ? 'Sending setup link...' : 'Send Password Setup Link'}
              </button>

              {setupMessage ? <p className="text-[12px] text-[#28C840]">{setupMessage}</p> : null}
              {setupError ? <p className="text-[12px] text-[#FF5F57]">{setupError}</p> : null}
              {nextSetupUrl ? (
                <a
                  href={nextSetupUrl}
                  className="inline-flex h-10 w-full items-center justify-center rounded-full border border-[var(--border)] bg-white px-4 text-[13px] font-semibold text-[var(--text)]"
                >
                  Continue With Secure Setup Link
                </a>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left text-[13px] text-[var(--text-secondary)]">
              <p>Use the secure invite link flow to continue role onboarding.</p>

              <div>
                <label className="mb-1 block text-[12px] text-[var(--text-muted)]">Invitation Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-[13px] text-[var(--text)] outline-none"
                />
              </div>

              <button
                type="button"
                onClick={sendPasswordSetupLink}
                disabled={sendingSetup}
                className="inline-flex h-10 w-full items-center justify-center rounded-full bg-[var(--text)] px-4 text-[13px] font-semibold text-[var(--bg)] disabled:opacity-50"
              >
                {sendingSetup ? 'Sending invite link...' : 'Resend Secure Invite Link'}
              </button>

              {setupMessage ? <p className="text-[12px] text-[#28C840]">{setupMessage}</p> : null}
              {setupError ? <p className="text-[12px] text-[#FF5F57]">{setupError}</p> : null}
              {nextSetupUrl ? (
                <a
                  href={nextSetupUrl}
                  className="inline-flex h-10 w-full items-center justify-center rounded-full border border-[var(--border)] bg-white px-4 text-[13px] font-semibold text-[var(--text)]"
                >
                  Continue With Secure Setup Link
                </a>
              ) : null}
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
