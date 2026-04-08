import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  fetchUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user }),

  fetchUser: async () => {
    set({ loading: true });
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('[auth] fetchUser:', error);
        set({ user: null });
        return;
      }
      set({ user: user ?? null });
    } catch (err) {
      console.error('[auth] fetchUser failed:', err);
      set({ user: null });
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[auth] signOut error:', err);
    }
    set({ user: null });
  },
}));
