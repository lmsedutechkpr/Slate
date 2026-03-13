'use client';

import {create} from 'zustand';
import {persist} from 'zustand/middleware';

type UIState = {
  language: 'en' | 'ta';
  theme: 'dark';
  sidebarOpen: boolean;
  cartDrawerOpen: boolean;
  setLanguage: (language: 'en' | 'ta') => void;
  setTheme: (theme: string) => void;
  setSidebarOpen: (v: boolean) => void;
  setCartDrawerOpen: (v: boolean) => void;
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      language: 'en',
      theme: 'dark',
      sidebarOpen: false,
      cartDrawerOpen: false,
      setLanguage: (language) => set({language}),
      setTheme: () => set({theme: 'dark'}), // Forced dark mode
      setSidebarOpen: (sidebarOpen) => set({sidebarOpen}),
      setCartDrawerOpen: (cartDrawerOpen) => set({cartDrawerOpen}),
    }),
    {
      name: 'slate-ui-store',
      partialize: (state) => ({ language: state.language, theme: state.theme, sidebarOpen: state.sidebarOpen }),
    }
  )
);
