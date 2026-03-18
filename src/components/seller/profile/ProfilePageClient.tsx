'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  User, Store, Link2, Shield, AlertTriangle, Star, Copy, ExternalLink,
  Eye, EyeOff, Loader2, Check, X, Globe, Instagram, Facebook,
  Twitter, Linkedin, Youtube, Building2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import SellerAvatarUpload from './SellerAvatarUpload';

// ─── Helpers ────────────────────────────────────────────────────────────────

function TL({ size = 2 }: { size?: number }) {
  const s = `h-${size} w-${size}`;
  return (
    <div className="flex items-center gap-1.5">
      <div className={`${s} rounded-full bg-[#FF5F57]`} />
      <div className={`${s} rounded-full bg-[#FEBC2E]`} />
      <div className={`${s} rounded-full bg-[#28C840]`} />
    </div>
  );
}

function MacCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-[0_2px_12px_rgba(0,0,0,0.08)] overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function MacTitleBar({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="h-[44px] flex items-center gap-3 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
      <TL />
      <span className="flex-1 font-[DM_Sans] font-semibold text-[13px] text-[#1D1D1F]">{title}</span>
      {right}
    </div>
  );
}

function Input({ label, value, onChange, placeholder, readOnly, maxLength, type = 'text', hint }: {
  label: string; value: string; onChange?: (v: string) => void; placeholder?: string;
  readOnly?: boolean; maxLength?: number; type?: string; hint?: string;
}) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-[#AEAEB2] uppercase tracking-wide mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        maxLength={maxLength}
        className={`w-full border border-[rgba(0,0,0,0.1)] rounded-xl px-4 py-2.5 text-[13px] text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F] transition-colors ${readOnly ? 'bg-[#F5F5F7] text-[#AEAEB2] cursor-not-allowed' : 'bg-[#F5F5F7] hover:bg-white'}`}
      />
      {hint && <p className="text-[11px] text-[#AEAEB2] mt-1">{hint}</p>}
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, rows = 4, maxLength, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number; maxLength?: number; hint?: string;
}) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-[#AEAEB2] uppercase tracking-wide mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className="w-full border border-[rgba(0,0,0,0.1)] rounded-xl px-4 py-2.5 text-[13px] text-[#1D1D1F] bg-[#F5F5F7] hover:bg-white focus:outline-none focus:border-[#1D1D1F] transition-colors resize-none"
      />
      {maxLength && (
        <p className="text-[11px] text-[#AEAEB2] mt-1 text-right">{value.length}/{maxLength}</p>
      )}
      {hint && <p className="text-[11px] text-[#AEAEB2] mt-1">{hint}</p>}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="font-[DM_Sans] font-semibold text-[14px] text-[#1D1D1F] mb-4">{children}</p>;
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const strength = checks.filter(Boolean).length;
  const colors = ['bg-[#FF5F57]', 'bg-[#FEBC2E]', 'bg-[#FEBC2E]', 'bg-[#28C840]'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < strength ? colors[strength - 1] : 'bg-[rgba(0,0,0,0.08)]'}`} />
        ))}
      </div>
      <p className="text-[11px] text-[#AEAEB2] mt-1">{labels[strength - 1] || 'Very weak'}</p>
    </div>
  );
}

// ─── TAB 1: Personal Info ────────────────────────────────────────────────────

function PersonalForm({ profile, userId }: { profile: any; userId: string }) {
  const supabase = createClient();
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    display_name: profile?.display_name ?? '',
    phone: profile?.phone ?? '',
    date_of_birth: profile?.date_of_birth ?? '',
    bio: profile?.bio ?? '',
    city: profile?.city ?? '',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update(form).eq('id', userId);
      if (error) throw error;
      toast.success('Personal info saved!');
    } catch (e: any) {
      toast.error('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const set = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <MacCard>
      <MacTitleBar title="Personal Information" />
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Full Name" value={form.full_name} onChange={set('full_name')} placeholder="Your full name" />
          <Input label="Display Name" value={form.display_name} onChange={set('display_name')} placeholder="Shown publicly" />
        </div>
        <Input label="Email" value={profile?.email ?? ''} readOnly hint="Contact support to change your email" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Phone" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" type="tel" />
          <Input label="Date of Birth" value={form.date_of_birth} onChange={set('date_of_birth')} type="date" />
        </div>
        <Textarea label="Bio" value={form.bio} onChange={set('bio')} placeholder="Tell customers about yourself..." rows={4} maxLength={500} />
        <Input label="City" value={form.city} onChange={set('city')} placeholder="Your city" />
        <div className="flex justify-end pt-2">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 bg-[#1D1D1F] text-white font-[DM_Sans] font-semibold text-[13px] rounded-xl px-5 py-2.5 hover:bg-[#333] transition-colors disabled:opacity-40"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving...' : 'Save Personal Info'}
          </button>
        </div>
      </div>
    </MacCard>
  );
}

// ─── TAB 2: Store Info ───────────────────────────────────────────────────────

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function StoreInfoForm({ sellerProfile, profile, userId }: { sellerProfile: any; profile: any; userId: string }) {
  const supabase = createClient();
  const isApproved = sellerProfile?.status === 'active' || sellerProfile?.status === 'approved';

  const [form, setForm] = useState({
    store_name: sellerProfile?.store_name ?? '',
    store_name_ta: sellerProfile?.store_name_ta ?? '',
    store_slug: sellerProfile?.store_slug ?? '',
    store_description: sellerProfile?.store_description ?? '',
    long_description: sellerProfile?.long_description ?? '',
    business_type: sellerProfile?.business_type ?? 'individual',
    gst_number: sellerProfile?.gst_number ?? '',
    support_email: sellerProfile?.support_email ?? '',
    business_phone: sellerProfile?.business_phone ?? '',
    return_policy: sellerProfile?.return_policy ?? '',
    category_ids: (sellerProfile?.category_ids as string[]) ?? [],
  });

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'ok' | 'taken'>('idle');
  const slugTimer = useRef<NodeJS.Timeout>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('product_categories').select('id, name').then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  const set = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleStoreName = (v: string) => {
    setForm(p => ({
      ...p,
      store_name: v,
      store_slug: isApproved ? p.store_slug : slugify(v),
    }));
  };

  const handleSlugChange = (v: string) => {
    if (isApproved) return;
    const clean = v.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/--+/g, '-');
    setForm(p => ({ ...p, store_slug: clean }));
    setSlugStatus('checking');
    clearTimeout(slugTimer.current);
    slugTimer.current = setTimeout(async () => {
      if (!clean || clean === sellerProfile?.store_slug) { setSlugStatus('idle'); return; }
      try {
        const res = await fetch(`/api/seller/store/check-slug?slug=${clean}&userId=${userId}`);
        const json = await res.json();
        setSlugStatus(json.available ? 'ok' : 'taken');
      } catch { setSlugStatus('idle'); }
    }, 500);
  };

  const toggleCategory = (id: string) => {
    setForm(p => ({
      ...p,
      category_ids: p.category_ids.includes(id) ? p.category_ids.filter(c => c !== id) : [...p.category_ids, id],
    }));
  };

  const completion = useCallback(() => {
    let pct = 0;
    if (form.store_name) pct += 15;
    if ((form.store_description || '').length >= 100) pct += 20;
    if (sellerProfile?.avatar_url || profile?.avatar_url) pct += 15;
    if (sellerProfile?.banner_url) pct += 10;
    if (form.category_ids.length > 0) pct += 10;
    // social links handled in social tab
    if ((sellerProfile?.social_links && Object.values(sellerProfile.social_links).some(Boolean))) pct += 10;
    if (sellerProfile?.total_sales > 0 || sellerProfile?.total_revenue > 0) pct += 20;
    else pct += 0;
    return pct;
  }, [form, sellerProfile, profile]);

  const completionPct = completion();
  const missing = [];
  if (!form.store_name) missing.push('Store name');
  if ((form.store_description || '').length < 100) missing.push('Description');
  if (!sellerProfile?.avatar_url && !profile?.avatar_url) missing.push('Logo');
  if (!sellerProfile?.banner_url) missing.push('Banner');
  if (form.category_ids.length === 0) missing.push('Categories');

  const save = async () => {
    if (!form.store_name) { toast.error('Store name is required'); return; }
    if (!form.store_slug) { toast.error('Store slug is required'); return; }
    if (slugStatus === 'taken') { toast.error('Slug is already taken'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('seller_profiles').update({
        store_name: form.store_name,
        store_name_ta: form.store_name_ta || null,
        store_slug: form.store_slug,
        store_description: form.store_description || null,
        long_description: form.long_description || null,
        business_type: form.business_type,
        gst_number: form.gst_number || null,
        support_email: form.support_email || null,
        business_phone: form.business_phone || null,
        return_policy: form.return_policy || null,
        category_ids: form.category_ids,
      }).eq('user_id', userId);
      if (error) throw error;
      toast.success('Store info saved!');
    } catch (e: any) {
      toast.error('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <MacCard>
      <MacTitleBar title="Store Information" />
      <div className="p-6 space-y-5">

        {/* ── Store Identity ── */}
        <SectionLabel>Store Identity</SectionLabel>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-semibold text-[#AEAEB2] uppercase tracking-wide mb-1.5">Store Name *</label>
            <input
              value={form.store_name}
              onChange={e => handleStoreName(e.target.value)}
              placeholder="TechGear India"
              maxLength={80}
              className="w-full border border-[rgba(0,0,0,0.1)] rounded-xl px-4 py-2.5 text-[13px] text-[#1D1D1F] bg-[#F5F5F7] hover:bg-white focus:outline-none focus:border-[#1D1D1F] transition-colors"
            />
          </div>
          <Input
            label="Store Name in Tamil (optional)"
            value={form.store_name_ta}
            onChange={set('store_name_ta')}
            placeholder="தமிழில் கடை பெயர்"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-[12px] font-semibold text-[#AEAEB2] uppercase tracking-wide mb-1.5">Store Slug *</label>
          <div className="relative">
            <input
              value={form.store_slug}
              onChange={e => handleSlugChange(e.target.value)}
              readOnly={isApproved}
              placeholder="techgear-india"
              className={`w-full border rounded-xl px-4 py-2.5 pr-10 text-[13px] font-mono text-[#1D1D1F] focus:outline-none transition-colors ${
                isApproved ? 'bg-[#F5F5F7] text-[#AEAEB2] cursor-not-allowed border-[rgba(0,0,0,0.1)]'
                  : slugStatus === 'taken' ? 'bg-[#FFF0EF] border-[#FF5F57]'
                  : slugStatus === 'ok' ? 'bg-[#EDFAF0] border-[#28C840]'
                  : 'bg-[#F5F5F7] hover:bg-white border-[rgba(0,0,0,0.1)]'
              }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {slugStatus === 'checking' && <Loader2 className="w-4 h-4 text-[#AEAEB2] animate-spin" />}
              {slugStatus === 'ok' && <Check className="w-4 h-4 text-[#28C840]" />}
              {slugStatus === 'taken' && <X className="w-4 h-4 text-[#FF5F57]" />}
            </div>
          </div>
          <p className="font-mono text-[11px] text-[#AEAEB2] mt-1">slate.dev/store/{form.store_slug || '…'}</p>
          {isApproved && (
            <p className="text-[11px] text-[#FEBC2E] mt-1">Slug cannot be changed after approval to preserve your URL</p>
          )}
          {slugStatus === 'taken' && <p className="text-[11px] text-[#FF5F57] mt-1">This slug is already taken</p>}
        </div>

        {/* Business Type */}
        <div>
          <label className="block text-[12px] font-semibold text-[#AEAEB2] uppercase tracking-wide mb-1.5">Business Type</label>
          <div className="flex gap-2">
            {['individual', 'company'].map(t => (
              <button
                key={t}
                onClick={() => setForm(p => ({ ...p, business_type: t }))}
                className={`px-4 py-2 rounded-xl text-[13px] font-[DM_Sans] font-medium transition-colors capitalize ${
                  form.business_type === t ? 'bg-[#1D1D1F] text-white' : 'bg-[#F5F5F7] text-[#6E6E73] hover:bg-gray-200'
                }`}
              >
                {t === 'individual' ? <><User className="inline w-3.5 h-3.5 mr-1.5" />Individual</> : <><Building2 className="inline w-3.5 h-3.5 mr-1.5" />Company</>}
              </button>
            ))}
          </div>
        </div>

        <Input label="GST Number (optional)" value={form.gst_number} onChange={set('gst_number')} placeholder="22AAAAA0000A1Z5" />

        {/* ── Store Description ── */}
        <div className="mt-6">
          <SectionLabel>Store Description</SectionLabel>
        </div>

        <Textarea
          label="Short Description *"
          value={form.store_description}
          onChange={set('store_description')}
          placeholder="Describe what you sell and why customers love your store..."
          rows={4}
          maxLength={500}
        />

        <Textarea
          label="Long Description (optional)"
          value={form.long_description}
          onChange={set('long_description')}
          placeholder="Detailed store description shown on your full store page..."
          rows={6}
          maxLength={2000}
        />

        {/* ── Contact & Support ── */}
        <div className="mt-6">
          <SectionLabel>Contact & Support</SectionLabel>
        </div>

        <Input
          label="Support Email (optional)"
          value={form.support_email}
          onChange={set('support_email')}
          placeholder="support@yourstore.com"
          type="email"
          hint="Customers contact you here"
        />

        <Input
          label="Business Phone (optional)"
          value={form.business_phone}
          onChange={set('business_phone')}
          placeholder="+91 98765 43210"
          type="tel"
        />

        <Textarea
          label="Return Policy (optional)"
          value={form.return_policy}
          onChange={set('return_policy')}
          placeholder="e.g. 7-day return policy on all products..."
          rows={3}
          hint="Shown on product pages"
        />

        {/* ── Product Categories ── */}
        {categories.length > 0 && (
          <div className="mt-6">
            <SectionLabel>Product Categories</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => {
                const sel = form.category_ids.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-[DM_Sans] font-medium transition-colors ${
                      sel ? 'bg-[#1D1D1F] text-white' : 'bg-[#F5F5F7] text-[#6E6E73] hover:bg-gray-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Profile Completion ── */}
        {completionPct < 100 && (
          <div className="mt-6 bg-[#FFFDF5] rounded-xl p-4 border border-[#FEBC2E]/20">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="font-[DM_Sans] font-extrabold text-[24px] text-[#FEBC2E]">{completionPct}%</span>
              <span className="text-[13px] text-[#6E6E73]">store profile complete</span>
            </div>
            <div className="w-full h-1.5 bg-[rgba(0,0,0,0.06)] rounded-full mb-3">
              <div className="h-full bg-[#FEBC2E] rounded-full transition-all" style={{ width: `${completionPct}%` }} />
            </div>
            {missing.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {missing.map(m => (
                  <span key={m} className="bg-white border border-[#FEBC2E]/30 rounded-full px-2.5 py-0.5 text-[11px] text-[#6E6E73]">
                    Missing: {m}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={save}
            disabled={saving || slugStatus === 'taken'}
            className="w-full flex items-center justify-center gap-2 bg-[#1D1D1F] text-white font-[DM_Sans] font-semibold text-[13px] rounded-xl px-5 py-2.5 hover:bg-[#333] transition-colors disabled:opacity-40"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving...' : 'Save Store Info'}
          </button>
        </div>
      </div>
    </MacCard>
  );
}

// ─── TAB 3: Social Links ─────────────────────────────────────────────────────

const SOCIAL_FIELDS = [
  { key: 'website', label: 'Website', icon: Globe, placeholder: 'https://yourstore.com' },
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/yourstore' },
  { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/yourstore' },
  { key: 'twitter', label: 'Twitter / X', icon: Twitter, placeholder: 'https://twitter.com/yourstore' },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/company/yourstore' },
  { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@yourstore' },
];

function SellerSocialLinksForm({ sellerProfile, userId }: { sellerProfile: any; userId: string }) {
  const supabase = createClient();
  const existing = sellerProfile?.social_links ?? {};

  const [links, setLinks] = useState<Record<string, string>>(
    Object.fromEntries(SOCIAL_FIELDS.map(f => [f.key, existing[f.key] ?? '']))
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const invalid = Object.entries(links).filter(([, v]) => v && !v.startsWith('https://'));
    if (invalid.length) { toast.error('All URLs must start with https://'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('seller_profiles').update({
        social_links: links,
      }).eq('user_id', userId);
      if (error) throw error;
      toast.success('Social links saved!');
    } catch (e: any) {
      toast.error('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <MacCard>
      <MacTitleBar title="Social Links" />
      <div className="p-6 space-y-4">
        {SOCIAL_FIELDS.map(({ key, label, icon: Icon, placeholder }) => (
          <div key={key}>
            <label className="block text-[12px] font-semibold text-[#AEAEB2] uppercase tracking-wide mb-1.5">{label}</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#AEAEB2]">
                <Icon className="w-4 h-4" />
              </div>
              <input
                type="url"
                value={links[key]}
                onChange={e => setLinks(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-[#1D1D1F] bg-[#F5F5F7] hover:bg-white focus:outline-none focus:border-[#1D1D1F] transition-colors ${
                  links[key] && !links[key].startsWith('https://') ? 'border-[#FF5F57]' : 'border-[rgba(0,0,0,0.1)]'
                }`}
              />
            </div>
            {links[key] && !links[key].startsWith('https://') && (
              <p className="text-[11px] text-[#FF5F57] mt-1">Must start with https://</p>
            )}
          </div>
        ))}
        <div className="flex justify-end pt-2">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 bg-[#1D1D1F] text-white font-[DM_Sans] font-semibold text-[13px] rounded-xl px-5 py-2.5 hover:bg-[#333] transition-colors disabled:opacity-40"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving...' : 'Save Social Links'}
          </button>
        </div>
      </div>
    </MacCard>
  );
}

// ─── TAB 4: Account Settings ─────────────────────────────────────────────────

const SELLER_NOTIF_PREFS = [
  { key: 'order_notifications', label: 'New Order', desc: 'When a customer places an order', default: true },
  { key: 'stock_notifications', label: 'Low Stock Alert', desc: 'When product stock is running low', default: true },
  { key: 'return_notifications', label: 'Return Request', desc: 'When a customer requests a return', default: true },
  { key: 'payout_notifications', label: 'Payout Processed', desc: 'When your payout is sent', default: true },
  { key: 'review_notifications', label: 'Store Review', desc: 'When a customer leaves a review', default: true },
  { key: 'marketing_emails', label: 'Marketing & Updates', desc: 'Platform news and seller tips', default: false },
];

function SellerAccountSettingsForm({ userId }: { userId: string }) {
  const supabase = createClient();

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const [notifs, setNotifs] = useState<Record<string, boolean>>(
    Object.fromEntries(SELLER_NOTIF_PREFS.map(p => [p.key, p.default]))
  );
  const [notifsLoading, setNotifsLoading] = useState(false);

  const changePassword = async () => {
    if (!newPw || newPw !== confirmPw) { toast.error('Passwords do not match'); return; }
    if (newPw.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setPwLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      toast.success('Password updated successfully!');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (e: any) {
      toast.error('Failed: ' + e.message);
    } finally {
      setPwLoading(false);
    }
  };

  const saveNotifs = async () => {
    setNotifsLoading(true);
    try {
      // FIX #3: Actually save notification preferences to database
      const { error } = await supabase
        .from('seller_profiles')
        .update({
          notification_preferences: notifs,
        })
        .eq('user_id', userId);

      if (error) throw error;
      toast.success('Notification preferences saved!');
    } catch (e: any) {
      toast.error('Save failed: ' + e.message);
    } finally {
      setNotifsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <MacCard>
        <MacTitleBar title="Change Password" />
        <div className="p-6 space-y-4">
          {[
            { label: 'Current Password', val: currentPw, set: setCurrentPw, show: showCurrent, toggle: () => setShowCurrent(v => !v) },
            { label: 'New Password', val: newPw, set: setNewPw, show: showNew, toggle: () => setShowNew(v => !v), strength: true },
            { label: 'Confirm New Password', val: confirmPw, set: setConfirmPw, show: showNew, toggle: () => {}, noEye: true },
          ].map(({ label, val, set, show, toggle, strength, noEye }) => (
            <div key={label}>
              <label className="block text-[12px] font-semibold text-[#AEAEB2] uppercase tracking-wide mb-1.5">{label}</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={val}
                  onChange={e => set(e.target.value)}
                  className="w-full border border-[rgba(0,0,0,0.1)] rounded-xl px-4 py-2.5 pr-10 text-[13px] text-[#1D1D1F] bg-[#F5F5F7] focus:outline-none focus:border-[#1D1D1F]"
                />
                {!noEye && (
                  <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AEAEB2] hover:text-[#6E6E73]">
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
              {strength && <PasswordStrength password={val} />}
              {label === 'Confirm New Password' && confirmPw && newPw !== confirmPw && (
                <p className="text-[11px] text-[#FF5F57] mt-1">Passwords do not match</p>
              )}
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <button
              onClick={changePassword}
              disabled={pwLoading || !currentPw || !newPw || newPw !== confirmPw}
              className="flex items-center gap-2 bg-[#1D1D1F] text-white font-[DM_Sans] font-semibold text-[13px] rounded-xl px-5 py-2.5 hover:bg-[#333] transition-colors disabled:opacity-40"
            >
              {pwLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {pwLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>
      </MacCard>

      {/* Notification Preferences */}
      <MacCard>
        <MacTitleBar title="Notification Preferences" />
        <div className="divide-y divide-[rgba(0,0,0,0.05)]">
          {SELLER_NOTIF_PREFS.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between px-5 py-4">
              <div>
                <div className="font-[DM_Sans] font-medium text-[13px] text-[#1D1D1F]">{label}</div>
                <div className="text-[12px] text-[#6E6E73] mt-0.5">{desc}</div>
              </div>
              <button
                onClick={() => setNotifs(p => ({ ...p, [key]: !p[key] }))}
                className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${notifs[key] ? 'bg-[#28C840]' : 'bg-[rgba(0,0,0,0.15)]'}`}
              >
                <div className={`absolute top-1 transition-all w-4 h-4 rounded-full bg-white shadow-sm ${notifs[key] ? 'left-5' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-[rgba(0,0,0,0.05)]">
          <button
            onClick={saveNotifs}
            disabled={notifsLoading}
            className="flex items-center gap-2 bg-[#1D1D1F] text-white font-[DM_Sans] font-semibold text-[13px] rounded-xl px-5 py-2.5 hover:bg-[#333] transition-colors"
          >
            {notifsLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {notifsLoading ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </MacCard>

      {/* Login Sessions */}
      <MacCard>
        <MacTitleBar title="Login Sessions" />
        <div className="p-6 flex items-center justify-between">
          <div>
            <div className="font-[DM_Sans] font-medium text-[13px] text-[#1D1D1F] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#28C840]" />
              Current session
            </div>
            <div className="text-[12px] text-[#6E6E73] mt-0.5">You are signed in on this device</div>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut({ scope: 'others' });
              toast.success('Signed out all other sessions');
            }}
            className="text-[12px] text-[#FF5F57] font-medium border border-[#FF5F57]/30 rounded-full px-4 py-1.5 hover:bg-[#FFF0EF] transition-colors"
          >
            Sign out other sessions
          </button>
        </div>
      </MacCard>
    </div>
  );
}

// ─── TAB 5: Danger Zone ──────────────────────────────────────────────────────

function SellerDangerZonePanel({ userId }: { userId: string }) {
  const supabase = createClient();
  const [confirm, setConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const deleteAccount = async () => {
    if (confirm !== 'DELETE') return;
    setDeleting(true);
    try {
      // FIX #2: Actually delete account via API endpoint
      const response = await fetch('/api/seller/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete account');
      }

      // Sign out after successful deletion
      await supabase.auth.signOut();
      toast.success('Account deleted successfully. You have been signed out.');
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <MacCard>
      <MacTitleBar title="Danger Zone" />
      <div className="p-6 space-y-5">
        <div className="bg-[#FFF8EC] rounded-xl p-4 border border-[#FEBC2E]/20">
          <p className="font-[DM_Sans] font-semibold text-[13px] text-[#1D1D1F] mb-2">Deleting your account will also:</p>
          <ul className="space-y-1 text-[13px] text-[#6E6E73]">
            <li>• Unpublish all your products</li>
            <li>• Cancel all pending orders</li>
            <li>• Forfeit any pending earnings</li>
            <li>• Remove your store page</li>
          </ul>
        </div>

        <div className="bg-[#FFF0EF] rounded-xl p-4 border border-[#FF5F57]/20">
          <p className="font-[DM_Sans] font-semibold text-[13px] text-[#FF5F57] mb-1">Delete Account</p>
          <p className="text-[12px] text-[#6E6E73] mb-4">
            This action is permanent and cannot be undone. Type <strong>DELETE</strong> to confirm.
          </p>
          <input
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="w-full border border-[#FF5F57]/30 rounded-xl px-4 py-2.5 text-[13px] text-[#1D1D1F] bg-white focus:outline-none focus:border-[#FF5F57] mb-3"
          />
          <button
            onClick={deleteAccount}
            disabled={confirm !== 'DELETE' || deleting}
            className="flex items-center gap-2 bg-[#FF5F57] text-white font-[DM_Sans] font-semibold text-[13px] rounded-xl px-5 py-2.5 hover:bg-[#e54e46] transition-colors disabled:opacity-40"
          >
            {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
            {deleting ? 'Deleting...' : 'Delete My Account'}
          </button>
        </div>
      </div>
    </MacCard>
  );
}

// ─── STAR RATING ─────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? 'fill-[#FEBC2E] text-[#FEBC2E]' : 'text-[#AEAEB2]'}`}
        />
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

type Tab = 'personal' | 'store' | 'social' | 'account' | 'danger';

interface Props {
  profile: any;
  sellerProfile: any;
  stats: { totalProducts: number; totalSales: number; avgRating: number; totalRevenue: number };
  userEmail: string;
  userId: string;
}

export default function ProfilePageClient({ profile, sellerProfile, stats, userEmail, userId }: Props) {
  const [tab, setTab] = useState<Tab>('personal');
  const [copied, setCopied] = useState(false);

  const storeName = sellerProfile?.store_name ?? profile?.display_name ?? profile?.full_name ?? 'My Store';
  const storeSlug = sellerProfile?.store_slug ?? '';
  const storeUrl = `slate.dev/store/${storeSlug}`;
  const logoUrl = sellerProfile?.avatar_url ?? profile?.avatar_url;

  const copyLink = () => {
    navigator.clipboard.writeText(`https://${storeUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const navItems: { id: Tab; label: string; icon: React.ComponentType<any> }[] = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'store', label: 'Store Info', icon: Store },
    { id: 'social', label: 'Social Links', icon: Link2 },
    { id: 'account', label: 'Account Settings', icon: Shield },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F7] p-4 md:p-6 font-[DM_Sans] flex flex-col">
      <div className="max-w-6xl mx-auto w-full flex flex-col lg:flex-row gap-6 flex-1">

        {/* ── Left Column (Fixed) ── */}
        <div className="w-full lg:w-[280px] flex-shrink-0 space-y-4 lg:sticky lg:top-6 lg:h-fit">


            {/* Summary Card */}
            <MacCard>
              <div className="h-[44px] border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5 flex items-center">
                <TL />
              </div>
              <div className="p-5">
                {/* Store Logo with Upload */}
                <SellerAvatarUpload
                  userId={userId}
                  currentUrl={logoUrl}
                  storeName={storeName}
                  onUploadComplete={(url) => {
                    // Logo updated - will be reflected in next render
                  }}
                />


                {/* Store Name */}
                <p className="font-[DM_Sans] font-bold text-[20px] text-[#1D1D1F] text-center mt-4 leading-tight">{storeName}</p>
                {storeSlug && (
                  <p className="font-mono text-[11px] text-[#AEAEB2] text-center mt-1">{storeUrl}</p>
                )}

                {/* Role Badge */}
                <div className="flex justify-center mt-3">
                  <span className="bg-[#F5F5F7] text-[#6E6E73] font-[DM_Sans] font-semibold text-[11px] px-3 py-1 rounded-full uppercase tracking-widest border border-[rgba(0,0,0,0.08)]">
                    SELLER
                  </span>
                </div>

                {/* Rating */}
                {stats.avgRating > 0 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <StarRating rating={stats.avgRating} />
                    <span className="font-[DM_Sans] font-semibold text-[13px] text-[#1D1D1F]">{stats.avgRating.toFixed(1)}</span>
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {[
                    { value: stats.totalProducts.toString(), label: 'Products' },
                    { value: stats.totalSales.toString(), label: 'Sales' },
                    { value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, label: 'Revenue' },
                    { value: `${stats.avgRating.toFixed(1)}★`, label: 'Rating', yellow: true },
                  ].map(({ value, label, yellow }) => (
                    <div key={label} className="bg-[#F5F5F7] rounded-xl p-3 text-center">
                      <p className={`font-[DM_Sans] font-bold text-[15px] ${yellow ? 'text-[#FEBC2E]' : 'text-[#1D1D1F]'}`}>{value}</p>
                      <p className="text-[11px] text-[#AEAEB2] mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Store Link Row */}
                {storeSlug && (
                  <div className="flex gap-2 mt-4">
                    <a
                      href={`https://${storeUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 border border-[rgba(0,0,0,0.1)] rounded-xl py-2 text-[12px] font-[DM_Sans] font-medium text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View Store
                    </a>
                    <button
                      onClick={copyLink}
                      className="flex-1 flex items-center justify-center gap-1.5 border border-[rgba(0,0,0,0.1)] rounded-xl py-2 text-[12px] font-[DM_Sans] font-medium text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-[#28C840]" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                )}
              </div>
            </MacCard>

            {/* Nav Tabs */}
            <MacCard>
              <div className="h-[44px] border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5 flex items-center">
                <TL />
              </div>
              <div className="p-2">
                {navItems.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-[DM_Sans] font-medium transition-colors text-left ${
                      tab === id ? 'bg-[#1D1D1F] text-white' : 'text-[#6E6E73] hover:bg-[#F5F5F7]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${id === 'danger' && tab !== 'danger' ? 'text-[#FF5F57]' : ''}`} />
                    <span className={id === 'danger' && tab !== 'danger' ? 'text-[#FF5F57]' : ''}>{label}</span>
                  </button>
                ))}
              </div>
            </MacCard>
          </div>

          {/* ── Right Column (Scrollable) ── */}
          <div className="flex-1 min-w-0 overflow-y-auto pr-2">
            {tab === 'personal' && <PersonalForm profile={profile} userId={userId} />}
            {tab === 'store' && <StoreInfoForm sellerProfile={sellerProfile} profile={profile} userId={userId} />}
            {tab === 'social' && <SellerSocialLinksForm sellerProfile={sellerProfile} userId={userId} />}
            {tab === 'account' && <SellerAccountSettingsForm userId={userId} />}
            {tab === 'danger' && <SellerDangerZonePanel userId={userId} />}
          </div>
        </div>
      </div>
    </div>
  );
}
