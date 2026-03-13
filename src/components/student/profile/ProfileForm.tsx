'use client';

import { useState } from 'react';
import { CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

function TrafficLights() {
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <div className="w-2 h-2 rounded-full bg-[#FF5F57]" />
      <div className="w-2 h-2 rounded-full bg-[#FEBC2E]" />
      <div className="w-2 h-2 rounded-full bg-[#28C840]" />
    </div>
  );
}

interface ProfileFormProps {
  profile: any;
  userEmail: string;
  userId: string;
}

export default function ProfileForm({ profile, userEmail, userId }: ProfileFormProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    display_name: profile?.display_name || '',
    phone: profile?.phone || '',
    city: profile?.city || '',
    bio: profile?.bio || '',
  });

  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setHasChanges(true);
  };

  const handleReset = () => {
    setFormData({
      full_name: profile?.full_name || '',
      display_name: profile?.display_name || '',
      phone: profile?.phone || '',
      city: profile?.city || '',
      bio: profile?.bio || '',
    });
    setHasChanges(false);
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          display_name: formData.display_name,
          phone: formData.phone,
          city: formData.city,
          bio: formData.bio,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
      
      toast.success('Profile updated successfully!', {
        icon: <CheckCircle2 className="w-4 h-4 text-[#28C840]" />
      });
      setHasChanges(false);
    } catch (err: any) {
      toast.error('Failed to save: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Titlebar */}
      <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex items-center">
        <TrafficLights />
        <span className="flex-1 text-center font-semibold text-[13px] text-gray-900 pr-5">Personal Information</span>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Full Name */}
          <div className="md:col-span-1">
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="E.g. John Doe"
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-shadow"
            />
          </div>

          {/* Display Name */}
          <div className="md:col-span-1">
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              name="display_name"
              value={formData.display_name}
              onChange={handleChange}
              placeholder="johndoe123"
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-gray-900 focus:outline-none focus:border-gray-900 transition-shadow"
            />
            <p className="text-[11px] text-gray-400 mt-1">Shown on your public profile</p>
          </div>

          {/* Email (Read only) */}
          <div className="md:col-span-2">
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={userEmail}
                disabled
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-gray-500 opacity-80 cursor-not-allowed"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-green-50 text-[#28C840] px-2 py-0.5 rounded-md border border-green-100">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">Verified</span>
              </div>
            </div>
          </div>

          {/* Phone */}
          <div className="md:col-span-1">
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-gray-900 focus:outline-none focus:border-gray-900 transition-shadow"
            />
          </div>

          {/* City */}
          <div className="md:col-span-1">
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              City / Location
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Chennai"
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-gray-900 focus:outline-none focus:border-gray-900 transition-shadow"
            />
          </div>

          {/* Bio */}
          <div className="md:col-span-2">
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              About Me
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={3}
              maxLength={300}
              placeholder="Tell us a bit about yourself..."
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-gray-900 focus:outline-none focus:border-gray-900 transition-shadow resize-none"
            />
            <p className="text-[11px] text-gray-400 mt-1 text-right">
              {formData.bio.length} / 300
            </p>
          </div>
        </div>

        <div className="my-6 h-px bg-gray-100" />

        {/* Action Row */}
        <div className="flex items-center justify-end gap-3">
          {hasChanges && (
            <div className="flex items-center gap-2 mr-auto">
              <div className="w-2 h-2 rounded-full bg-[#FEBC2E]" />
              <span className="text-[12px] font-medium text-[#FEBC2E]">Unsaved changes</span>
            </div>
          )}
          
          {hasChanges && (
            <button
              onClick={handleReset}
              disabled={loading}
              className="text-[13px] text-gray-600 font-medium px-4 py-2 hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-50"
            >
              Reset
            </button>
          )}
          
          <button
            onClick={saveProfile}
            disabled={!hasChanges || loading}
            className="flex items-center gap-2 bg-gray-900 text-white font-semibold text-[13px] rounded-xl px-5 py-2.5 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
