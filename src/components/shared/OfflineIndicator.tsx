'use client';

import { useEffect, useRef, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export default function OfflineIndicator() {
  const [online, setOnline] = useState(true);
  const [showOnlineToast, setShowOnlineToast] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    setOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const handleOffline = () => {
      wasOffline.current = true;
      setOnline(false);
      setShowOnlineToast(false);
    };
    const handleOnline = () => {
      setOnline(true);
      if (wasOffline.current) {
        setShowOnlineToast(true);
        setTimeout(() => setShowOnlineToast(false), 3000);
        wasOffline.current = false;
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!online) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1D1D1F] px-6 py-3 text-center text-[13px] font-medium text-white">
        <span className="inline-flex items-center gap-2">
          <WifiOff className="h-4 w-4" />
          You are offline. Some features may not be available.
        </span>
      </div>
    );
  }

  if (showOnlineToast) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#28C840] px-6 py-3 text-center text-[13px] font-medium text-white">
        <span className="inline-flex items-center gap-2">
          <Wifi className="h-4 w-4" />
          Back online!
        </span>
      </div>
    );
  }

  return null;
}
