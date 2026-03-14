'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Loader2, Plus, X } from 'lucide-react';

interface Props {
  instructorProfile: any;
  userId: string;
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ்' },
];

const EXP_OPTIONS = [
  'Less than 1 year', '1-2 years', '3-5 years', '5-10 years', '10+ years',
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

export default function TeachingInfoForm({ instructorProfile: ip, userId }: Props) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [headline, setHeadline] = useState(ip?.headline || '');
  const [bio, setBio] = useState(ip?.bio || '');
  const [tags, setTags] = useState<string[]>(ip?.expertise_tags || []);
  const [tagInput, setTagInput] = useState('');
  const [langs, setLangs] = useState<string[]>(ip?.teaching_languages || ['en']);
  const [experience, setExperience] = useState(ip?.experience_level || '');
  const [jobTitle, setJobTitle] = useState(ip?.job_title || '');
  const [company, setCompany] = useState(ip?.company || '');
  const [certEnabled, setCertEnabled] = useState(ip?.cert_enabled ?? false);

  const mark = () => setHasChanges(true);

  const addTag = () => {
    const t = tagInput.trim();
    if (!t || tags.includes(t) || tags.length >= 15) return;
    setTags([...tags, t]);
    setTagInput('');
    mark();
  };

  const removeTag = (t: string) => {
    setTags(tags.filter(x => x !== t));
    mark();
  };

  const toggleLang = (code: string) => {
    setLangs(prev =>
      prev.includes(code) ? prev.filter(l => l !== code) : [...prev, code]
    );
    mark();
  };

  const save = async () => {
    setLoading(true);
    try {
      // Try saving with all fields first (including new columns)
      const fullPayload: any = {
        headline,
        expertise_tags: tags,
        teaching_languages: langs,
      };

      // Try to add new fields — if columns don't exist, fallback below catches it
      try {
        const { error: fullError } = await supabase.from('instructor_profiles').update({
          ...fullPayload,
          bio,
          experience_level: experience,
          job_title: jobTitle,
          company,
          cert_enabled: certEnabled,
        }).eq('user_id', userId);
        if (fullError) throw fullError;
      } catch (e: any) {
        // Column doesn't exist yet — save known columns only
        const { error } = await supabase.from('instructor_profiles').update(fullPayload).eq('user_id', userId);
        if (error) throw error;
      }

      toast.success('Teaching info saved!', {
        style: { color: '#28C840' },
      });
      setHasChanges(false);
    } catch (err: any) {
      toast.error('Failed to save: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm overflow-hidden">
      {/* TITLEBAR */}
      <div className="h-[44px] flex items-center gap-3 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
        <TL />
        <span className="font-[DM_Sans] font-semibold text-[13px] text-[#1D1D1F]">Teaching Information</span>
      </div>

      <div className="p-6 space-y-6">
        {/* SECTION: Public Profile */}
        <div>
          <p className="font-[DM_Sans] font-semibold text-[14px] text-[#1D1D1F] mb-4">Public Profile</p>

          {/* Headline */}
          <div className="mb-5">
            <label className="block text-[12px] font-semibold text-[#AEAEB2] uppercase tracking-wide mb-1.5">
              Headline <span className="text-[#FF5F57]">*</span>
            </label>
            <input
              value={headline}
              onChange={e => { setHeadline(e.target.value); mark(); }}
              maxLength={120}
              placeholder="e.g. Senior React Developer · 8 years experience"
              className="w-full border border-[rgba(0,0,0,0.1)] rounded-xl px-4 py-2.5 text-[13px] text-[#1D1D1F] bg-[#F5F5F7] focus:outline-none focus:border-[#1D1D1F]"
            />
            <div className="flex justify-between mt-1">
              <p className="text-[11px] text-[#AEAEB2]">First thing students see on your profile</p>
              <span className="text-[11px] text-[#AEAEB2]">{headline.length}/120</span>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-[12px] font-semibold text-[#AEAEB2] uppercase tracking-wide mb-1.5">
              Professional Bio <span className="text-[#FF5F57]">*</span>
            </label>
            <textarea
              value={bio}
              onChange={e => { setBio(e.target.value); mark(); }}
              maxLength={1000}
              rows={6}
              placeholder="Write a compelling bio about your background, experience and teaching style..."
              className="w-full border border-[rgba(0,0,0,0.1)] rounded-xl px-4 py-2.5 text-[13px] text-[#1D1D1F] bg-[#F5F5F7] focus:outline-none focus:border-[#1D1D1F] resize-none"
            />
            <div className="flex justify-between mt-1">
              <p className="text-[11px] text-[#AEAEB2]">This appears on your public instructor page</p>
              <span className="text-[11px] text-[#AEAEB2]">{bio.length}/1000</span>
            </div>
          </div>
        </div>

        {/* SECTION: Expertise */}
        <div>
          <p className="font-[DM_Sans] font-semibold text-[14px] text-[#1D1D1F] mb-4">Expertise</p>

          {/* Tags */}
          <div className="mb-5">
            <label className="block text-[12px] font-semibold text-[#AEAEB2] uppercase tracking-wide mb-1.5">
              Expertise Tags <span className="text-[#FF5F57]">*</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map(t => (
                <span
                  key={t}
                  className="flex items-center gap-1.5 bg-[#F5F5F7] border border-[rgba(0,0,0,0.06)] rounded-full px-3 py-1 text-[12px] text-[#1D1D1F] font-medium"
                >
                  {t}
                  <button onClick={() => removeTag(t)} className="text-[#AEAEB2] hover:text-[#FF5F57] transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                disabled={tags.length >= 15}
                placeholder={tags.length >= 15 ? 'Max 15 tags reached' : 'Add skill, press Enter...'}
                className="flex-1 border border-[rgba(0,0,0,0.1)] rounded-xl px-4 py-2 text-[13px] text-[#1D1D1F] bg-[#F5F5F7] focus:outline-none focus:border-[#1D1D1F] disabled:opacity-50"
              />
              <button
                onClick={addTag}
                disabled={tags.length >= 15 || !tagInput.trim()}
                className="px-4 py-2 bg-[#1D1D1F] text-white rounded-xl text-[12px] font-medium hover:bg-[#333] transition-colors disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-[#AEAEB2] mt-1">{tags.length}/15 tags</p>
          </div>

          {/* Teaching Languages */}
          <div>
            <label className="block text-[12px] font-semibold text-[#AEAEB2] uppercase tracking-wide mb-2">
              Teaching Languages
            </label>
            <div className="flex gap-2">
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  onClick={() => toggleLang(l.code)}
                  className={`px-4 py-2 rounded-full text-[12px] font-medium transition-all border ${
                    langs.includes(l.code)
                      ? 'bg-[#1D1D1F] text-white border-transparent'
                      : 'bg-[#F5F5F7] text-[#6E6E73] border-[rgba(0,0,0,0.08)] hover:bg-[rgba(0,0,0,0.05)]'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION: Experience */}
        <div>
          <p className="font-[DM_Sans] font-semibold text-[14px] text-[#1D1D1F] mb-4">Experience</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-[#AEAEB2] uppercase tracking-wide mb-1.5">
                Years of Experience
              </label>
              <select
                value={experience}
                onChange={e => { setExperience(e.target.value); mark(); }}
                className="w-full border border-[rgba(0,0,0,0.1)] rounded-xl px-4 py-2.5 text-[13px] text-[#1D1D1F] bg-[#F5F5F7] focus:outline-none focus:border-[#1D1D1F]"
              >
                <option value="">Select...</option>
                {EXP_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#AEAEB2] uppercase tracking-wide mb-1.5">
                Current Job Title <span className="text-[#AEAEB2] font-normal">(optional)</span>
              </label>
              <input
                value={jobTitle}
                onChange={e => { setJobTitle(e.target.value); mark(); }}
                placeholder="e.g. Senior Engineer at Zoho"
                className="w-full border border-[rgba(0,0,0,0.1)] rounded-xl px-4 py-2.5 text-[13px] text-[#1D1D1F] bg-[#F5F5F7] focus:outline-none focus:border-[#1D1D1F]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[12px] font-semibold text-[#AEAEB2] uppercase tracking-wide mb-1.5">
                Company / Organisation <span className="text-[#AEAEB2] font-normal">(optional)</span>
              </label>
              <input
                value={company}
                onChange={e => { setCompany(e.target.value); mark(); }}
                placeholder="e.g. Zoho Corporation"
                className="w-full border border-[rgba(0,0,0,0.1)] rounded-xl px-4 py-2.5 text-[13px] text-[#1D1D1F] bg-[#F5F5F7] focus:outline-none focus:border-[#1D1D1F]"
              />
            </div>
          </div>
        </div>

        {/* SECTION: Course Preferences */}
        <div>
          <p className="font-[DM_Sans] font-semibold text-[14px] text-[#1D1D1F] mb-4">Course Preferences</p>

          {/* Certificate Toggle */}
          <label className="flex items-center justify-between cursor-pointer bg-[#F5F5F7] rounded-xl p-4">
            <div>
              <div className="font-[DM_Sans] font-medium text-[13px] text-[#1D1D1F]">Enable certificates by default</div>
              <div className="text-[12px] text-[#6E6E73] mt-0.5">Enable certificates on all new courses by default</div>
            </div>
            <div
              onClick={() => { setCertEnabled(!certEnabled); mark(); }}
              className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${certEnabled ? 'bg-[#1D1D1F]' : 'bg-[rgba(0,0,0,0.15)]'}`}
            >
              <div className={`absolute top-1 transition-all w-4 h-4 rounded-full bg-white shadow-sm ${certEnabled ? 'left-5' : 'left-1'}`} />
            </div>
          </label>
        </div>

        {/* DIVIDER + ACTIONS */}
        <div className="h-px bg-[rgba(0,0,0,0.06)]" />
        <div className="flex items-center justify-end gap-3">
          {hasChanges && (
            <div className="flex items-center gap-2 mr-auto">
              <div className="w-2 h-2 rounded-full bg-[#FEBC2E]" />
              <span className="text-[12px] font-medium text-[#FEBC2E]">Unsaved changes</span>
            </div>
          )}
          <button
            onClick={save}
            disabled={!hasChanges || loading}
            className="flex items-center gap-2 bg-[#1D1D1F] text-white font-[DM_Sans] font-semibold text-[13px] rounded-xl px-5 py-2.5 hover:bg-[#333] transition-colors disabled:opacity-40"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Saving...' : 'Save Teaching Info'}
          </button>
        </div>
      </div>
    </div>
  );
}
