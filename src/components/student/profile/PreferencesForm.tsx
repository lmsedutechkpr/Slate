'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import useUIStore from '@/store/uiStore';

function TrafficLights() {
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <div className="w-2 h-2 rounded-full bg-[#FF5F57]" />
      <div className="w-2 h-2 rounded-full bg-[#FEBC2E]" />
      <div className="w-2 h-2 rounded-full bg-[#28C840]" />
    </div>
  );
}

// Simple local Switch component to avoid importing shadcn if not set up
function Switch({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[22px] w-[42px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
        checked ? 'bg-gray-900' : 'bg-gray-200'
      }`}
    >
      <span
        className={`pointer-events-none block h-[18px] w-[18px] rounded-full bg-white shadow-sm ring-0 transition-transform ${
          checked ? 'translate-x-[20px]' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

interface PreferencesFormProps {
  preferences: any;
  profile: any;
  userId: string;
}

export default function PreferencesForm({ preferences, profile, userId }: PreferencesFormProps) {
  const supabase = createClient();
  const setLanguageStore = useUIStore((s: any) => s.setLanguage);
  
  const [loading, setLoading] = useState(false);
  const [prefs, setPrefs] = useState({
    language: preferences?.language || 'en',
    playback_speed: preferences?.playback_speed || 1,
    autoplay_next: preferences?.autoplay_next ?? true,
    show_subtitles: preferences?.show_subtitles ?? false,
    email_notifications: profile?.email_notifications ?? true,
    push_notifications: profile?.push_notifications ?? true,
  });

  const [hasChanges, setHasChanges] = useState(false);

  const updatePref = (key: string, value: any) => {
    setPrefs(p => ({ ...p, [key]: value }));
    setHasChanges(true);
    
    // Optimistic UI store update for language
    if (key === 'language') {
      setLanguageStore(value as 'en' | 'ta');
    }
  };

  const savePreferences = async () => {
    setLoading(true);
    try {
      // 1. Update user_preferences table
      const { error: prefsErr } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          language: prefs.language,
          playback_speed: prefs.playback_speed,
          autoplay_next: prefs.autoplay_next,
          show_subtitles: prefs.show_subtitles,
          updated_at: new Date().toISOString(),
        });
      if (prefsErr) throw prefsErr;

      // 2. Update profiles table for notifications
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({
          preferred_language: prefs.language,
          email_notifications: prefs.email_notifications,
          push_notifications: prefs.push_notifications,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
      if (profileErr) throw profileErr;

      toast.success('Preferences saved successfully!');
      setHasChanges(false);
    } catch (err: any) {
      toast.error('Failed to save preferences: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const SPEED_OPTS = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Titlebar */}
      <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex items-center">
        <TrafficLights />
        <span className="flex-1 text-center font-semibold text-[13px] text-gray-900 pr-5">Preferences</span>
      </div>

      <div className="p-6 space-y-8">
        
        {/* Language & Display */}
        <section>
          <h3 className="font-semibold text-[14px] text-gray-900 mb-4">Language & Display</h3>
          
          <div>
            <p className="font-medium text-[13px] text-gray-900">Platform Language</p>
            <p className="text-[12px] text-gray-500 mt-0.5">Affects UI and course content where available</p>
            
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={() => updatePref('language', 'en')}
                className={`rounded-full px-5 py-2 text-[13px] font-medium transition-colors ${
                  prefs.language === 'en'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                EN English
              </button>
              <button
                onClick={() => updatePref('language', 'ta')}
                className={`rounded-full px-5 py-2 text-[13px] font-medium transition-colors ${
                  prefs.language === 'ta'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                தமிழ் Tamil
              </button>
            </div>
          </div>
        </section>

        {/* Video Playback */}
        <section>
          <h3 className="font-semibold text-[14px] text-gray-900 mb-4">Video Playback</h3>
          
          <div className="mb-5">
            <p className="font-medium text-[13px] text-gray-900 mb-2">Default Playback Speed</p>
            <div className="flex flex-wrap gap-2">
              {SPEED_OPTS.map(sp => (
                <button
                  key={sp}
                  onClick={() => updatePref('playback_speed', sp)}
                  className={`rounded-full px-4 py-1.5 text-[12px] font-medium transition-colors ${
                    prefs.playback_speed === sp
                      ? 'bg-gray-900 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {sp}x
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <p className="font-medium text-[13px] text-gray-900">Autoplay Next Lecture</p>
                <p className="text-[12px] text-gray-500 mt-0.5">Automatically play the next video when one ends</p>
              </div>
              <Switch checked={prefs.autoplay_next} onChange={(c) => updatePref('autoplay_next', c)} />
            </div>

            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <p className="font-medium text-[13px] text-gray-900">Show Subtitles by Default</p>
                <p className="text-[12px] text-gray-500 mt-0.5">When available on course videos</p>
              </div>
              <Switch checked={prefs.show_subtitles} onChange={(c) => updatePref('show_subtitles', c)} />
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section>
          <h3 className="font-semibold text-[14px] text-gray-900 mb-4">Notifications</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <p className="font-medium text-[13px] text-gray-900">Email Notifications</p>
                <p className="text-[12px] text-gray-500 mt-0.5">Course updates, new lectures, and order receipts</p>
              </div>
              <Switch checked={prefs.email_notifications} onChange={(c) => updatePref('email_notifications', c)} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[13px] text-gray-900">Push Notifications</p>
                <p className="text-[12px] text-gray-500 mt-0.5">Browser notifications for live classes and messages</p>
              </div>
              <Switch checked={prefs.push_notifications} onChange={(c) => updatePref('push_notifications', c)} />
            </div>
          </div>
        </section>

        {/* Action Row */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
          {hasChanges && (
            <div className="flex items-center gap-2 mr-auto">
              <div className="w-2 h-2 rounded-full bg-[#FEBC2E]" />
              <span className="text-[12px] font-medium text-[#FEBC2E]">Unsaved preferences</span>
            </div>
          )}
          
          <button
            onClick={savePreferences}
            disabled={!hasChanges || loading}
            className="flex items-center gap-2 bg-gray-900 text-white font-semibold text-[13px] rounded-xl px-5 py-2.5 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>

      </div>
    </div>
  );
}
