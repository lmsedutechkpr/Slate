import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribe } from './realtime.js';

export function useRealtimeInvalidate(queryKeys = [], topics = []) {
  const queryClient = useQueryClient();

  useEffect(() => {
    let unsubs = [];
    (async () => {
      const unsubApi = await subscribe('api:update', (data) => {
        console.log('Real-time API update received:', data);
        try {
          queryKeys.forEach((k) => {
            console.log('Invalidating query:', k);
            queryClient.invalidateQueries({ queryKey: k });
          });
        } catch (error) {
          console.error('Error invalidating queries:', error);
        }
      });
      unsubs.push(unsubApi);

      for (const t of topics) {
        const unsubTopic = await subscribe(`${t}:update`, (data) => {
          console.log(`Real-time ${t} update received:`, data);
          try {
            queryKeys.forEach((k) => {
              console.log('Invalidating query:', k);
              queryClient.invalidateQueries({ queryKey: k });
            });
          } catch (error) {
            console.error('Error invalidating queries:', error);
          }
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


