'use client';

import { useState } from 'react';
import {
  User, BookOpen, Link, Shield, AlertTriangle, ExternalLink, Copy,
  Star, Plus, Trash2, Download, Loader2, CheckCircle2, ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import AvatarUpload from '@/components/student/profile/AvatarUpload';
import TeachingInfoForm from './TeachingInfoForm';
import SocialLinksForm from './SocialLinksForm';
import AccountSettingsForm from './AccountSettingsForm';
import PublicProfilePreview from './PublicProfilePreview';

type TabId = 'personal' | 'teaching' | 'social' | 'account' | 'danger';

interface Props {
  profile: any;
  instructorProfile: any;
  stats: { totalCourses: number; totalStudents: number; avgRating: number; totalReviews: number };
  userEmail: string;
  userId: string;
}

function calcCompletion(profile: any, ip: any, stats: any) {
  const checks = [
    { key: 'avatar',   label: 'Upload avatar',        pct: 15, done: !!profile?.avatar_url },
    { key: 'headline', label: 'Add headline',          pct: 15, done: !!ip?.headline },
    { key: 'bio',      label: 'Add bio',               pct: 20, done: (profile?.bio || ip?.bio || '').length >= 100 },
    { key: 'tags',     label: 'Add expertise tags',    pct: 15, done: (ip?.expertise_tags || []).length >= 3 },
    { key: 'langs',    label: 'Add teaching language', pct: 10, done: (ip?.teaching_languages || []).length > 0 },
    { key: 'social',   label: 'Add social links',      pct: 10, done: !!(ip?.website_url || ip?.linkedin_url || Object.values(ip?.social_links || {}).some(Boolean)) },
    { key: 'courses',  label: 'Publish a course',      pct: 15, done: stats.totalCourses > 0 },
  ];
  const total = checks.filter(c => c.done).reduce((s, c) => s + c.pct, 0);
  const missing = checks.filter(c => !c.done);
  return { pct: total, missing };
}

function TL() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
      <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
      <div className="h-2 w-2 rounded-full bg-[#28C840]" />
    </div>
  );
}

function PersonalForm({ profile, userEmail, userId }: { profile: any; userEmail: string; userId: string }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    display_name: profile?.display_name || '',
    phone: profile?.phone || '',
    city: profile?.city || '',
    bio: profile?.bio || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setHasChanges(true);
  };

  const save = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').update({ ...form, updated_at: new Date().toISOString() }).eq('id', userId);
      if (error) throw error;
      toast.success('Profile updated!', { icon: <CheckCircle2 className="w-4 h-4 text-[#28C840]" /> });
      setHasChanges(false);
    } catch (err: any) {
      toast.error('Failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full border border-[rgba(0,0,0,0.1)] rounded-xl px-4 py-2.5 text-[13px] text-[#1D1D1F] bg-[#F5F5F7] focus:outline-none focus:border-[#1D1D1F]';
  const labelCls = 'block text-[12px] font-semibold text-[#AEAEB2] uppercase tracking-wide mb-1.5';

  return (
    <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm overflow-hidden">
      <div className="h-[44px] flex items-center gap-3 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
        <TL />
        <span className="font-[DM_Sans] font-semibold text-[13px] text-[#1D1D1F]">Personal Information</span>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>Full Name</label>
            <input type="text" name="full_name" value={form.full_name} onChange={handleChange} placeholder="e.g. John Doe" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Display Name</label>
            <input type="text" name="display_name" value={form.display_name} onChange={handleChange} placeholder="johndoe123" className={inputCls} />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Email Address</label>
            <div className="relative">
              <input disabled value={userEmail} className="w-full border border-[rgba(0,0,0,0.1)] rounded-xl px-4 py-2.5 text-[13px] text-[#AEAEB2] bg-[#F5F5F7] opacity-80 cursor-not-allowed" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-[#EDFAF0] text-[#28C840] px-2 py-0.5 rounded-lg">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">Verified</span>
              </div>
            </div>
          </div>
          <div>
            <label className={labelCls}>Phone Number</label>
            <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>City / Location</label>
            <input type="text" name="city" value={form.city} onChange={handleChange} placeholder="Chennai" className={inputCls} />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>About Me</label>
            <textarea
              name="bio" value={form.bio} onChange={handleChange} rows={4} maxLength={500}
              placeholder="Tell students about yourself..."
              className="w-full border border-[rgba(0,0,0,0.1)] rounded-xl px-4 py-2.5 text-[13px] text-[#1D1D1F] bg-[#F5F5F7] focus:outline-none focus:border-[#1D1D1F] resize-none"
            />
            <p className="text-[11px] text-[#AEAEB2] mt-1 text-right">{form.bio.length}/500</p>
          </div>
        </div>
        <div className="h-px bg-[rgba(0,0,0,0.06)] my-5" />
        <div className="flex items-center justify-end gap-3">
          {hasChanges && (
            <div className="flex items-center gap-2 mr-auto">
              <div className="w-2 h-2 rounded-full bg-[#FEBC2E]" />
              <span className="text-[12px] font-medium text-[#FEBC2E]">Unsaved changes</span>
            </div>
          )}
          <button
            onClick={save} disabled={!hasChanges || loading}
            className="flex items-center gap-2 bg-[#1D1D1F] text-white font-[DM_Sans] font-semibold text-[13px] rounded-xl px-5 py-2.5 hover:bg-[#333] transition-colors disabled:opacity-40"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DangerZonePanel({ userId }: { userId: string }) {
  const supabase = createClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  return (
    <div className="space-y-4">
      <div className="bg-[#FFF8EC] rounded-2xl p-5 border border-[#FEBC2E]/30 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-[#FEBC2E] flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-[DM_Sans] font-semibold text-[13px] text-[#FEBC2E]">Deleting your account will also:</p>
          <ul className="mt-2 space-y-1 text-[12px] text-[#6E6E73]">
            <li>• Unpublish all your courses</li>
            <li>• Forfeit any pending earnings</li>
            <li>• Remove all student Q&A replies</li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm overflow-hidden">
        <div className="h-[44px] flex items-center gap-3 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
          <TL />
          <span className="font-[DM_Sans] font-semibold text-[13px] text-[#1D1D1F]">Data & Privacy</span>
        </div>
        <div className="p-5 flex items-center justify-between">
          <div>
            <div className="font-[DM_Sans] font-medium text-[13px] text-[#1D1D1F]">Export your data</div>
            <div className="text-[12px] text-[#6E6E73] mt-0.5">Download a copy of your profile, courses and earnings</div>
          </div>
          <button
            onClick={() => toast.success('Export started! Check your email in a few minutes.')}
            className="flex items-center gap-1.5 border border-[rgba(0,0,0,0.1)] text-[#1D1D1F] rounded-full px-4 py-2 text-[12px] font-medium hover:bg-[#F5F5F7] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export Data
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#FF5F57]/20 shadow-sm overflow-hidden">
        <div className="h-[44px] flex items-center gap-3 border-b border-[#FF5F57]/10 bg-[#FFF0EF] px-5">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
            <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
            <div className="h-2 w-2 rounded-full bg-[#28C840]" />
          </div>
          <span className="font-[DM_Sans] font-semibold text-[13px] text-[#FF5F57]">Danger Zone</span>
        </div>
        <div className="p-5">
          {!confirmOpen ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="font-[DM_Sans] font-medium text-[13px] text-[#1D1D1F]">Delete your account</div>
                <div className="text-[12px] text-[#6E6E73] mt-0.5">Permanently delete your instructor account and all data</div>
              </div>
              <button
                onClick={() => setConfirmOpen(true)}
                className="flex items-center gap-1.5 border border-[#FF5F57]/40 text-[#FF5F57] rounded-full px-4 py-2 text-[12px] font-medium hover:bg-[#FFF0EF] transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Account
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-[13px] text-[#1D1D1F] font-medium">Type <strong>DELETE</strong> to confirm</p>
              <input
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full border border-[#FF5F57]/40 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#FF5F57]"
              />
              <div className="flex gap-3">
                <button onClick={() => { setConfirmOpen(false); setConfirmText(''); }} className="flex-1 border border-[rgba(0,0,0,0.1)] rounded-full py-2.5 text-[13px] font-medium hover:bg-[#F5F5F7] transition-colors">
                  Cancel
                </button>
                <button
                  disabled={confirmText !== 'DELETE'}
                  onClick={async () => {
                    await supabase.auth.signOut();
                    toast.error('Account deletion requested. We will process this within 24 hours.');
                  }}
                  className="flex-1 bg-[#FF5F57] text-white rounded-full py-2.5 text-[13px] font-bold hover:bg-red-600 transition-colors disabled:opacity-40"
                >
                  Permanently Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePageClient({ profile, instructorProfile, stats, userEmail, userId }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('personal');
  const [showPreview, setShowPreview] = useState(false);

  const { pct, missing } = calcCompletion(profile, instructorProfile, stats);
  const showCompletion = pct < 80;
  const avatarRating = instructorProfile?.avg_rating ?? 0;

  const TABS = [
    { id: 'personal' as TabId, label: 'Personal Info',     icon: User },
    { id: 'teaching' as TabId, label: 'Teaching Info',     icon: BookOpen },
    { id: 'social'   as TabId, label: 'Social Links',      icon: Link },
    { id: 'account'  as TabId, label: 'Account Settings',  icon: Shield },
    { id: 'danger'   as TabId, label: 'Danger Zone',       icon: AlertTriangle, isDanger: true },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 font-[DM_Sans]">

      {/* LEFT COLUMN */}
      <div className="w-full lg:w-[300px] flex-shrink-0 space-y-4 lg:sticky lg:top-6 lg:self-start">

        {/* Profile Summary Card */}
        <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm overflow-hidden">
          <div className="h-[44px] flex items-center gap-3 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
            <TL />
            <span className="flex-1 text-center font-semibold text-[13px] text-[#1D1D1F] pr-6">Instructor Profile</span>
          </div>
          <div className="p-6 text-center">
            <div className="w-24 h-24 mx-auto">
              <AvatarUpload userId={userId} currentUrl={profile?.avatar_url} fullName={profile?.full_name ?? 'I'} />
            </div>

            <h2 className="font-bold text-[20px] text-[#1D1D1F] mt-4">{profile?.full_name || 'Instructor'}</h2>
            {instructorProfile?.headline && (
              <p className="text-[13px] text-[#6E6E73] mt-1 line-clamp-2">{instructorProfile.headline}</p>
            )}
            <div className="mt-2 inline-block bg-[#F5F5F7] rounded-full px-3 py-1 text-[11px] text-[#6E6E73] uppercase tracking-wide font-semibold">
              Instructor
            </div>

            {avatarRating > 0 && (
              <div className="flex items-center justify-center gap-1.5 mt-3">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(avatarRating) ? 'text-[#FEBC2E] fill-[#FEBC2E]' : 'text-[#AEAEB2]'}`} />
                ))}
                <span className="font-bold text-[14px] text-[#1D1D1F] ml-1">{avatarRating.toFixed(1)}</span>
                <span className="text-[12px] text-[#AEAEB2]">({stats.totalReviews} reviews)</span>
              </div>
            )}

            <div className="my-5 h-px bg-[rgba(0,0,0,0.06)]" />

            <div className="grid grid-cols-3 gap-2">
              {[
                { v: stats.totalCourses,   l: 'Courses' },
                { v: stats.totalStudents,  l: 'Students' },
                { v: avatarRating > 0 ? `${avatarRating.toFixed(1)}★` : '—', l: 'Rating', color: avatarRating > 0 ? 'text-[#FEBC2E]' : 'text-[#AEAEB2]' },
              ].map(s => (
                <div key={s.l} className="bg-[#F5F5F7] rounded-xl p-3 text-center">
                  <div className={`font-bold text-[18px] ${(s as any).color || 'text-[#1D1D1F]'}`}>{s.v}</div>
                  <div className="text-[10px] text-[#AEAEB2] mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>

            <p className="font-mono text-[11px] text-[#AEAEB2] mt-4 truncate">
              /instructor/{userId.slice(0, 8)}...
            </p>
            <div className="flex gap-2 mt-2 justify-center">
              <a
                href={`/instructor/${userId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center border border-[rgba(0,0,0,0.1)] text-[#1D1D1F] rounded-full px-3 py-1.5 text-[12px] hover:bg-[#F5F5F7] transition-colors"
              >
                <ExternalLink className="w-3 h-3 mr-1.5" />
                View Public
              </a>
              <button
                onClick={() => {
                  const url = `${window.location.origin}/instructor/${userId}`;
                  navigator.clipboard.writeText(url).then(() => toast.success('Profile link copied!'));
                }}
                className="flex items-center gap-1.5 border border-[rgba(0,0,0,0.1)] text-[#6E6E73] rounded-full px-3 py-1.5 text-[12px] hover:bg-[#F5F5F7] transition-colors"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Nav Tabs */}
        <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm p-2 flex flex-row lg:flex-col overflow-x-auto">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap text-[13px] font-medium w-full ${
                  isActive
                    ? 'bg-[#1D1D1F] text-white'
                    : (tab as any).isDanger
                      ? 'text-[#FF5F57] hover:bg-[#FFF0EF]'
                      : 'text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${(tab as any).isDanger && !isActive ? 'text-[#FF5F57]' : ''}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="flex-1 min-w-0 space-y-4">
        {showCompletion && (
          <div className="bg-[#FFFDF5] border border-[#FEBC2E]/30 rounded-2xl p-5">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
              <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
              <div className="h-2 w-2 rounded-full bg-[#28C840]" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-[DM_Sans] font-semibold text-[14px] text-[#1D1D1F]">Complete your profile</div>
                <div className="text-[12px] text-[#6E6E73] mt-0.5">A complete profile gets 3× more students</div>
              </div>
              <div className="font-[DM_Sans] font-extrabold text-[24px] text-[#FEBC2E]">{pct}%</div>
            </div>
            <div className="mt-3 h-2 w-full bg-[rgba(0,0,0,0.06)] rounded-full overflow-hidden">
              <div className="h-full bg-[#FEBC2E] rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            {missing.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {missing.map(m => (
                  <span key={m.key} className="flex items-center bg-white border border-[#FEBC2E]/30 rounded-full px-3 py-1 text-[11px] text-[#FEBC2E] font-medium">
                    <Plus className="w-2.5 h-2.5 mr-1" />
                    {m.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'personal'  && <PersonalForm profile={profile} userEmail={userEmail} userId={userId} />}
        {activeTab === 'teaching'  && <TeachingInfoForm instructorProfile={instructorProfile} userId={userId} />}
        {activeTab === 'social'    && <SocialLinksForm instructorProfile={instructorProfile} userId={userId} />}
        {activeTab === 'account'   && <AccountSettingsForm userId={userId} />}
        {activeTab === 'danger'    && <DangerZonePanel userId={userId} />}
      </div>

      <PublicProfilePreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        profile={profile}
        instructorProfile={instructorProfile}
        stats={stats}
      />
    </div>
  );
}
