'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient, createClient } from '@/lib/supabase/server';

interface EnsureSignupProfileInput {
  userId: string;
  role: 'student' | 'instructor' | 'seller';
  fullName: string;
  preferredLanguage?: 'en' | 'ta';
  registrationSource?: 'self' | 'google' | 'admin_invite';
  instructorProfile?: {
    headline?: string;
    expertise_tags?: string[];
    teaching_languages?: string[];
    bio?: string;
    linkedin_url?: string | null;
    commission_rate?: number;
  };
  sellerProfile?: {
    store_name?: string;
    store_name_ta?: string | null;
    store_slug?: string;
    store_description?: string;
    business_type?: 'Individual' | 'Company' | 'individual' | 'company';
    commission_rate?: number;
    contact_email?: string;
  };
}

interface SellerSignupInput {
  full_name: string;
  email: string;
  password: string;
  store_name: string;
  store_name_ta?: string;
  store_slug: string;
  business_type: 'Individual' | 'Company' | 'individual' | 'company';
  store_description: string;
  categories: string[];
  gst_number?: string;
  business_website?: string;
}

interface InstructorSignupInput {
  full_name: string;
  email: string;
  password: string;
  headline: string;
  expertise_tags: string[];
  teaching_languages: string[];
  short_bio: string;
  motivation: string;
  linkedin_url?: string;
}

interface StudentSignupInput {
  full_name: string;
  email: string;
  password: string;
  language: 'en' | 'ta';
}

interface SignupActionResult {
  success: boolean;
  error?: string;
  errorCode?: string;
  nextPath?: string;
  requiresEmailVerification?: boolean;
}

type SignupEnsureInput = Omit<EnsureSignupProfileInput, 'userId'>;

function normalizeBusinessType(value: string | null | undefined): 'individual' | 'company' {
  const normalized = (value || '').trim().toLowerCase();
  return normalized === 'company' ? 'company' : 'individual';
}

async function waitForAuthUserById(userId: string): Promise<boolean> {
  const admin = createAdminClient();

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (!error && data.user?.id) {
      return true;
    }

    if (attempt < 5) {
      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    }
  }

  return false;
}

async function resolveAuthUserId(params: {
  currentUserId: string;
  email: string;
  password: string;
  userData: Record<string, unknown>;
  allowAdminFallback?: boolean;
}): Promise<string | null> {
  const exists = await waitForAuthUserById(params.currentUserId);
  if (exists) {
    return params.currentUserId;
  }

  if (!params.allowAdminFallback) {
    return null;
  }

  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: params.email,
    password: params.password,
    email_confirm: true,
    user_metadata: params.userData,
  });

  if (!createError && created.user?.id) {
    return created.user.id;
  }

  const message = (createError?.message || '').toLowerCase();
  if (message.includes('already') || message.includes('exists')) {
    const { data: listData, error: listError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (!listError && listData.users?.length) {
      const matched = listData.users.find(
        (user) => (user.email || '').toLowerCase() === params.email.toLowerCase()
      );
      if (matched?.id) {
        return matched.id;
      }
    }
  }

  return null;
}

function mapSignupError(err: unknown): { message: string; code: string; isRateLimited: boolean } {
  const fallback = 'Unable to complete signup right now. Please try again.';

  if (!err || typeof err !== 'object') {
    return { message: fallback, code: 'signup_unknown_error', isRateLimited: false };
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
    return { message: 'User already registered.', code: 'signup_user_exists', isRateLimited: false };
  }

  if (
    normalized.includes('rate limit') ||
    normalized.includes('too many requests') ||
    normalized.includes('over_email_send_rate_limit') ||
    status === 429
  ) {
    return {
      message: 'Too many signup attempts right now. Please wait 2 minutes and try again.',
      code: 'signup_rate_limited',
      isRateLimited: true,
    };
  }

  if (normalized.includes('email address') && normalized.includes('invalid')) {
    return { message: 'Please enter a valid email address.', code: 'signup_invalid_email', isRateLimited: false };
  }

  if (normalized.includes('signup is disabled') || normalized.includes('signups not allowed')) {
    return {
      message: 'Signup is currently disabled in authentication settings.',
      code: 'signup_disabled',
      isRateLimited: false,
    };
  }

  if (normalized.includes('redirect') && normalized.includes('not allowed')) {
    return {
      message: 'Auth redirect URL is not allowed. Please contact admin to update Supabase URL settings.',
      code: 'signup_redirect_not_allowed',
      isRateLimited: false,
    };
  }

  if (normalized.includes('failed to fetch') || normalized.includes('network') || normalized.includes('retryable')) {
    return {
      message: 'Unable to reach authentication service right now. Please retry in a moment.',
      code: 'signup_network_error',
      isRateLimited: false,
    };
  }

  if (!message && !code) {
    return {
      message: 'Authentication service is temporarily unavailable. Please retry in a moment.',
      code: 'signup_auth_unavailable',
      isRateLimited: false,
    };
  }

  return { message: fallback, code: 'signup_unknown_error', isRateLimited: false };
}

async function runSignupFlow(params: {
  email: string;
  password: string;
  userData: Record<string, unknown>;
  ensureInput: SignupEnsureInput;
  nextPath: string;
  requiresEmailVerificationByDefault: boolean;
  allowAdminFallback?: boolean;
  preferAdminCreate?: boolean;
}): Promise<SignupActionResult> {
  const redirectBase = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  const emailRedirectTo = redirectBase ? `${redirectBase}/auth/callback` : undefined;

  try {
    const supabase = await createClient();
    let createdUserId: string | null = null;
    let requiresEmailVerification = false;

    let authData: { user?: { id?: string | null } | null; session?: unknown } | null = null;
    let signUpError: unknown = null;

    if (!params.preferAdminCreate) {
      const signUpResult = await supabase.auth.signUp({
        email: params.email,
        password: params.password,
        options: {
          data: params.userData,
          ...(emailRedirectTo ? { emailRedirectTo } : {}),
        },
      });

      authData = signUpResult.data;
      signUpError = signUpResult.error;
    }

    if (params.preferAdminCreate) {
      const admin = createAdminClient();
      const { data: adminCreateData, error: adminCreateError } = await admin.auth.admin.createUser({
        email: params.email,
        password: params.password,
        email_confirm: true,
        user_metadata: params.userData,
      });

      if (adminCreateError || !adminCreateData.user?.id) {
        const mapped = mapSignupError(adminCreateError);
        return { success: false, error: mapped.message, errorCode: mapped.code };
      }

      createdUserId = adminCreateData.user.id;
      requiresEmailVerification = false;
    }

    if (!params.preferAdminCreate && signUpError) {
      const mapped = mapSignupError(signUpError);
      const shouldTryAdminFallback =
        Boolean(params.allowAdminFallback) &&
        (mapped.code === 'signup_network_error' ||
          mapped.code === 'signup_auth_unavailable' ||
          mapped.code === 'signup_unknown_error');

      if (!shouldTryAdminFallback) {
        return { success: false, error: mapped.message, errorCode: mapped.code };
      }

      // Fallback path for unstable auth signup endpoint: create user directly with admin API.
      const admin = createAdminClient();
      const { data: adminCreateData, error: adminCreateError } = await admin.auth.admin.createUser({
        email: params.email,
        password: params.password,
        email_confirm: true,
        user_metadata: params.userData,
      });

      if (adminCreateError || !adminCreateData.user?.id) {
        const fallbackMapped = mapSignupError(adminCreateError || signUpError);
        return {
          success: false,
          error: fallbackMapped.message,
          errorCode: fallbackMapped.code,
        };
      }

      createdUserId = adminCreateData.user.id;
      requiresEmailVerification = false;
    } else if (!params.preferAdminCreate) {
      createdUserId = authData?.user?.id ?? null;
      requiresEmailVerification = params.requiresEmailVerificationByDefault && !authData?.session;
    }

    if (!createdUserId) {
      return {
        success: false,
        error: 'Signup response missing user record. Please retry in a minute.',
        errorCode: 'signup_user_missing',
      };
    }

    const resolvedUserId = await resolveAuthUserId({
      currentUserId: createdUserId,
      email: params.email,
      password: params.password,
      userData: params.userData,
      allowAdminFallback: params.allowAdminFallback,
    });

    if (!resolvedUserId) {
      return {
        success: false,
        error: 'Authentication user is still propagating. Please retry in 10 seconds.',
        errorCode: 'signup_auth_propagation_delay',
      };
    }

    const provision = await ensureSignupProfileAction({
      ...params.ensureInput,
      userId: resolvedUserId,
    });

    if (!provision.success) {
      return {
        success: false,
        error: provision.error || 'Failed to create user profile',
        errorCode: 'signup_profile_setup_failed',
      };
    }

    return {
      success: true,
      nextPath: params.nextPath,
      requiresEmailVerification,
    };
  } catch (error) {
    console.error('Unexpected error in signup flow:', error);
    const mapped = mapSignupError(error);
    return { success: false, error: mapped.message, errorCode: mapped.code };
  }
}

export async function signupSellerAction(input: SellerSignupInput): Promise<SignupActionResult> {
  const businessType = normalizeBusinessType(input.business_type);
  const nextPath = `/pending-approval?role=seller&email=${encodeURIComponent(input.email)}`;

  return runSignupFlow({
    email: input.email,
    password: input.password,
    userData: {
      full_name: input.full_name,
      role: 'seller',
      store_name: input.store_name,
      store_name_ta: input.store_name_ta || null,
      store_slug: input.store_slug,
      store_description: input.store_description,
      business_type: businessType,
      categories: input.categories,
      gst_number: input.gst_number || null,
      business_website: input.business_website || null,
    },
    ensureInput: {
      role: 'seller',
      fullName: input.full_name,
      preferredLanguage: 'en',
      registrationSource: 'self',
      sellerProfile: {
        store_name: input.store_name,
        store_name_ta: input.store_name_ta || null,
        store_slug: input.store_slug,
        store_description: input.store_description,
        business_type: businessType,
        commission_rate: 85,
        contact_email: input.email,
      },
    },
    nextPath,
    requiresEmailVerificationByDefault: false,
    allowAdminFallback: true,
    preferAdminCreate: true,
  });
}

export async function signupInstructorAction(input: InstructorSignupInput): Promise<SignupActionResult> {
  const nextPath = `/pending-approval?role=instructor&email=${encodeURIComponent(input.email)}`;

  return runSignupFlow({
    email: input.email,
    password: input.password,
    userData: {
      full_name: input.full_name,
      role: 'instructor',
      headline: input.headline,
      expertise_tags: input.expertise_tags,
      teaching_languages: input.teaching_languages,
      short_bio: input.short_bio,
      motivation: input.motivation,
      linkedin_url: input.linkedin_url || null,
    },
    ensureInput: {
      role: 'instructor',
      fullName: input.full_name,
      preferredLanguage: input.teaching_languages[0] === 'ta' ? 'ta' : 'en',
      registrationSource: 'self',
      instructorProfile: {
        headline: input.headline,
        expertise_tags: input.expertise_tags,
        teaching_languages: input.teaching_languages,
        bio: input.short_bio,
        linkedin_url: input.linkedin_url || null,
        commission_rate: 70,
      },
    },
    nextPath,
    requiresEmailVerificationByDefault: false,
    allowAdminFallback: true,
    preferAdminCreate: true,
  });
}

export async function signupStudentAction(input: StudentSignupInput): Promise<SignupActionResult> {
  const verifyPath = `/verify-email?email=${encodeURIComponent(input.email)}`;

  const result = await runSignupFlow({
    email: input.email,
    password: input.password,
    userData: {
      full_name: input.full_name,
      role: 'student',
    },
    ensureInput: {
      role: 'student',
      fullName: input.full_name,
      preferredLanguage: input.language,
      registrationSource: 'self',
    },
    nextPath: verifyPath,
    requiresEmailVerificationByDefault: true,
  });

  if (!result.success) {
    return result;
  }

  return {
    ...result,
    nextPath: result.requiresEmailVerification ? verifyPath : '/student/dashboard',
  };
}

export async function ensureSignupProfileAction(
  input: EnsureSignupProfileInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = createAdminClient();

    // Auth admin read can be briefly stale right after user creation; retry a few times.
    let authLookupUser: { email?: string | null } | null = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const { data: authLookup, error: authLookupError } = await admin.auth.admin.getUserById(input.userId);
      if (!authLookupError && authLookup?.user) {
        authLookupUser = authLookup.user;
        break;
      }

      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
      }
    }

    const status = input.role === 'student' ? 'active' : 'pending_approval';

    const profilePayload = {
      id: input.userId,
      full_name: input.fullName,
      role: input.role,
      status,
      preferred_language: input.preferredLanguage || 'en',
      registration_source: input.registrationSource || 'self',
    };

    const upsertProfile = async (payload: typeof profilePayload) =>
      admin.from('profiles').upsert(payload, { onConflict: 'id' });

    // Some deployments do not have profiles.email. Keep writes schema-resilient.
    let { error: profileError } = await upsertProfile(profilePayload);

    if (profileError?.message?.toLowerCase().includes('profiles_id_fkey')) {
      // FK can race right after auth creation; retry briefly for auth row visibility.
      for (let attempt = 0; attempt < 4; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
        const retry = await upsertProfile(profilePayload);
        profileError = retry.error;
        if (!profileError) break;
      }
    }

    if (
      profileError &&
      status === 'pending_approval' &&
      profileError.message?.toLowerCase().includes('invalid input value for enum')
    ) {
      // Compatibility fallback for deployments still using legacy "pending" enum value.
      const retry = await upsertProfile(
        {
          ...profilePayload,
          status: 'pending',
        }
      );
      profileError = retry.error;
    }

    if (profileError) {
      return { success: false, error: profileError.message || 'Failed to create profile' };
    }

    const { error: prefError } = await admin
      .from('user_preferences')
      .upsert({ user_id: input.userId, language: input.preferredLanguage || 'en' }, { onConflict: 'user_id' });

    if (prefError) {
      console.warn('Could not upsert user preferences during signup:', prefError);
    }

    if (input.role === 'instructor') {
      const payload = input.instructorProfile || {};
      const { error: instructorError } = await admin
        .from('instructor_profiles')
        .upsert(
          {
            user_id: input.userId,
            headline: payload.headline || null,
            expertise_tags: payload.expertise_tags || [],
            teaching_languages: payload.teaching_languages || ['en'],
            bio: payload.bio || null,
            linkedin_url: payload.linkedin_url || null,
            commission_rate: payload.commission_rate || 70,
          },
          { onConflict: 'user_id' }
        );

      if (instructorError) {
        return { success: false, error: instructorError.message || 'Failed to create instructor profile' };
      }
    }

    if (input.role === 'seller') {
      const payload = input.sellerProfile || {};
      const baseSellerPayload = {
        user_id: input.userId,
        store_name: payload.store_name || null,
        store_name_ta: payload.store_name_ta || null,
        store_slug: payload.store_slug || null,
        store_description: payload.store_description || null,
        commission_rate: payload.commission_rate || 85,
        contact_email: payload.contact_email || authLookupUser?.email || null,
      };

      const normalizedBusinessType = normalizeBusinessType(payload.business_type);

      let { error: sellerError } = await admin
        .from('seller_profiles')
        .upsert(
          {
            ...baseSellerPayload,
            business_type: normalizedBusinessType,
          },
          { onConflict: 'user_id' }
        );

      if (
        sellerError &&
        sellerError.message?.toLowerCase().includes('seller_profiles_business_type_check')
      ) {
        const fallbackBusinessType =
          normalizedBusinessType === 'company' ? 'Company' : 'Individual';

        const retry = await admin
          .from('seller_profiles')
          .upsert(
            {
              ...baseSellerPayload,
              business_type: fallbackBusinessType,
            },
            { onConflict: 'user_id' }
          );

        sellerError = retry.error;
      }

      if (sellerError) {
        return { success: false, error: sellerError.message || 'Failed to create seller profile' };
      }
    }

    revalidatePath('/admin', 'layout');
    revalidatePath('/admin/users');

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in ensureSignupProfileAction:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
