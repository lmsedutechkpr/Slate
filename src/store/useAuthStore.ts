import {create} from 'zustand';
import {User} from '@supabase/supabase-js';

interface Profile {
  id: string;
  role: string;
  status: string;
  full_name: string;
  avatar_url: string | null;
  preferred_language: string;
}

interface AuthStore {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (v: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  profile: null,
  loading: true,
  setUser: (user) => set({user}),
  setProfile: (profile) => set({profile}),
  setLoading: (loading) => set({loading}),
  clear: () => set({user: null, profile: null, loading: false})
}));
