'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    if (process.env.NODE_ENV !== 'production') {
      // Local dev should not run with stale production SW caches.
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().catch(() => {});
        });
      });

      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => {
            if (key.startsWith('slate-')) {
              caches.delete(key).catch(() => {});
            }
          });
        });
      }
      return;
    }

    navigator.serviceWorker.register('/sw.js').catch(() => {
      // no-op
    });
  }, []);

  return null;
}
