// store/auth.ts — Zustand auth store. Holds the Supabase session + fetched profile.
// The root layout is responsible for wiring onAuthStateChange into this store.
import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types/database';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  // isInitialised flips true once the first auth check + profile fetch resolves,
  // so the router can hold on a splash until we know where to send the user.
  isInitialised: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setInitialised: (v: boolean) => void;
  fetchProfile: (userId: string) => Promise<Profile | null>;
  signOut: () => Promise<void>;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  session: null,
  profile: null,
  isInitialised: false,

  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setInitialised: (v) => set({ isInitialised: v }),

  fetchProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[auth] fetchProfile error:', error.message);
      set({ profile: null });
      return null;
    }
    set({ profile: data });
    return data;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null });
  },

  reset: () => set({ session: null, profile: null, isInitialised: false }),
}));

// Convenience selector — the current user's role, or null when signed out.
export const useRole = (): UserRole | null =>
  useAuthStore((s) => s.profile?.role ?? null);
