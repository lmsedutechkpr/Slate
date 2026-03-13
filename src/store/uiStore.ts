import { create } from 'zustand';

interface UIState {
  language: 'en' | 'ta';
  setLanguage: (lang: 'en' | 'ta') => void;
}

const useUIStore = create<UIState>((set) => ({
  language: 'en',
  setLanguage: (lang) => set({ language: lang }),
}));

export default useUIStore;
