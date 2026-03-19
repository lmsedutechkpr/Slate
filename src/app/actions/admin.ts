'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface ActionResult {
  success: boolean;
  error?: string;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  if (error && typeof error === 'object') {
    const candidate = error as { message?: unknown; error_description?: unknown; code?: unknown; status?: unknown };
    const message =
      (typeof candidate.message === 'string' && candidate.message) ||
      (typeof candidate.error_description === 'string' && candidate.error_description) ||
      '';
    const code = typeof candidate.code === 'string' ? candidate.code : '';
    const status = typeof candidate.status === 'number' ? candidate.status : null;
    const details = [message, code, status ? String(status) : ''].filter(Boolean).join(' | ').trim();
    if (details) return details;
  }
  return fallback;
}

function revalidateAdminUsersRoutes() {
  revalidatePath('/admin', 'layout');
  revalidatePath('/admin/users');
  revalidatePath('/admin/dashboard');
}

const ALLOWED_NOTIFICATION_TYPES = new Set([
  'course',
  'review',
  'live_class',
  'order',
  'message',
  'system',
]);

function normalizeNotificationType(type: string) {
  return ALLOWED_NOTIFICATION_TYPES.has(type) ? type : 'system';
}

function getBrevoApiKey() {
  return (
    process.env.BREVO_API_KEY ||
    process.env.BREVO_APIKEY ||
    process.env.BREVO_KEY ||
    process.env.BREVO_SMTP_API_KEY ||
    null
  );
}

function getWebsiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://slate-tau-eight.vercel.app/').replace(/\/$/, '');
}

async function sendApplicationStatusEmail(params: {
  toEmail: string;
  recipientName: string;
  status: 'approved' | 'rejected';
  role?: string | null;
  reason?: string;
  welcomeMessage?: string;
}) {
  const apiKey = getBrevoApiKey();
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'no-reply@slate.local';
  const senderName = process.env.BREVO_SENDER_NAME || 'Slate';

  if (!apiKey) {
    console.warn('Brevo API key is not configured. Skipping application status email send.');
    return;
  }

  const roleLabel = params.role ? params.role.charAt(0).toUpperCase() + params.role.slice(1) : 'Account';
  const isApproved = params.status === 'approved';
  const heading = isApproved ? 'Application Approved' : 'Application Update';
  const subject = isApproved ? 'Your Slate Application Is Approved' : 'Your Slate Application Status';
  const bodyLine = isApproved
    ? `Congratulations! Your ${roleLabel} application has been approved.`
    : `After review, your ${roleLabel} application was not approved at this time.`;
  const guidanceLine = isApproved
    ? params.welcomeMessage || 'You can now access your dashboard and get started.'
    : 'You can improve the application and contact support if you need guidance.';
  const reasonBlock = !isApproved && params.reason ? `<p><strong>Reason:</strong> ${params.reason}</p>` : '';
  const reasonText = !isApproved && params.reason ? `Reason: ${params.reason}` : null;
  const websiteUrl = getWebsiteUrl();
  const websiteButton = `<p style="margin: 16px 0;"><a href="${websiteUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:8px;font-weight:600;">Open Slate Website</a></p>`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <h2 style="margin: 0 0 12px;">${heading}</h2>
      <p>Hello ${params.recipientName || 'there'},</p>
      <p>Thank you for applying to Slate as a ${roleLabel}.</p>
      <p>${bodyLine}</p>
      ${reasonBlock}
      <p>${guidanceLine}</p>
      ${websiteButton}
      <p style="font-size:12px;color:#6b7280;">Quick link: ${websiteUrl}</p>
      <p style="margin-top: 18px;">Regards,<br/>Slate Team</p>
    </div>
  `;

  const textLines = [
    heading,
    '',
    `Hello ${params.recipientName || 'there'},`,
    `Thank you for applying to Slate as a ${roleLabel}.`,
    bodyLine,
    ...(reasonText ? [reasonText] : []),
    guidanceLine,
    `Website: ${websiteUrl}`,
    '',
    'Regards,',
    'Slate Team',
  ];

  const textContent = textLines.join('\n');

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [{ email: params.toEmail, name: params.recipientName || undefined }],
      subject,
      htmlContent,
      textContent,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Brevo send failed: ${response.status} ${details}`);
  }
}

async function sendAdminInviteEmail(params: {
  toEmail: string;
  role: 'student' | 'instructor' | 'seller' | 'admin';
  inviteLink: string;
  adminMessage?: string;
}) {
  const apiKey = getBrevoApiKey();
  if (!apiKey) {
    console.warn('Brevo API key is not configured. Skipping custom invite email send.');
    return;
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'no-reply@slate.local';
  const senderName = process.env.BREVO_SENDER_NAME || 'Slate';
  const websiteUrl = getWebsiteUrl();
  const roleLabel = params.role.charAt(0).toUpperCase() + params.role.slice(1);

  const roleDetailsMap: Record<string, string[]> = {
    student: ['Full name', 'Email and password', 'Preferred learning language'],
    instructor: ['Professional headline', 'Expertise tags', 'Teaching languages', 'Short bio and motivation'],
    seller: ['Store name and slug', 'Business type', 'Store description', 'Optional GST / website details'],
    admin: ['Full name', 'Secure password', 'Complete admin profile basics'],
  };

  const detailItems = roleDetailsMap[params.role] || roleDetailsMap.student;
  const detailHtml = detailItems.map((item) => `<li>${item}</li>`).join('');
  const detailsFormUrl =
    params.role === 'admin'
      ? `${websiteUrl}/invite?role=admin&email=${encodeURIComponent(params.toEmail)}`
      : `${websiteUrl}/signup?role=${params.role}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <h2 style="margin: 0 0 12px;">You're invited to Slate as ${roleLabel}</h2>
      <p>You have been invited to join Slate.</p>
      ${params.adminMessage ? `<p><strong>Message from admin:</strong> ${params.adminMessage}</p>` : ''}
      <p style="margin: 16px 0;"><a href="${params.inviteLink}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:8px;font-weight:600;">Accept Invitation</a></p>
      <p>After accepting, please complete these ${roleLabel} details:</p>
      <ul>${detailHtml}</ul>
      <p style="margin: 16px 0;"><a href="${detailsFormUrl}" style="display:inline-block;background:#f3f4f6;color:#111827;text-decoration:none;padding:10px 14px;border-radius:8px;font-weight:600;">Open ${roleLabel} Details Form</a></p>
      <p style="font-size:12px;color:#6b7280;">Website: ${websiteUrl}</p>
      <p style="margin-top: 18px;">Regards,<br/>Slate Team</p>
    </div>
  `;

  const textContent = [
    `You're invited to Slate as ${roleLabel}`,
    '',
    'Accept invitation:',
    params.inviteLink,
    '',
    params.adminMessage ? `Admin message: ${params.adminMessage}` : null,
    `Complete ${roleLabel} details at: ${detailsFormUrl}`,
    `Website: ${websiteUrl}`,
  ]
    .filter(Boolean)
    .join('\n');

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [{ email: params.toEmail }],
      subject: `Your Slate ${roleLabel} Invitation`,
      htmlContent,
      textContent,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Brevo invite send failed: ${response.status} ${details}`);
  }
}

async function resolveInviteActionLink(params: {
  admin: ReturnType<typeof createAdminClient>;
  email: string;
  role: 'student' | 'instructor' | 'seller' | 'admin';
  invitedBy?: string;
  message?: string;
  redirectTo?: string;
  inviteData?: unknown;
}) {
  const directFromInvite =
    (typeof (params.inviteData as { properties?: { action_link?: unknown } } | null)?.properties?.action_link ===
    'string'
      ? ((params.inviteData as { properties?: { action_link?: string } }).properties?.action_link ?? null)
      : null) ||
    (typeof (params.inviteData as { action_link?: unknown } | null)?.action_link === 'string'
      ? ((params.inviteData as { action_link?: string }).action_link ?? null)
      : null);

  if (directFromInvite) return directFromInvite;

  try {
    const generateLink = (params.admin.auth.admin as { generateLink?: unknown }).generateLink;
    if (typeof generateLink === 'function') {
      const generated = await (generateLink as (payload: Record<string, unknown>) => Promise<unknown>)({
        type: 'invite',
        email: params.email,
        options: {
          data: {
            role: params.role,
            invitation_message: params.message || null,
            invited_by: params.invitedBy || null,
          },
          ...(params.redirectTo ? { redirectTo: params.redirectTo } : {}),
        },
      });

      const generatedLink =
        (typeof (generated as { data?: { properties?: { action_link?: unknown } } } | null)?.data?.properties
          ?.action_link === 'string'
          ? ((generated as { data?: { properties?: { action_link?: string } } }).data?.properties?.action_link ?? null)
          : null) ||
        (typeof (generated as { data?: { action_link?: unknown } } | null)?.data?.action_link === 'string'
          ? ((generated as { data?: { action_link?: string } }).data?.action_link ?? null)
          : null);

      if (generatedLink) return generatedLink;
    }
  } catch (linkError) {
    console.warn('Could not generate explicit invite action link:', linkError);
  }

  if (params.role === 'admin') {
    return `${getWebsiteUrl()}/invite?role=admin&email=${encodeURIComponent(params.email)}`;
  }
  return `${getWebsiteUrl()}/signup?role=${params.role}&email=${encodeURIComponent(params.email)}`;
}

async function notifyUser(
  admin: ReturnType<typeof createAdminClient>,
  params: {
    userId: string;
    type: string;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
    actionUrl?: string | null;
  }
) {
  const { userId, type, title, message, metadata = {}, actionUrl = null } = params;
  const { error } = await admin.from('notifications').insert({
    user_id: userId,
    type: normalizeNotificationType(type),
    title,
    message,
    action_url: actionUrl,
    metadata,
    is_read: false,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Notification insert failed:', error);
  }
}

async function sendInstructorAssignmentEmail(params: {
  toEmail: string;
  recipientName: string;
  courseTitle: string;
  roleMessage: string;
  instructorEditUrl: string;
  revenueShare: number;
}) {
  const apiKey = getBrevoApiKey();
  if (!apiKey) {
    console.warn('Brevo API key is not configured. Skipping instructor assignment email send.');
    return;
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'no-reply@slate.local';
  const senderName = process.env.BREVO_SENDER_NAME || 'Slate';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <h2 style="margin: 0 0 12px;">Course Assignment Update</h2>
      <p>Hello ${params.recipientName || 'Instructor'},</p>
      <p>${params.roleMessage}</p>
      <p><strong>Course:</strong> ${params.courseTitle}</p>
      <p><strong>Your revenue share:</strong> ${params.revenueShare}%</p>
      <p style="margin: 16px 0;"><a href="${params.instructorEditUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:8px;font-weight:600;">Open Course Editor</a></p>
      <p style="font-size:12px;color:#6b7280;">Quick link: ${params.instructorEditUrl}</p>
      <p style="margin-top: 18px;">Regards,<br/>Slate Team</p>
    </div>
  `;

  const textContent = [
    'Course Assignment Update',
    '',
    `Hello ${params.recipientName || 'Instructor'},`,
    params.roleMessage,
    `Course: ${params.courseTitle}`,
    `Your revenue share: ${params.revenueShare}%`,
    `Open editor: ${params.instructorEditUrl}`,
    '',
    'Regards,',
    'Slate Team',
  ].join('\n');

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [{ email: params.toEmail, name: params.recipientName || undefined }],
      subject: `Slate Course Assignment: ${params.courseTitle}`,
      htmlContent,
      textContent,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Brevo assignment send failed: ${response.status} ${details}`);
  }
}

/**
 * Approve a pending user (instructor or seller)
 */
export async function approveUserAction({ userId }: { userId: string }) {
  try {
    const admin = createAdminClient();
    const websiteUrl = getWebsiteUrl();

    // 1. Update profile status to active
    const { error: updateError } = await admin
      .from('profiles')
      .update({
        status: 'active',
        approved_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error approving user:', updateError);
      return { success: false, error: 'Failed to update user status' };
    }

    const { data: profileData } = await admin
      .from('profiles')
      .select('full_name, role')
      .eq('id', userId)
      .single();

    let email: string | null = null;
    try {
      const { data: authData } = await admin.auth.admin.getUserById(userId);
      email = authData?.user?.email || null;
    } catch (authError) {
      console.warn('Could not fetch auth email for approval mail:', authError);
    }

    // 2. Send approval notification
    const { error: notifError } = await admin.from('notifications').insert({
      user_id: userId,
      type: 'system',
      title: 'Application Approved! 🎉',
      message: `Welcome to Slate! Your account is now active and you can start using all features. Quick access: ${websiteUrl}`,
      action_url: websiteUrl,
      metadata: {},
      is_read: false,
      created_at: new Date().toISOString(),
    });

    if (notifError) {
      console.error('Error sending approval notification:', notifError);
      // Don't fail the whole operation if notification fails
    }

    if (email) {
      try {
        await sendApplicationStatusEmail({
          toEmail: email,
          recipientName: profileData?.full_name || email.split('@')[0],
          status: 'approved',
          role: profileData?.role || null,
          welcomeMessage: 'Welcome to Slate! Your account is now active and you can start using all features.',
        });
      } catch (emailError) {
        console.error('Error sending approval email:', emailError);
      }
    }

    // 3. Revalidate admin layout to update pending counts
    revalidatePath('/admin', 'layout');
    revalidatePath('/admin/dashboard');

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in approveUserAction:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function approveUserWithDetailsAction({
  userId,
  role,
  commissionRate,
  welcomeMessage,
}: {
  userId: string;
  role: string;
  commissionRate?: number;
  welcomeMessage: string;
}): Promise<ActionResult> {
  try {
    const admin = createAdminClient();

    const { error: profileError } = await admin
      .from('profiles')
      .update({
        status: 'active',
        approved_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Error approving user profile:', profileError);
      return { success: false, error: 'Failed to approve user' };
    }

    const { data: profileData } = await admin
      .from('profiles')
      .select('full_name, role')
      .eq('id', userId)
      .single();

    let email: string | null = null;
    try {
      const { data: authData } = await admin.auth.admin.getUserById(userId);
      email = authData?.user?.email || null;
    } catch (authError) {
      console.warn('Could not fetch auth email for approval mail:', authError);
    }

    if (typeof commissionRate === 'number' && role === 'instructor') {
      const { error } = await admin
        .from('instructor_profiles')
        .update({ commission_rate: commissionRate })
        .eq('user_id', userId);
      if (error) {
        console.error('Error updating instructor commission rate:', error);
      }
    }

    if (typeof commissionRate === 'number' && role === 'seller') {
      const { error } = await admin
        .from('seller_profiles')
        .update({ commission_rate: commissionRate })
        .eq('user_id', userId);
      if (error) {
        console.error('Error updating seller commission rate:', error);
      }
    }

    await notifyUser(admin, {
      userId,
      type: 'approval',
      title: 'Application Approved! 🎉',
      message: `${welcomeMessage}\n\nQuick access: ${getWebsiteUrl()}`,
      actionUrl: getWebsiteUrl(),
      metadata: { role, commission_rate: commissionRate ?? null },
    });

    if (email) {
      try {
        await sendApplicationStatusEmail({
          toEmail: email,
          recipientName: profileData?.full_name || email.split('@')[0],
          status: 'approved',
          role: profileData?.role || role || null,
          welcomeMessage,
        });
      } catch (emailError) {
        console.error('Error sending approval email:', emailError);
      }
    }

    revalidateAdminUsersRoutes();
    return { success: true };
  } catch (error) {
    console.error('Unexpected error in approveUserWithDetailsAction:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Reject a pending user with a reason
 */
export async function rejectUserAction({
  userId,
  reason,
}: {
  userId: string;
  reason: string;
}) {
  try {
    const admin = createAdminClient();

    // 1. Try full update first.
    let profileUpdate = await admin
      .from('profiles')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejection_reason: reason,
      })
      .eq('id', userId);

    if (profileUpdate.error) {
      // Fallback for deployments missing rejected_at/rejection_reason columns.
      profileUpdate = await admin
        .from('profiles')
        .update({ status: 'rejected' })
        .eq('id', userId);
    }

    if (profileUpdate.error) {
      // Final fallback for deployments with different enum values.
      const msg = profileUpdate.error.message?.toLowerCase() || '';
      if (msg.includes('invalid input value for enum') && msg.includes('rejected')) {
        profileUpdate = await admin
          .from('profiles')
          .update({ status: 'suspended' })
          .eq('id', userId);
      }
    }

    if (profileUpdate.error) {
      console.error('Error rejecting user:', profileUpdate.error);
      return { success: false, error: profileUpdate.error.message || 'Failed to update user status' };
    }

    const { data: profileData } = await admin
      .from('profiles')
      .select('full_name, role')
      .eq('id', userId)
      .single();

    let email: string | null = null;
    try {
      const { data: authData } = await admin.auth.admin.getUserById(userId);
      email = authData?.user?.email || null;
    } catch (authError) {
      console.warn('Could not fetch auth email for rejection mail:', authError);
    }

    // 2. Send rejection notification
    const { error: notifError } = await admin.from('notifications').insert({
      user_id: userId,
      type: 'system',
      title: 'Application Update',
      message: `Your application was not approved at this time. Reason: ${reason}`,
      action_url: null,
      metadata: { reason },
      is_read: false,
      created_at: new Date().toISOString(),
    });

    if (notifError) {
      console.error('Error sending rejection notification:', notifError);
      // Don't fail the whole operation if notification fails
    }

    // 3. Send rejection email if we have an address and SMTP API key configured.
    if (email) {
      try {
        await sendApplicationStatusEmail({
          toEmail: email,
          recipientName: profileData?.full_name || email.split('@')[0],
          status: 'rejected',
          role: profileData?.role || null,
          reason,
        });
      } catch (emailError) {
        console.error('Error sending rejection email:', emailError);
      }
    }

    // 4. Revalidate admin views
    revalidateAdminUsersRoutes();

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in rejectUserAction:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function suspendUserAction({
  userId,
  reason,
  durationMs,
}: {
  userId: string;
  reason: string;
  durationMs: number | null;
}): Promise<ActionResult> {
  try {
    const admin = createAdminClient();
    const suspendedUntil = durationMs ? new Date(Date.now() + durationMs).toISOString() : null;

    let profileUpdate = await admin
      .from('profiles')
      .update({
        status: 'suspended',
        suspension_reason: reason,
        suspended_at: new Date().toISOString(),
        suspended_until: suspendedUntil,
      })
      .eq('id', userId);

    if (profileUpdate.error) {
      // Fallback for deployments where suspension columns do not exist yet.
      profileUpdate = await admin
        .from('profiles')
        .update({ status: 'suspended' })
        .eq('id', userId);
    }

    if (profileUpdate.error) {
      console.error('Error suspending user:', profileUpdate.error);
      return { success: false, error: 'Failed to suspend account' };
    }

    try {
      await admin.auth.admin.signOut(userId);
    } catch (authError) {
      // Best-effort sign-out. Do not fail suspension if auth admin API is unavailable.
      console.warn('Could not force sign-out for suspended user:', authError);
    }

    await notifyUser(admin, {
      userId,
      type: 'suspension',
      title: 'Account Suspended',
      message: 'Your account has been suspended. Contact support for assistance.',
      metadata: {
        reason,
        duration_ms: durationMs,
        suspended_until: suspendedUntil,
      },
    });

    revalidateAdminUsersRoutes();
    return { success: true };
  } catch (error) {
    console.error('Unexpected error in suspendUserAction:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function unsuspendUserAction({ userId }: { userId: string }): Promise<ActionResult> {
  try {
    const admin = createAdminClient();

    let profileUpdate = await admin
      .from('profiles')
      .update({
        status: 'active',
        suspension_reason: null,
        suspended_at: null,
        suspended_until: null,
      })
      .eq('id', userId);

    if (profileUpdate.error) {
      profileUpdate = await admin.from('profiles').update({ status: 'active' }).eq('id', userId);
    }

    if (profileUpdate.error) {
      console.error('Error restoring account:', profileUpdate.error);
      return { success: false, error: 'Failed to restore account' };
    }

    await notifyUser(admin, {
      userId,
      type: 'account_restored',
      title: 'Account Restored',
      message: 'Your account access has been restored. You can now log in and use the platform.',
    });

    revalidateAdminUsersRoutes();
    return { success: true };
  } catch (error) {
    console.error('Unexpected error in unsuspendUserAction:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function changeUserRoleAction({
  userId,
  role,
}: {
  userId: string;
  role: string;
}): Promise<ActionResult> {
  try {
    const admin = createAdminClient();

    const allowedRoles = new Set(['student', 'instructor', 'seller', 'admin']);
    if (!allowedRoles.has(role)) {
      return { success: false, error: 'Invalid role selected' };
    }

    const { data: profileData, error } = await admin
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select('id, role')
      .single();

    if (error) {
      console.error('Error changing role:', error);
      return { success: false, error: error.message || 'Failed to change role' };
    }

    if (!profileData) {
      return { success: false, error: 'User not found for role update' };
    }

    // Keep auth metadata aligned with profile role for downstream auth checks.
    try {
      await admin.auth.admin.updateUserById(userId, {
        user_metadata: { role },
      });
    } catch (metaError) {
      console.warn('Role changed but auth metadata update failed:', metaError);
    }

    // Best effort seed of role-specific profile rows.
    if (role === 'instructor') {
      const { error: instructorUpsertError } = await admin
        .from('instructor_profiles')
        .upsert({ user_id: userId }, { onConflict: 'user_id' });
      if (instructorUpsertError) {
        console.warn('Instructor profile upsert failed after role change:', instructorUpsertError);
      }
    }

    if (role === 'seller') {
      const { error: sellerUpsertError } = await admin
        .from('seller_profiles')
        .upsert({ user_id: userId }, { onConflict: 'user_id' });
      if (sellerUpsertError) {
        console.warn('Seller profile upsert failed after role change:', sellerUpsertError);
      }
    }

    await notifyUser(admin, {
      userId,
      type: 'role_changed',
      title: 'Role Updated',
      message: `Your account role has been updated to ${role}.`,
      metadata: { role },
    });

    revalidateAdminUsersRoutes();
    return { success: true };
  } catch (error) {
    console.error('Unexpected error in changeUserRoleAction:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function deleteUserAccountAction({ userId }: { userId: string }): Promise<ActionResult> {
  try {
    const admin = createAdminClient();

    const { error: profileDeleteError } = await admin.from('profiles').delete().eq('id', userId);
    if (profileDeleteError) {
      console.error('Error deleting profile:', profileDeleteError);
      return { success: false, error: 'Failed to delete account' };
    }

    try {
      await admin.auth.admin.deleteUser(userId);
    } catch (authError) {
      // Auth user might already be deleted or admin API may be unavailable.
      console.warn('Could not delete auth user:', authError);
    }

    revalidateAdminUsersRoutes();
    return { success: true };
  } catch (error) {
    console.error('Unexpected error in deleteUserAccountAction:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function sendUserNotificationAction({
  userId,
  type,
  title,
  message,
}: {
  userId: string;
  type: string;
  title: string;
  message: string;
}): Promise<ActionResult> {
  try {
    const admin = createAdminClient();
    const severity = type;
    const normalizedType = ['info', 'warning', 'success'].includes(type) ? 'message' : type;

    const { error } = await admin.from('notifications').insert({
      user_id: userId,
      type: normalizedType,
      title,
      message,
      action_url: null,
      metadata: { severity },
      is_read: false,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error sending user notification:', error);
      return { success: false, error: error.message || 'Failed to send notification' };
    }

    revalidateAdminUsersRoutes();
    return { success: true };
  } catch (error) {
    console.error('Unexpected error in sendUserNotificationAction:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function inviteUserAction({
  email,
  role,
  message,
  invitedBy,
}: {
  email: string;
  role: 'student' | 'instructor' | 'seller' | 'admin';
  message?: string;
  invitedBy?: string;
}): Promise<ActionResult> {
  try {
    const admin = createAdminClient();

    const redirectBase = process.env.NEXT_PUBLIC_SITE_URL;
    const redirectTo = redirectBase ? `${redirectBase.replace(/\/$/, '')}/auth/callback` : undefined;

    let inviteData: unknown = null;
    let invitedUserId: string | null = null;

    try {
      const generateLinkFn = (admin.auth.admin as { generateLink?: unknown }).generateLink;
      if (typeof generateLinkFn === 'function') {
        const generated = await (
          generateLinkFn as (payload: Record<string, unknown>) => Promise<{ data?: Record<string, unknown>; error?: unknown }>
        )({
          type: 'invite',
          email,
          options: {
            data: {
              role,
              invitation_message: message || null,
              invited_by: invitedBy || null,
            },
            ...(redirectTo ? { redirectTo } : {}),
          },
        });

        if (!generated?.error && generated?.data) {
          inviteData = generated.data;
          invitedUserId =
            typeof (generated.data.user as { id?: unknown } | undefined)?.id === 'string'
              ? ((generated.data.user as { id?: string }).id ?? null)
              : null;
        }
      }
    } catch (generateError) {
      console.warn('generateLink invite failed, trying inviteUserByEmail fallback:', generateError);
    }

    // Do not hard-fail invite on Supabase Auth invite endpoint instability.
    // We can still send a valid role-aware invite using a generated action link when available,
    // and fallback to signup URL otherwise.

    if (invitedUserId) {
      const displayName = email.split('@')[0];
      const { error: profileError } = await admin.from('profiles').upsert(
        {
          id: invitedUserId,
          full_name: displayName,
          role,
          status: role === 'admin' ? 'active' : 'pending_approval',
          preferred_language: 'en',
          registration_source: 'admin_invite',
        },
        { onConflict: 'id' }
      );

      if (profileError) {
        console.warn('Invite succeeded but profile upsert failed:', profileError);
      }
    }

    const inviteLink = await resolveInviteActionLink({
      admin,
      email,
      role,
      invitedBy,
      message,
      redirectTo,
      inviteData,
    });

    try {
      await sendAdminInviteEmail({
        toEmail: email,
        role,
        inviteLink,
        adminMessage: message,
      });
    } catch (mailError) {
      console.error('Invite email send failed:', mailError);
      return {
        success: false,
        error: `Invite was created, but custom invite email failed: ${getErrorMessage(
          mailError,
          'Check Brevo sender/API settings and retry.'
        )}`,
      };
    }

    revalidateAdminUsersRoutes();
    return { success: true };
  } catch (error) {
    console.error('Unexpected error in inviteUserAction:', error);
    return { success: false, error: getErrorMessage(error, 'An unexpected error occurred') };
  }
}

export async function assignCourseInstructorAction(params: {
  courseId: string;
  instructorId: string;
  setPrimary?: boolean;
  revenueShare?: number;
  requireEmailNotification?: boolean;
}): Promise<ActionResult> {
  try {
    const admin = createAdminClient();
    const websiteUrl = getWebsiteUrl();

    const { data: instructorProfile, error: instructorError } = await admin
      .from('profiles')
      .select('id, role, status, full_name')
      .eq('id', params.instructorId)
      .single();

    if (instructorError || !instructorProfile) {
      return { success: false, error: 'Instructor profile not found.' };
    }

    if (instructorProfile.role !== 'instructor') {
      return { success: false, error: 'Selected user is not an instructor.' };
    }

    const { data: courseData, error: courseError } = await admin
      .from('courses')
      .select('id, title')
      .eq('id', params.courseId)
      .single();

    if (courseError || !courseData) {
      return { success: false, error: 'Course not found.' };
    }

    const share =
      typeof params.revenueShare === 'number'
        ? Math.max(0, Math.min(100, params.revenueShare))
        : 70;

    if (params.setPrimary ?? true) {
      await admin.from('course_instructors').update({ is_primary: false }).eq('course_id', params.courseId);
    }

    const upsertPayload = {
      course_id: params.courseId,
      instructor_id: params.instructorId,
      is_primary: params.setPrimary ?? true,
      revenue_share: share,
    };

    let upsertRes = await admin
      .from('course_instructors')
      .upsert(upsertPayload, { onConflict: 'course_id,instructor_id' });

    if (upsertRes.error) {
      // Fallback for deployments where composite conflict metadata differs.
      const { data: existing } = await admin
        .from('course_instructors')
        .select('course_id, instructor_id')
        .eq('course_id', params.courseId)
        .eq('instructor_id', params.instructorId)
        .maybeSingle();

      if (existing) {
        upsertRes = await admin
          .from('course_instructors')
          .update({ is_primary: params.setPrimary ?? true, revenue_share: share })
          .eq('course_id', params.courseId)
          .eq('instructor_id', params.instructorId);
      } else {
        upsertRes = await admin.from('course_instructors').insert(upsertPayload);
      }
    }

    if (upsertRes.error) {
      console.error('assignCourseInstructorAction failed:', upsertRes.error);
      return { success: false, error: upsertRes.error.message || 'Failed to assign instructor.' };
    }

    const instructorEditUrl = `${websiteUrl}/instructor/courses/${params.courseId}/edit`;
    const courseTitle = courseData.title || 'Untitled Course';

    await notifyUser(admin, {
      userId: params.instructorId,
      type: 'course',
      title: 'Course Assignment Updated',
      message: `You have been assigned as primary instructor for "${courseTitle}" with ${share}% revenue share.`,
      actionUrl: instructorEditUrl,
      metadata: {
        course_id: params.courseId,
        revenue_share: share,
        assignment_source: 'admin',
      },
    });

    try {
      const { data: authData } = await admin.auth.admin.getUserById(params.instructorId);
      const instructorEmail = authData?.user?.email || null;
      if (instructorEmail) {
        await sendInstructorAssignmentEmail({
          toEmail: instructorEmail,
          recipientName: instructorProfile.full_name || instructorEmail.split('@')[0] || 'Instructor',
          courseTitle,
          roleMessage: 'An admin has assigned you to a course and granted editor access.',
          instructorEditUrl,
          revenueShare: share,
        });
      } else if (params.requireEmailNotification) {
        return {
          success: false,
          error: 'Instructor assignment completed, but no email address was found to send course invite mail.',
        };
      }
    } catch (mailError) {
      console.error('Failed to send instructor assignment email:', mailError);
      if (params.requireEmailNotification) {
        return {
          success: false,
          error: getErrorMessage(mailError, 'Instructor assignment completed, but email notification failed.'),
        };
      }
    }

    revalidatePath('/admin/courses');
    revalidatePath(`/admin/courses/${params.courseId}`);
    return { success: true };
  } catch (error) {
    console.error('Unexpected error in assignCourseInstructorAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to assign instructor.') };
  }
}

export async function createAdminCourseAction(params: {
  title?: string;
  instructorId: string;
  language?: string;
  difficulty?: string;
  categoryId?: string | null;
  isFree?: boolean;
  price?: number | null;
  revenueShare?: number;
}): Promise<ActionResult & { courseId?: string }> {
  try {
    const admin = createAdminClient();

    const safeTitle = (params.title || '').trim() || 'Untitled Course';

    const { data: instructorProfile, error: instructorError } = await admin
      .from('profiles')
      .select('id, role')
      .eq('id', params.instructorId)
      .single();

    if (instructorError || !instructorProfile || instructorProfile.role !== 'instructor') {
      return { success: false, error: 'Please select a valid instructor.' };
    }

    const slugBase = safeTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60) || 'course';
    const slug = `${slugBase}-${Math.random().toString(36).slice(2, 8)}`;

    const isFree = Boolean(params.isFree);
    const price = isFree ? 0 : Math.max(0, Number(params.price || 0));

    const coursePayload: Record<string, unknown> = {
      title: safeTitle,
      slug,
      status: 'draft',
      language: params.language || 'en',
      difficulty: params.difficulty || 'beginner',
      is_free: isFree,
      price,
      discounted_price: null,
    };

    if (params.categoryId) {
      coursePayload.category_id = params.categoryId;
    }

    const { data: created, error: createError } = await admin
      .from('courses')
      .insert(coursePayload)
      .select('id')
      .single();

    if (createError || !created?.id) {
      console.error('createAdminCourseAction create failed:', createError);
      return { success: false, error: createError?.message || 'Failed to create course.' };
    }

    const assignRes = await assignCourseInstructorAction({
      courseId: created.id,
      instructorId: params.instructorId,
      setPrimary: true,
      revenueShare: params.revenueShare,
      requireEmailNotification: true,
    });

    if (!assignRes.success) {
      return { success: false, error: assignRes.error || 'Course created, but instructor assignment failed.' };
    }

    revalidatePath('/admin/courses');
    return { success: true, courseId: created.id };
  } catch (error) {
    console.error('Unexpected error in createAdminCourseAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to create course.') };
  }
}

export async function getUserAuthMetadataAction({
  userId,
}: {
  userId: string;
}): Promise<
  ActionResult & {
    emailVerified?: boolean;
    authProvider?: string;
    lastSignInAt?: string | null;
  }
> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.getUserById(userId);

    if (error) {
      console.error('Error getting auth metadata:', error);
      return { success: false, error: 'Failed to load auth metadata' };
    }

    const authUser = data?.user;
    const providers = (authUser?.app_metadata?.providers || []) as string[];
    const provider =
      providers[0] ||
      (typeof authUser?.app_metadata?.provider === 'string'
        ? authUser.app_metadata.provider
        : 'email');

    return {
      success: true,
      emailVerified: Boolean(authUser?.email_confirmed_at),
      authProvider: provider,
      lastSignInAt: authUser?.last_sign_in_at ?? null,
    };
  } catch (error) {
    console.error('Unexpected error in getUserAuthMetadataAction:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function getUserQuickDetailAction({
  userId,
}: {
  userId: string;
}): Promise<
  ActionResult & {
    user?: {
      id: string;
      full_name: string;
      display_name?: string | null;
      email?: string | null;
      role: string;
      status: string;
      avatar_url?: string | null;
      preferred_language?: string | null;
      registration_source?: string | null;
      created_at: string;
      updated_at?: string | null;
      bio?: string | null;
      phone?: string | null;
    };
  }
> {
  try {
    const admin = createAdminClient();

    const fullSelect = `
      id, full_name, display_name, email,
      role, status, avatar_url,
      preferred_language, registration_source,
      created_at, updated_at, bio, phone
    `;
    const fallbackSelect = `
      id, full_name, display_name,
      role, status, avatar_url,
      preferred_language, registration_source,
      created_at, updated_at, bio, phone
    `;

    const { data: fullProfile, error: fullError } = await admin
      .from('profiles')
      .select(fullSelect)
      .eq('id', userId)
      .single();

    const { data: fallbackProfile } = fullError
      ? await admin
          .from('profiles')
          .select(fallbackSelect)
          .eq('id', userId)
          .single()
      : { data: null };

    const profile = (fullProfile || fallbackProfile) as Record<string, any> | null;

    if (!profile) {
      return { success: false, error: 'User not found' };
    }

    let email = (profile.email as string | null) || null;
    if (!email) {
      const { data: authData } = await admin.auth.admin.getUserById(userId);
      email = authData?.user?.email || null;
    }

    return {
      success: true,
      user: {
        id: profile.id,
        full_name: profile.full_name || 'Unnamed User',
        display_name: profile.display_name || null,
        email,
        role: profile.role,
        status: profile.status,
        avatar_url: profile.avatar_url || null,
        preferred_language: profile.preferred_language || null,
        registration_source: profile.registration_source || null,
        created_at: profile.created_at,
        updated_at: profile.updated_at || null,
        bio: profile.bio || null,
        phone: profile.phone || null,
      },
    };
  } catch (error) {
    console.error('Unexpected error in getUserQuickDetailAction:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Approve a pending course
 */
export async function approveCourseAction({
  courseId,
  adminId,
}: {
  courseId: string;
  adminId: string;
}) {
  try {
    const admin = createAdminClient();

    // 1. Get course details
    const { data: course, error: fetchError } = await admin
      .from('courses')
      .select('instructor_id, title')
      .eq('id', courseId)
      .single();

    if (fetchError || !course) {
      return { success: false, error: 'Course not found' };
    }

    // 2. Update course status
    const { error: updateError } = await admin
      .from('courses')
      .update({
        status: 'approved',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', courseId);

    if (updateError) {
      console.error('Error approving course:', updateError);
      return { success: false, error: 'Failed to approve course' };
    }

    // 3. Get course_instructors entries for this course
    const { data: courseInstructors } = await admin
      .from('course_instructors')
      .select('instructor_id')
      .eq('course_id', courseId);

    // 4. Send notification to all instructors linked to this course
    const instructorIds = courseInstructors?.map((ci) => ci.instructor_id) || [];

    if (instructorIds.length > 0) {
      const notifications = instructorIds.map((instructorId) => ({
        user_id: instructorId,
        type: 'course_approved',
        title: 'Course Approved! 🎉',
        message: `Your course "${course.title}" has been approved and is now live!`,
        action_url: `/instructor/courses/${courseId}`,
        metadata: { course_id: courseId },
        is_read: false,
        created_at: new Date().toISOString(),
      }));

      await admin.from('notifications').insert(notifications);
    }

    revalidatePath('/admin', 'layout');
    revalidatePath('/admin/courses');

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in approveCourseAction:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Reject a pending course with a reason
 */
export async function rejectCourseAction({
  courseId,
  adminId,
  reason,
}: {
  courseId: string;
  adminId: string;
  reason: string;
}) {
  try {
    const admin = createAdminClient();

    // 1. Get course details
    const { data: course, error: fetchError } = await admin
      .from('courses')
      .select('instructor_id, title')
      .eq('id', courseId)
      .single();

    if (fetchError || !course) {
      return { success: false, error: 'Course not found' };
    }

    // 2. Update course status
    const { error: updateError } = await admin
      .from('courses')
      .update({
        status: 'rejected',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason,
      })
      .eq('id', courseId);

    if (updateError) {
      console.error('Error rejecting course:', updateError);
      return { success: false, error: 'Failed to reject course' };
    }

    // 3. Get course_instructors entries
    const { data: courseInstructors } = await admin
      .from('course_instructors')
      .select('instructor_id')
      .eq('course_id', courseId);

    const instructorIds = courseInstructors?.map((ci) => ci.instructor_id) || [];

    // 4. Send notification to all instructors
    if (instructorIds.length > 0) {
      const notifications = instructorIds.map((instructorId) => ({
        user_id: instructorId,
        type: 'course_rejected',
        title: 'Course Submission Update',
        message: `Your course "${course.title}" was not approved. Reason: ${reason}`,
        action_url: `/instructor/courses/${courseId}`,
        metadata: { course_id: courseId, reason },
        is_read: false,
        created_at: new Date().toISOString(),
      }));

      await admin.from('notifications').insert(notifications);
    }

    revalidatePath('/admin', 'layout');
    revalidatePath('/admin/courses');

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in rejectCourseAction:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

type ModerationTargetType = 'course' | 'product';
type ModerationAction = 'approve' | 'reject' | 'revoke' | 'pending';

interface ModerateContentInput {
  itemId: string;
  adminId: string;
  type: ModerationTargetType;
  action: ModerationAction;
  note?: string;
}

function getCourseStatusForAction(action: ModerationAction) {
  if (action === 'approve') return 'approved';
  if (action === 'reject') return 'rejected';
  if (action === 'revoke') return 'draft';
  return 'pending';
}

function getProductStatusForAction(action: ModerationAction) {
  // Product storefront currently treats `active` as live/approved.
  if (action === 'approve') return 'active';
  if (action === 'reject') return 'rejected';
  if (action === 'revoke') return 'draft';
  return 'pending';
}

function getModerationMeta(type: ModerationTargetType, action: ModerationAction) {
  if (action === 'approve') {
    return {
      title: type === 'course' ? '🎉 Course is now Live!' : '🎉 Product is now Live!',
      message:
        type === 'course'
          ? 'Your course is approved and visible to students.'
          : 'Your product is approved and visible in the shop.',
    };
  }

  if (action === 'reject') {
    return {
      title: type === 'course' ? 'Course Needs Revision' : 'Product Listing Rejected',
      message:
        type === 'course'
          ? 'Your course needs updates before approval. Please review admin feedback and resubmit.'
          : 'Your product listing needs updates before approval. Please review admin feedback and resubmit.',
    };
  }

  if (action === 'revoke') {
    return {
      title: type === 'course' ? 'Course Approval Revoked' : 'Product Approval Revoked',
      message:
        type === 'course'
          ? 'Your course was moved back to draft and is no longer live.'
          : 'Your product was moved back to draft and is no longer live.',
    };
  }

  return {
    title: type === 'course' ? 'Course Marked for Re-review' : 'Product Marked for Re-review',
    message:
      type === 'course'
        ? 'Your course has been marked pending for another review cycle.'
        : 'Your product has been marked pending for another review cycle.',
  };
}

async function updateModerationRecord(params: {
  admin: ReturnType<typeof createAdminClient>;
  type: ModerationTargetType;
  itemId: string;
  status: string;
  adminId: string;
  reason?: string;
}) {
  const table = params.type === 'course' ? 'courses' : 'products';
  const reviewedAt = new Date().toISOString();

  const preferredUpdate: Record<string, unknown> = {
    status: params.status,
    reviewed_by: params.adminId,
    reviewed_at: reviewedAt,
  };

  if (params.status === 'approved' || params.status === 'active') {
    preferredUpdate.published_at = reviewedAt;
    preferredUpdate.rejection_reason = null;
  }

  if (params.status === 'draft') {
    preferredUpdate.published_at = null;
  }

  if (params.status === 'rejected') {
    preferredUpdate.rejection_reason = params.reason || null;
  }

  let updateResult = await params.admin.from(table).update(preferredUpdate).eq('id', params.itemId);
  if (!updateResult.error) return { error: null };

  // Fallback for deployments missing moderation columns.
  const fallbackUpdate: Record<string, unknown> = { status: params.status };
  if (params.status === 'approved' || params.status === 'active') {
    fallbackUpdate.published_at = reviewedAt;
  }
  if (params.status === 'draft') {
    fallbackUpdate.published_at = null;
  }
  if (params.status === 'rejected' && params.reason) {
    fallbackUpdate.rejection_reason = params.reason;
  }

  updateResult = await params.admin.from(table).update(fallbackUpdate).eq('id', params.itemId);
  if (!updateResult.error) return { error: null };

  const minimalResult = await params.admin
    .from(table)
    .update({ status: params.status })
    .eq('id', params.itemId);

  return { error: minimalResult.error };
}

async function fetchContentCreators(params: {
  admin: ReturnType<typeof createAdminClient>;
  type: ModerationTargetType;
  itemId: string;
}) {
  if (params.type === 'course') {
    const { data: course, error } = await params.admin
      .from('courses')
      .select('id, title')
      .eq('id', params.itemId)
      .single();

    if (error || !course) return { title: 'Course', creatorIds: [], error: error?.message || 'Course not found' };

    const { data: instructors } = await params.admin
      .from('course_instructors')
      .select('instructor_id')
      .eq('course_id', params.itemId);

    return {
      title: course.title || 'Course',
      creatorIds: (instructors || []).map((row) => row.instructor_id).filter(Boolean),
      error: null,
    };
  }

  const { data: product, error } = await params.admin
    .from('products')
    .select('id, name, seller_id')
    .eq('id', params.itemId)
    .single();

  if (error || !product) return { title: 'Product', creatorIds: [], error: error?.message || 'Product not found' };

  return {
    title: product.name || 'Product',
    creatorIds: product.seller_id ? [product.seller_id] : [],
    error: null,
  };
}

async function notifyContentModeration(params: {
  admin: ReturnType<typeof createAdminClient>;
  type: ModerationTargetType;
  action: ModerationAction;
  itemId: string;
  itemTitle: string;
  creatorIds: string[];
  note?: string;
}) {
  if (params.creatorIds.length === 0) return;

  const meta = getModerationMeta(params.type, params.action);
  const text = params.note ? `${meta.message}\n\nAdmin note: ${params.note}` : meta.message;
  const itemPath =
    params.type === 'course' ? `/instructor/courses/${params.itemId}` : `/seller/products/${params.itemId}`;

  const rows = params.creatorIds.map((userId) => ({
    user_id: userId,
    type: 'system',
    title: meta.title,
    message: `${text}${params.itemTitle ? `\n\nItem: ${params.itemTitle}` : ''}`,
    action_url: itemPath,
    metadata: {
      item_id: params.itemId,
      item_type: params.type,
      moderation_action: params.action,
      note: params.note || null,
    },
    is_read: false,
    created_at: new Date().toISOString(),
  }));

  const { error } = await params.admin.from('notifications').insert(rows);
  if (error) {
    console.error('Error sending content moderation notifications:', error);
  }
}

export async function moderateContentAction(input: ModerateContentInput): Promise<ActionResult> {
  try {
    const admin = createAdminClient();
    const moderationStatus =
      input.type === 'course'
        ? getCourseStatusForAction(input.action)
        : getProductStatusForAction(input.action);

    if (input.action === 'reject') {
      const noteLength = input.note?.trim().length || 0;
      if (noteLength < 50) {
        return { success: false, error: 'Rejection feedback must be at least 50 characters.' };
      }
    }

    const creatorData = await fetchContentCreators({
      admin,
      type: input.type,
      itemId: input.itemId,
    });

    if (creatorData.error) {
      return { success: false, error: creatorData.error };
    }

    const updateResult = await updateModerationRecord({
      admin,
      type: input.type,
      itemId: input.itemId,
      status: moderationStatus,
      adminId: input.adminId,
      reason: input.note,
    });

    if (updateResult.error) {
      console.error('Content moderation update failed:', updateResult.error);
      return { success: false, error: 'Failed to update content status.' };
    }

    await notifyContentModeration({
      admin,
      type: input.type,
      action: input.action,
      itemId: input.itemId,
      itemTitle: creatorData.title,
      creatorIds: creatorData.creatorIds,
      note: input.note,
    });

    revalidatePath('/admin', 'layout');
    revalidatePath('/admin/courses');
    revalidatePath('/admin/products');
    revalidatePath(`/admin/courses/${input.itemId}`);
    revalidatePath(`/admin/products/${input.itemId}`);

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in moderateContentAction:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

export async function bulkModerateContentAction(params: {
  adminId: string;
  type: ModerationTargetType;
  action: Extract<ModerationAction, 'approve' | 'reject'>;
  itemIds: string[];
  note?: string;
}): Promise<ActionResult> {
  try {
    const ids = (params.itemIds || []).filter(Boolean);
    if (ids.length === 0) {
      return { success: false, error: 'No items selected.' };
    }

    if (params.action === 'reject') {
      const noteLength = params.note?.trim().length || 0;
      if (noteLength < 50) {
        return { success: false, error: 'Rejection feedback must be at least 50 characters.' };
      }
    }

    const admin = createAdminClient();
    const moderationStatus =
      params.type === 'course'
        ? getCourseStatusForAction(params.action)
        : getProductStatusForAction(params.action);

    // Fast-path bulk update.
    const reviewedAt = new Date().toISOString();
    const table = params.type === 'course' ? 'courses' : 'products';
    const baseUpdate: Record<string, unknown> = {
      status: moderationStatus,
      reviewed_by: params.adminId,
      reviewed_at: reviewedAt,
    };

    if (moderationStatus === 'approved' || moderationStatus === 'active') {
      baseUpdate.published_at = reviewedAt;
      baseUpdate.rejection_reason = null;
    }
    if (moderationStatus === 'rejected') {
      baseUpdate.rejection_reason = params.note || null;
    }

    let bulkUpdate = await admin.from(table).update(baseUpdate).in('id', ids);
    if (bulkUpdate.error) {
      const fallbackUpdate: Record<string, unknown> = {
        status: moderationStatus,
      };
      if (moderationStatus === 'approved' || moderationStatus === 'active') {
        fallbackUpdate.published_at = reviewedAt;
      }
      if (moderationStatus === 'rejected' && params.note) {
        fallbackUpdate.rejection_reason = params.note;
      }

      bulkUpdate = await admin.from(table).update(fallbackUpdate).in('id', ids);
    }

    if (bulkUpdate.error) {
      console.error('Bulk moderation update failed:', bulkUpdate.error);
      return { success: false, error: 'Failed to update selected content.' };
    }

    // Fetch creators from updated records and notify.
    if (params.type === 'course') {
      const { data: courses } = await admin.from('courses').select('id, title').in('id', ids);
      const { data: links } = await admin
        .from('course_instructors')
        .select('course_id, instructor_id')
        .in('course_id', ids);

      const creatorsByCourse = new Map<string, string[]>();
      (links || []).forEach((row) => {
        if (!creatorsByCourse.has(row.course_id)) creatorsByCourse.set(row.course_id, []);
        creatorsByCourse.get(row.course_id)!.push(row.instructor_id);
      });

      await Promise.all(
        (courses || []).map((course) =>
          notifyContentModeration({
            admin,
            type: 'course',
            action: params.action,
            itemId: course.id,
            itemTitle: course.title || 'Course',
            creatorIds: creatorsByCourse.get(course.id) || [],
            note: params.note,
          })
        )
      );
    } else {
      const { data: products } = await admin
        .from('products')
        .select('id, name, seller_id')
        .in('id', ids);

      await Promise.all(
        (products || []).map((product) =>
          notifyContentModeration({
            admin,
            type: 'product',
            action: params.action,
            itemId: product.id,
            itemTitle: product.name || 'Product',
            creatorIds: product.seller_id ? [product.seller_id] : [],
            note: params.note,
          })
        )
      );
    }

    revalidatePath('/admin', 'layout');
    revalidatePath('/admin/courses');
    revalidatePath('/admin/products');

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in bulkModerateContentAction:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}
