import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribe } from './realtime.js';

export function useRealtimeInvalidate(queryKeys = [], topics = []) {
  const queryClient = useQueryClient();

  useEffect(() => {
    let unsubs = [];
    (async () => {
      const unsubApi = await subscribe('api:update', () => {
        try {
          queryKeys.forEach((k) => queryClient.invalidateQueries({ queryKey: k }));
        } catch {}
      });
      unsubs.push(unsubApi);

      for (const t of topics) {
        const unsubTopic = await subscribe(`${t}:update`, () => {
          try {
            queryKeys.forEach((k) => queryClient.invalidateQueries({ queryKey: k }));
          } catch {}
        });
        unsubs.push(unsubTopic);
      }
    })();

    return () => {
      for (const u of unsubs) {
        try { u(); } catch {}
      }
    };
  }, [queryClient, JSON.stringify(queryKeys), JSON.stringify(topics)]);
}


