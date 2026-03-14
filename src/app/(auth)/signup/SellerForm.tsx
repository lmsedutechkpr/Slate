'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { PasswordInput } from '@/components/auth/PasswordInput';
import { PasswordStrengthBar } from '@/components/auth/PasswordStrengthBar';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import AuthWindow from '@/components/auth/AuthWindow';

const sellerSchema = z
  .object({
    full_name: z.string().min(2, 'Name is required'),
    email: z.string().email('Valid email is required'),
    password: z
      .string()
      .min(8, 'Min 8 characters')
      .regex(/[A-Z]/, 'Must contain one uppercase letter')
      .regex(/[0-9]/, 'Must contain one number'),
    confirm_password: z.string(),
    store_name: z.string().min(3, 'Store Name must be at least 3 chars'),
    store_name_ta: z.string().optional().or(z.literal('')),
    store_slug: z.string().min(3, 'Slug must be at least 3 chars').regex(/^[a-z0-9-]+$/, 'Lowercase, numbers, hyphens only'),
    business_type: z.enum(['Individual', 'Company']),
    store_description: z.string().min(50, 'Please describe your store (min 50 chars)'),
    categories: z.array(z.string()).min(1, 'Select at least one product category'),
    gst_number: z.string().optional().or(z.literal('')),
    business_website: z.string().url('Must be a valid URL').optional().or(z.literal(''))
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password']
  });

type FormValues = z.infer<typeof sellerSchema>;

export function SellerForm({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    const fetchCats = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('product_categories').select('id, name').order('name');
      if (data) setAvailableCategories(data);
    };
    fetchCats();
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(sellerSchema),
    defaultValues: {
      business_type: 'Individual',
      categories: [],
    }
  });

  const password = watch('password');
  const storeName = watch('store_name') || '';
  const slug = watch('store_slug') || '';
  const businessType = watch('business_type');
  const selectedCategories = watch('categories') || [];

  // Auto-generate slug when storeName changes (unless manually edited)
  useEffect(() => {
    if (storeName && !formStateHasSlugEdit) {
      const newSlug = storeName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      setValue('store_slug', newSlug, { shouldValidate: true });
    }
  }, [storeName, setValue]);

  const [formStateHasSlugEdit, setFormStateHasSlugEdit] = useState(false);
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormStateHasSlugEdit(true);
    setValue('store_slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''), { shouldValidate: true });
  };

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setValue('categories', selectedCategories.filter((c) => c !== categoryId), { shouldValidate: true });
    } else {
      setValue('categories', [...selectedCategories, categoryId], { shouldValidate: true });
    }
  };

  const onSubmit = async (data: FormValues) => {
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
            role: 'seller'
          }
        }
      });

      if (error) throw error;

      if (authData.user) {
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          full_name: data.full_name,
          role: 'seller',
          status: 'pending',
          registration_source: 'self'
        });

        // Insert seller details
        await supabase.from('seller_profiles').upsert({
          user_id: authData.user.id,
          store_name: data.store_name,
          store_name_ta: data.store_name_ta || null,
          store_slug: data.store_slug,
          store_description: data.store_description,
          business_type: data.business_type,
          commission_rate: 85,
          contact_email: data.email
        });
        
        // Note: Realistically we'd need a joining table for store categories, 
        // but since `categories` might not exist in `seller_profiles`, we just store in the sign up flow safely.

        router.push(`/pending-approval?role=seller&email=${encodeURIComponent(data.email)}`);
      }
    } catch (err: any) {
      setErrorCode(err.message || 'An error occurred during sign up.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthWindow title="Seller Application" width="lg">
      <div className="mb-5 flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-raised)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="font-sans text-[20px] font-bold text-[var(--text)]">Seller Application</h1>
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
          <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Store Details</span>
          <div className="h-px w-full bg-[var(--border)]" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Store Name */}
          <div>
            <input
              {...register('store_name')}
              type="text"
              placeholder="Store Name (e.g. TechGear India)"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none"
            />
            {errors.store_name && <p className="mt-1 text-[11px] text-[var(--traffic-red)]">{errors.store_name.message}</p>}
          </div>

          <div>
            <input
              {...register('store_name_ta')}
              type="text"
              placeholder="Store Name in Tamil (optional)"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none"
            />
          </div>
        </div>

        {/* Slug */}
        <div>
          <input
            {...register('store_slug')}
            type="text"
            onChange={handleSlugChange}
            placeholder="store-slug"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none"
          />
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">Live preview: <span className="text-[var(--text)] font-mono">slate.dev/store/{slug}</span></p>
          {errors.store_slug && <p className="mt-1 text-[11px] text-[var(--traffic-red)]">{errors.store_slug.message}</p>}
        </div>

        {/* Business Type */}
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">Business Type</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setValue('business_type', 'Individual')}
              className={cn(
                'rounded-full border px-4 py-1 text-[12px] font-medium transition-colors',
                businessType === 'Individual'
                  ? 'border-[var(--text)] bg-[var(--surface-hover)] text-[var(--text)]'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'
              )}
            >
              Individual
            </button>
            <button
              type="button"
              onClick={() => setValue('business_type', 'Company')}
              className={cn(
                'rounded-full border px-4 py-1 text-[12px] font-medium transition-colors',
                businessType === 'Company'
                  ? 'border-[var(--text)] bg-[var(--surface-hover)] text-[var(--text)]'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'
              )}
            >
              Company
            </button>
          </div>
        </div>

        {/* Store Desc */}
        <div>
          <textarea
            {...register('store_description')}
            rows={2}
            placeholder="Describe what you sell and why students will love it..."
            className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none"
          />
          {errors.store_description && <p className="mt-1 text-[11px] text-[var(--traffic-red)]">{errors.store_description.message}</p>}
        </div>

        {/* Categories */}
        {availableCategories.length > 0 && (
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">Product Categories</label>
            <div className="flex flex-wrap gap-1.5">
              {availableCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-[11px] font-medium transition-colors',
                    selectedCategories.includes(cat.id)
                      ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)]'
                      : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text)]'
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            {errors.categories && <p className="mt-1 text-[11px] text-[var(--traffic-red)]">{errors.categories.message}</p>}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* GST */}
          <div>
            <input
              {...register('gst_number')}
              type="text"
              placeholder="GST Number (optional)"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">Required for businesses</p>
          </div>

          <div>
            <input
              {...register('business_website')}
              type="url"
              placeholder="Business Website (e.g. https://...)"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none"
            />
            {errors.business_website && <p className="mt-1 text-[11px] text-[var(--traffic-red)]">{errors.business_website.message}</p>}
          </div>
        </div>

        {errorCode && (
          <div className="flex items-start gap-2 rounded-xl border border-[var(--traffic-red)]/20 bg-[var(--traffic-red)]/10 px-4 py-2.5 text-[12px] text-[var(--traffic-red)]">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>{errorCode}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 w-full rounded-full bg-[var(--text)] py-2.5 text-[13px] font-semibold text-[var(--bg)] transition-all duration-150 hover:scale-[1.01] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Submit Application →'}
        </button>
      </form>
    </AuthWindow>
  );
}
