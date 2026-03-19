'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { usePathname, useRouter } from 'next/navigation';

export default function GlobalMaintenanceOverlay() {
  const supabase = createClient();
  const router = useRouter();
  
  const [mode, setMode] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>('Service under Maintenance');
  const [bypass, setBypass] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;

    const fetchInitial = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        let isAdmin = false;
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          if (profile?.role === 'admin') {
            isAdmin = true;
          }
        }
        
        if (!active) return;
        setBypass(isAdmin);

        const { data: settings } = await supabase
          .from('site_settings')
          .select('key,value')
          .in('key', ['maintenanceMode', 'maintenanceMessage']);

        if (!active) return;

        if (settings) {
          const modeRow = settings.find((s) => s.key === 'maintenanceMode');
          const isMode = modeRow?.value === 'true' || modeRow?.value === true;
          setMode(isMode);
          
          const msgRow = settings.find((s) => s.key === 'maintenanceMessage');
          if (msgRow && msgRow.value) {
            setMsg(String(msgRow.value));
          }
        }
        setLoading(false);
      } catch {
        if (active) setLoading(false);
      }
    };

    fetchInitial();

        const channel = supabase.channel('global-maintenance')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, (payload) => {
        const row = payload.new as any;
        if (row && row.key) {
          if (row.key === 'maintenanceMode') {
            setMode(row.value === 'true' || row.value === true);
          }
          if (row.key === 'maintenanceMessage') {
            setMsg(row.value);
          }
        }
      })
      .subscribe();

    const poll = setInterval(async () => {
      if (!active) return;
      try {
        const { data: currentSettings } = await supabase
          .from('site_settings')
          .select('key,value')
          .in('key', ['maintenanceMode', 'maintenanceMessage']);
        if (currentSettings) {
          const modeRow = currentSettings.find((s) => s.key === 'maintenanceMode');
          if (modeRow) setMode(modeRow.value === 'true' || modeRow.value === true);
          const msgRow = currentSettings.find((s) => s.key === 'maintenanceMessage');
          if (msgRow && msgRow.value) setMsg(String(msgRow.value));
        }
      } catch (e) {
        // ignore polling errors
      }
    }, 5000); // poll every 5 seconds as fallback for real-time

    return () => {
      active = false;
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  if (loading || !mode) return null;

  if (bypass) {
    // Admins bypass the full-screen block, but we show them a small banner so they know it's active.
    return (
      <div className="fixed top-0 left-0 right-0 z-[99999] bg-yellow-500 text-black text-center py-2 text-sm font-bold flex items-center justify-center gap-2">
        <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Maintenance Mode Active: {msg}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0A0A0A] text-white p-6">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-yellow-500/10 flex items-center justify-center rounded-full mb-6 relative">
           <svg className="w-10 h-10 text-yellow-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
           </svg>
           <div className="absolute inset-0 rounded-full border border-yellow-500/30 animate-ping"></div>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Down for Maintenance</h1>
        <p className="text-lg md:text-xl text-gray-400 font-medium">
          {msg}
        </p>
      </div>
    </div>
  );
}
