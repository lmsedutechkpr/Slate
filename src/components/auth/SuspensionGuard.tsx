'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface SuspensionGuardProps {
  userId: string;
}

export default function SuspensionGuard({ userId }: SuspensionGuardProps) {
  const router = useRouter();
  const handledRef = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    const forceLogoutWithReason = async (reason?: string | null) => {
      if (handledRef.current) return;
      handledRef.current = true;

      const finalReason = reason?.trim() || 'Policy violation';
      window.alert(`Your account has been suspended. Reason: ${finalReason}`);

      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error('Failed to sign out suspended user:', error);
      }

      router.replace(`/login?error=suspended&reason=${encodeURIComponent(finalReason)}`);
    };

    const checkCurrentStatus = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('status, suspension_reason')
        .eq('id', userId)
        .single();

      if (error) {
        // Fallback for deployments where suspension_reason column does not exist.
        const { data: fallback } = await supabase
          .from('profiles')
          .select('status')
          .eq('id', userId)
          .single();

        if (fallback?.status === 'suspended') {
          await forceLogoutWithReason(null);
        }
        return;
      }

      if (data?.status === 'suspended') {
        await forceLogoutWithReason((data as { suspension_reason?: string | null }).suspension_reason);
      }
    };

    checkCurrentStatus();

    const channel = supabase
      .channel(`suspension-guard-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        async (payload) => {
          const next = payload.new as { status?: string; suspension_reason?: string | null };
          if (next?.status === 'suspended') {
            await forceLogoutWithReason(next.suspension_reason ?? null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, userId]);

  return null;
}
