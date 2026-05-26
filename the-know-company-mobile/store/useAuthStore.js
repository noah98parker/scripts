// Zustand store for authentication state
// Handles Supabase auth lifecycle and guest mode (supabase = null)

import { create } from 'zustand';
import { signIn, signUp, signOut, supabase } from '../services/supabase';

const useAuthStore = create((set, get) => ({
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  user: null,
  session: null,
  loading: false,
  error: null,

  // ---------------------------------------------------------------------------
  // initialize: subscribe to Supabase auth state changes
  // Call this once on app mount (e.g., from app _layout)
  // ---------------------------------------------------------------------------
  initialize: () => {
    if (!supabase) {
      // Guest mode — no auth available
      set({ user: null, session: null, loading: false });
      return () => {}; // no-op unsubscribe
    }

    set({ loading: true });

    // Get current session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({
        session,
        user: session?.user ?? null,
        loading: false,
      });
    });

    // Subscribe to future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        set({
          session,
          user: session?.user ?? null,
          loading: false,
        });
      }
    );

    // Return unsubscribe function (caller can call on unmount if desired)
    return () => subscription.unsubscribe();
  },

  // ---------------------------------------------------------------------------
  // login: sign in with email + password
  // ---------------------------------------------------------------------------
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await signIn(email, password);
      if (error) {
        set({ loading: false, error: error.message });
        return { success: false, error: error.message };
      }
      set({
        user: data?.user ?? null,
        session: data?.session ?? null,
        loading: false,
        error: null,
      });
      return { success: true };
    } catch (err) {
      const message = err.message || 'Login failed.';
      set({ loading: false, error: message });
      return { success: false, error: message };
    }
  },

  // ---------------------------------------------------------------------------
  // register: create a new account with email + password
  // ---------------------------------------------------------------------------
  register: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await signUp(email, password);
      if (error) {
        set({ loading: false, error: error.message });
        return { success: false, error: error.message };
      }
      // Note: Supabase may require email confirmation before session is active
      set({
        user: data?.user ?? null,
        session: data?.session ?? null,
        loading: false,
        error: null,
      });
      return { success: true, requiresConfirmation: !data?.session };
    } catch (err) {
      const message = err.message || 'Registration failed.';
      set({ loading: false, error: message });
      return { success: false, error: message };
    }
  },

  // ---------------------------------------------------------------------------
  // logout: sign out the current user
  // ---------------------------------------------------------------------------
  logout: async () => {
    set({ loading: true, error: null });
    try {
      await signOut();
      set({ user: null, session: null, loading: false, error: null });
    } catch (err) {
      const message = err.message || 'Logout failed.';
      set({ loading: false, error: message });
    }
  },

  // ---------------------------------------------------------------------------
  // clearError: reset the error state
  // ---------------------------------------------------------------------------
  clearError: () => set({ error: null }),
}));

export default useAuthStore;
