// Zustand store for authentication state
// Handles Supabase auth lifecycle and guest mode (supabase = null)

import { create } from 'zustand';
import { signIn, signUp, signOut, supabase as supabaseClient } from '../services/supabase';

const useAuthStore = create((set, get) => ({
  // ── State ────────────────────────────────────────────────────────────────
  user: null,
  session: null,
  loading: false,
  error: null,

  // Expose the raw supabase client so screens can do inline queries when needed.
  // Will be null when Supabase isn't configured (guest mode).
  supabase: supabaseClient,

  // Derived: true when a user is authenticated
  get isAuthenticated() {
    return get().user !== null;
  },

  // ── initialize ───────────────────────────────────────────────────────────
  // Subscribe to Supabase auth state changes. Call once from app _layout.
  initialize: () => {
    if (!supabaseClient) {
      set({ user: null, session: null, loading: false });
      return () => {};
    }

    set({ loading: true });

    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      set({
        session,
        user: session?.user ?? null,
        loading: false,
      });
    });

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      (_event, session) => {
        set({
          session,
          user: session?.user ?? null,
          loading: false,
        });
      }
    );

    return () => subscription.unsubscribe();
  },

  // ── login ────────────────────────────────────────────────────────────────
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await signIn(email, password);
      if (error) {
        set({ loading: false, error: error.message });
        return { success: false, error: error.message };
      }
      set({ user: data?.user ?? null, session: data?.session ?? null, loading: false, error: null });
      return { success: true };
    } catch (err) {
      const msg = err.message || 'Login failed.';
      set({ loading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  // ── register ─────────────────────────────────────────────────────────────
  register: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await signUp(email, password);
      if (error) {
        set({ loading: false, error: error.message });
        return { success: false, error: error.message };
      }
      set({ user: data?.user ?? null, session: data?.session ?? null, loading: false, error: null });
      return { success: true, requiresConfirmation: !data?.session };
    } catch (err) {
      const msg = err.message || 'Registration failed.';
      set({ loading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  // ── logout ───────────────────────────────────────────────────────────────
  logout: async () => {
    set({ loading: true, error: null });
    try {
      await signOut();
      set({ user: null, session: null, loading: false, error: null });
    } catch (err) {
      set({ loading: false, error: err.message || 'Logout failed.' });
    }
  },

  clearError: () => set({ error: null }),
}));

export { useAuthStore };
export default useAuthStore;
