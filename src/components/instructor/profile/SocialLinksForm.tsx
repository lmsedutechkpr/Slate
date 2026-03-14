'use client';

import { useState } from 'react';
import { Globe, Linkedin, Youtube, Github, Instagram, Twitter, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Props {
  instructorProfile: any;
  userId: string;
}

const FIELDS = [
  { key: 'website',   icon: Globe,      label: 'Website',    ph: 'https://yoursite.com' },
  { key: 'linkedin',  icon: Linkedin,   label: 'LinkedIn',   ph: 'https://linkedin.com/in/...' },
  { key: 'youtube',   icon: Youtube,    label: 'YouTube',    ph: 'https://youtube.com/@...' },
  { key: 'twitter',   icon: Twitter,    label: 'Twitter / X',ph: 'https://twitter.com/...' },
  { key: 'github',    icon: Github,     label: 'GitHub',     ph: 'https://github.com/...' },
  { key: 'instagram', icon: Instagram,  label: 'Instagram',  ph: 'https://instagram.com/...' },
];

function TL() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
      <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
      <div className="h-2 w-2 rounded-full bg-[#28C840]" />
    </div>
  );
}

export default function SocialLinksForm({ instructorProfile: ip, userId }: Props) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const sl = ip?.social_links || {};
  const [links, setLinks] = useState<Record<string, string>>({
    website:   sl.website   || ip?.website_url   || '',
    linkedin:  sl.linkedin  || ip?.linkedin_url  || '',
    youtube:   sl.youtube   || '',
    twitter:   sl.twitter   || ip?.twitter_url   || '',
    github:    sl.github    || '',
    instagram: sl.instagram || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (key: string, val: string) => {
    setLinks(prev => ({ ...prev, [key]: val }));
    setHasChanges(true);
    if (val && !val.startsWith('https://')) {
      setErrors(prev => ({ ...prev, [key]: 'Must be a valid URL starting with https://' }));
    } else {
      setErrors(prev => { const e = { ...prev }; delete e[key]; return e; });
    }
  };

  const save = async () => {
    if (Object.keys(errors).length > 0) {
      toast.error('Fix URL errors before saving');
      return;
    }
    setLoading(true);
    try {
      const payload: any = { social_links: links };
      // Also keep existing dedicated columns in sync
      if (links.website) payload.website_url = links.website;
      if (links.linkedin) payload.linkedin_url = links.linkedin;

      const { error } = await supabase
        .from('instructor_profiles')
        .update(payload)
        .eq('user_id', userId);

      if (error) {
        // social_links column might not exist yet — try without it
        if (error.message.includes('social_links')) {
          const { error: e2 } = await supabase.from('instructor_profiles').update({
            website_url: links.website,
            linkedin_url: links.linkedin,
            portfolio_url: links.youtube || links.github,
          }).eq('user_id', userId);
          if (e2) throw e2;
        } else {
          throw error;
        }
      }

      toast.success('Links saved!', { style: { color: '#28C840' } });
      setHasChanges(false);
    } catch (err: any) {
      toast.error('Failed to save: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm overflow-hidden">
      <div className="h-[44px] flex items-center gap-3 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
        <TL />
        <span className="font-[DM_Sans] font-semibold text-[13px] text-[#1D1D1F]">Social Links</span>
      </div>

      <div className="p-6">
        <p className="text-[13px] text-[#6E6E73] mb-6">
          Add your social profiles so students can follow your work outside Slate.
        </p>

        <div className="space-y-5">
          {FIELDS.map(({ key, icon: Icon, label, ph }) => (
            <div key={key}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-[#F5F5F7] flex items-center justify-center">
                  <Icon className="w-4 h-4 text-[#6E6E73]" />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold text-[#AEAEB2] uppercase tracking-wide mb-1">
                    {label}
                  </label>
                  <input
                    value={links[key]}
                    onChange={e => update(key, e.target.value)}
                    placeholder={ph}
                    className={`w-full border rounded-xl px-4 py-2.5 text-[13px] text-[#1D1D1F] bg-[#F5F5F7] focus:outline-none focus:border-[#1D1D1F] transition-colors ${
                      errors[key] ? 'border-[#FF5F57]' : 'border-[rgba(0,0,0,0.1)]'
                    }`}
                  />
                  {errors[key] && (
                    <p className="text-[11px] text-[#FF5F57] mt-1">{errors[key]}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-px bg-[rgba(0,0,0,0.06)] mt-6 mb-5" />

        <div className="flex items-center justify-end gap-3">
          {hasChanges && (
            <div className="flex items-center gap-2 mr-auto">
              <div className="w-2 h-2 rounded-full bg-[#FEBC2E]" />
              <span className="text-[12px] font-medium text-[#FEBC2E]">Unsaved changes</span>
            </div>
          )}
          <button
            onClick={save}
            disabled={!hasChanges || loading || Object.keys(errors).length > 0}
            className="flex items-center gap-2 bg-[#1D1D1F] text-white font-[DM_Sans] font-semibold text-[13px] rounded-xl px-5 py-2.5 hover:bg-[#333] transition-colors disabled:opacity-40"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Saving...' : 'Save Links'}
          </button>
        </div>
      </div>
    </div>
  );
}
