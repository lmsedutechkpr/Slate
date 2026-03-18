'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, ImageIcon, Globe, Instagram, Check, X, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface LocalStore {
  store_name: string;
  store_name_ta: string;
  store_slug: string;
  store_description: string;
  business_type: string;
  banner_url: string;
  logo_url: string;
  contact_email: string;
  social_links: Record<string, string>;
}

interface Props {
  sellerProfile: any;
  userId: string;
  localStore: LocalStore;
  setLocalStore: (fn: (prev: LocalStore) => LocalStore) => void;
  isStoreActive: boolean;
}

export default function StoreSettingsForm({ sellerProfile, userId, localStore, setLocalStore, isStoreActive }: Props) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  // Slug uniqueness state
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const slugCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const update = (field: keyof LocalStore, value: any) => {
    setLocalStore(prev => ({ ...prev, [field]: value }));
  };

  const updateSocial = (key: string, value: string) => {
    setLocalStore(prev => ({
      ...prev,
      social_links: { ...prev.social_links, [key]: value },
    }));
  };

  // ─── Ensure storage buckets exist on mount ───
  useEffect(() => {
    fetch('/api/seller/storage-setup', { method: 'POST' }).catch(() => {});
  }, []);

  // ─── Slug uniqueness check (debounced 500ms) ───
  const checkSlugUniqueness = useCallback(
    (slug: string) => {
      if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current);

      if (!slug || slug.length < 3) {
        setSlugStatus('idle');
        return;
      }

      // Same slug the seller already owns → fine
      if (slug === sellerProfile?.store_slug) {
        setSlugStatus('available');
        return;
      }

      setSlugStatus('checking');
      slugCheckTimer.current = setTimeout(async () => {
        try {
          const res = await fetch(
            `/api/seller/store/check-slug?slug=${encodeURIComponent(slug)}&userId=${userId}`
          );
          const data = await res.json();
          setSlugStatus(data.available ? 'available' : 'taken');
        } catch {
          setSlugStatus('idle');
        }
      }, 500);
    },
    [sellerProfile?.store_slug, userId]
  );

  // ─── File upload helper ───
  const uploadFile = async (file: File, bucket: string, pathPrefix: string): Promise<string> => {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${userId}/${pathPrefix}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return publicUrl;
  };

  // ─── Banner upload ───
  const handleBannerUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Banner image must be under 5MB');
      return;
    }
    setBannerUploading(true);
    try {
      const url = await uploadFile(file, 'store-banners', 'banner');
      update('banner_url', url);
      toast.success('Banner uploaded!');
    } catch {
      toast.error('Banner upload failed. You can paste a URL instead.');
    } finally {
      setBannerUploading(false);
    }
  };

  // ─── Logo upload (try store-logos first, fall back to store-banners) ───
  const handleLogoUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo image must be under 5MB');
      return;
    }
    setLogoUploading(true);
    try {
      let url: string;
      try {
        url = await uploadFile(file, 'store-logos', 'logo');
      } catch {
        url = await uploadFile(file, 'store-banners', 'logo');
      }
      update('logo_url', url);
      toast.success('Logo uploaded!');
    } catch {
      toast.error('Logo upload failed. You can paste a URL instead.');
    } finally {
      setLogoUploading(false);
    }
  };

  // ─── Save store settings ───
  const saveStoreSettings = async () => {
    if (!localStore.store_name.trim()) {
      toast.error('Store name is required');
      return;
    }
    if (!localStore.store_slug.trim()) {
      toast.error('Store slug is required');
      return;
    }
    if (localStore.store_slug.length < 3) {
      toast.error('Store slug must be at least 3 characters');
      return;
    }
    if (slugStatus === 'taken') {
      toast.error('This store slug is already taken. Choose a different one.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('seller_profiles')
        .update({
          store_name: localStore.store_name,
          store_name_ta: localStore.store_name_ta || null,
          store_slug: localStore.store_slug,
          store_description: localStore.store_description,
          business_type: localStore.business_type,
          banner_url: localStore.banner_url || null,
          store_logo_url: localStore.logo_url || null,
          contact_email: localStore.contact_email || null,
          social_links: localStore.social_links,
        })
        .eq('user_id', userId);

      if (error) {
        // Handle unique constraint violation on slug
        if (error.code === '23505' && error.message?.includes('store_slug')) {
          toast.error('This slug is already taken by another store.');
          setSlugStatus('taken');
          return;
        }
        throw error;
      }
      toast.success('Store updated!');
    } catch (err: any) {
      toast.error('Failed to save: ' + (err?.message || 'Please try again'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
      {/* TITLEBAR */}
      <div className="flex h-11 items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
          <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
          <div className="h-2 w-2 rounded-full bg-[#28C840]" />
        </div>
        <span className="ml-3 font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">Store Settings</span>
      </div>

      {/* CONTENT */}
      <div className="p-6 space-y-5">
        {/* STORE BANNER */}
        <div>
          <label className="block font-[DM_Sans] text-[14px] font-semibold text-[#1D1D1F] mb-2">Store Banner</label>
          <div
            className="relative aspect-[16/5] rounded-2xl overflow-hidden bg-[#F5F5F7] cursor-pointer group"
            onClick={() => !bannerUploading && document.getElementById('banner-upload')?.click()}
          >
            {localStore.banner_url ? (
              <>
                <img src={localStore.banner_url} alt="Banner" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Camera className="w-5 h-5 text-white" />
                  <span className="text-white text-[13px] font-medium">Change Banner</span>
                </div>
              </>
            ) : (
              <div className="w-full h-full border-2 border-dashed border-[rgba(0,0,0,0.12)] rounded-2xl flex flex-col items-center justify-center">
                {bannerUploading ? (
                  <>
                    <Loader2 className="w-7 h-7 text-[#AEAEB2] animate-spin" />
                    <span className="text-[13px] text-[#6E6E73] mt-2">Uploading...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-7 h-7 text-[#AEAEB2]" />
                    <span className="text-[13px] text-[#6E6E73] mt-2">Upload store banner</span>
                    <span className="text-[11px] text-[#AEAEB2]">1280×400px recommended · Max 5MB</span>
                  </>
                )}
              </div>
            )}
            <input
              id="banner-upload"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleBannerUpload(file);
                e.target.value = '';
              }}
            />
          </div>
          <input
            value={localStore.banner_url}
            onChange={e => update('banner_url', e.target.value)}
            placeholder="Or paste banner image URL..."
            className="mt-2 w-full border border-[rgba(0,0,0,0.1)] rounded-xl px-4 py-2 text-[12px] font-[DM_Sans] text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F] bg-[#F5F5F7]"
          />
        </div>

        {/* STORE LOGO */}
        <div>
          <label className="block font-[DM_Sans] text-[14px] font-semibold text-[#1D1D1F] mb-2">Store Logo</label>
          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-2xl overflow-hidden bg-[#F5F5F7] cursor-pointer group relative border border-[rgba(0,0,0,0.08)]"
              onClick={() => !logoUploading && document.getElementById('logo-upload')?.click()}
            >
              {localStore.logo_url ? (
                <>
                  <img src={localStore.logo_url} alt="Logo" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {logoUploading ? (
                    <Loader2 className="w-6 h-6 text-[#AEAEB2] animate-spin" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-[#AEAEB2]" />
                  )}
                </div>
              )}
              <input
                id="logo-upload"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoUpload(file);
                  e.target.value = '';
                }}
              />
            </div>
            <div>
              <p className="text-[12px] text-[#6E6E73]">
                {logoUploading ? 'Uploading...' : 'Square image, 200×200px recommended'}
              </p>
              <p className="text-[11px] text-[#AEAEB2] mt-0.5">Max 5MB · JPG, PNG, WEBP</p>
            </div>
          </div>
        </div>

        {/* STORE NAME */}
        <div>
          <label className="block font-[DM_Sans] text-[14px] font-semibold text-[#1D1D1F] mb-2">
            Store Name <span className="text-[#FF5F57]">*</span>
          </label>
          <input
            value={localStore.store_name}
            onChange={e => update('store_name', e.target.value)}
            placeholder="TechGear India"
            className="w-full border border-[rgba(0,0,0,0.1)] rounded-xl px-4 py-2.5 text-[13px] font-[DM_Sans] text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F] bg-[#F5F5F7]"
          />
        </div>

        {/* STORE NAME TAMIL */}
        <div>
          <label className="block font-[DM_Sans] text-[14px] font-semibold text-[#1D1D1F] mb-2">
            Store Name in Tamil <span className="text-[11px] text-[#AEAEB2] font-normal">(optional)</span>
          </label>
          <input
            value={localStore.store_name_ta}
            onChange={e => update('store_name_ta', e.target.value)}
            placeholder="தமிழில் கடை பெயர்"
            className="w-full border border-[rgba(0,0,0,0.1)] rounded-xl px-4 py-2.5 text-[13px] font-[DM_Sans] text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F] bg-[#F5F5F7]"
          />
        </div>

        {/* STORE SLUG with uniqueness check */}
        <div>
          <label className="block font-[DM_Sans] text-[14px] font-semibold text-[#1D1D1F] mb-2">
            Store Slug <span className="text-[#FF5F57]">*</span>
          </label>
          <div className="relative">
            <input
              value={localStore.store_slug}
              onChange={e => {
                if (!isStoreActive) {
                  const newSlug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                  update('store_slug', newSlug);
                  checkSlugUniqueness(newSlug);
                }
              }}
              readOnly={isStoreActive}
              placeholder="techgear-india"
              className={`w-full border rounded-xl px-4 py-2.5 pr-10 text-[13px] font-[DM_Sans] text-[#1D1D1F] focus:outline-none bg-[#F5F5F7] ${
                isStoreActive
                  ? 'opacity-60 cursor-not-allowed border-[rgba(0,0,0,0.1)]'
                  : slugStatus === 'taken'
                    ? 'border-[#FF5F57] focus:border-[#FF5F57]'
                    : slugStatus === 'available'
                      ? 'border-[#28C840] focus:border-[#28C840]'
                      : 'border-[rgba(0,0,0,0.1)] focus:border-[#1D1D1F]'
              }`}
            />
            {/* Slug status indicator */}
            {!isStoreActive && localStore.store_slug.length >= 3 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {slugStatus === 'checking' && <Loader2 className="w-4 h-4 text-[#AEAEB2] animate-spin" />}
                {slugStatus === 'available' && <Check className="w-4 h-4 text-[#28C840]" />}
                {slugStatus === 'taken' && <X className="w-4 h-4 text-[#FF5F57]" />}
              </div>
            )}
          </div>
          <p className="text-[11px] text-[#AEAEB2] mt-1">
            slate.dev/store/{localStore.store_slug || 'your-slug'}
          </p>
          {slugStatus === 'taken' && (
            <div className="flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3 text-[#FF5F57]" />
              <p className="text-[11px] text-[#FF5F57]">This slug is already taken. Try a different one.</p>
            </div>
          )}
          {slugStatus === 'available' && localStore.store_slug !== sellerProfile?.store_slug && (
            <p className="text-[11px] text-[#28C840] mt-1">This slug is available!</p>
          )}
          {isStoreActive && (
            <p className="text-[11px] text-[#FEBC2E] mt-0.5">Cannot be changed after first approval</p>
          )}
        </div>

        {/* STORE DESCRIPTION */}
        <div>
          <label className="block font-[DM_Sans] text-[14px] font-semibold text-[#1D1D1F] mb-2">
            Store Description <span className="text-[#FF5F57]">*</span>
          </label>
          <textarea
            value={localStore.store_description}
            onChange={e => update('store_description', e.target.value.slice(0, 500))}
            rows={4}
            placeholder="Tell customers about your store and products..."
            maxLength={500}
            className="w-full border border-[rgba(0,0,0,0.1)] rounded-xl px-4 py-2.5 text-[13px] font-[DM_Sans] text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F] bg-[#F5F5F7] resize-none"
          />
          <p className="text-[11px] text-[#AEAEB2] mt-1 text-right">
            {localStore.store_description.length}/500
          </p>
        </div>

        {/* BUSINESS TYPE */}
        <div>
          <label className="block font-[DM_Sans] text-[14px] font-semibold text-[#1D1D1F] mb-2">Business Type</label>
          <div className="flex gap-2">
            {(['individual', 'company'] as const).map(type => (
              <button
                key={type}
                onClick={() => update('business_type', type)}
                className={`px-4 py-2 rounded-full text-[12px] font-[DM_Sans] font-medium transition-all capitalize ${
                  localStore.business_type === type
                    ? 'bg-[#1D1D1F] text-white'
                    : 'bg-[#F5F5F7] text-[#6E6E73] hover:bg-[rgba(0,0,0,0.07)]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* CONTACT EMAIL */}
        <div>
          <label className="block font-[DM_Sans] text-[14px] font-semibold text-[#1D1D1F] mb-2">
            Contact Email <span className="text-[11px] text-[#AEAEB2] font-normal">(optional)</span>
          </label>
          <input
            type="email"
            value={localStore.contact_email}
            onChange={e => update('contact_email', e.target.value)}
            placeholder="store@email.com"
            className="w-full border border-[rgba(0,0,0,0.1)] rounded-xl px-4 py-2.5 text-[13px] font-[DM_Sans] text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F] bg-[#F5F5F7]"
          />
          <p className="text-[11px] text-[#AEAEB2] mt-1">Shown on your store page</p>
        </div>

        {/* SOCIAL LINKS */}
        <div>
          <label className="block font-[DM_Sans] text-[14px] font-semibold text-[#1D1D1F] mb-2">
            Social Links <span className="text-[11px] text-[#AEAEB2] font-normal">(optional)</span>
          </label>
          <div className="space-y-3">
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AEAEB2]" />
              <input
                value={localStore.social_links?.website || ''}
                onChange={e => updateSocial('website', e.target.value)}
                placeholder="https://yourwebsite.com"
                className="w-full border border-[rgba(0,0,0,0.1)] rounded-xl pl-10 pr-4 py-2.5 text-[13px] font-[DM_Sans] text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F] bg-[#F5F5F7]"
              />
            </div>
            <div className="relative">
              <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AEAEB2]" />
              <input
                value={localStore.social_links?.instagram || ''}
                onChange={e => updateSocial('instagram', e.target.value)}
                placeholder="instagram.com/yourstore"
                className="w-full border border-[rgba(0,0,0,0.1)] rounded-xl pl-10 pr-4 py-2.5 text-[13px] font-[DM_Sans] text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F] bg-[#F5F5F7]"
              />
            </div>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AEAEB2]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <input
                value={localStore.social_links?.facebook || ''}
                onChange={e => updateSocial('facebook', e.target.value)}
                placeholder="facebook.com/yourstore"
                className="w-full border border-[rgba(0,0,0,0.1)] rounded-xl pl-10 pr-4 py-2.5 text-[13px] font-[DM_Sans] text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F] bg-[#F5F5F7]"
              />
            </div>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <button
          onClick={saveStoreSettings}
          disabled={saving || slugStatus === 'taken' || slugStatus === 'checking'}
          className="w-full bg-[#1D1D1F] text-white rounded-full py-3 font-[DM_Sans] font-bold text-[14px] hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : 'Save Store Settings'}
        </button>
      </div>
    </div>
  );
}
