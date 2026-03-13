'use client';

import {Toaster} from 'sonner';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#111111',
          color: '#FAFAFA',
          border: '1px solid rgba(255,255,255,0.07)'
        }
      }}
    />
  );
}
