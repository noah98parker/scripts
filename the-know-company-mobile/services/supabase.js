// Supabase client configured for React Native
// Uses expo-secure-store for session persistence
// Guest mode: if credentials are missing, supabase = null and all helpers return gracefully

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// ---------------------------------------------------------------------------
// SecureStore adapter for Supabase auth session persistence
// ---------------------------------------------------------------------------
const SecureStoreAdapter = {
  getItem: async (key) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.warn('[supabase] SecureStore setItem error:', err.message);
    }
  },
  removeItem: async (key) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (err) {
      console.warn('[supabase] SecureStore removeItem error:', err.message);
    }
  },
};

// ---------------------------------------------------------------------------
// Initialize Supabase client (or null in guest mode)
// ---------------------------------------------------------------------------
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || '';

export let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: SecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
} else {
  console.warn(
    '[supabase] Missing supabaseUrl or supabaseAnonKey in app.config. Running in guest mode.'
  );
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

export async function signUp(email, password) {
  if (!supabase) return { data: null, error: { message: 'Guest mode — Supabase not configured.' } };
  return supabase.auth.signUp({ email, password });
}

export async function signIn(email, password) {
  if (!supabase) return { data: null, error: { message: 'Guest mode — Supabase not configured.' } };
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  if (!supabase) return { error: null };
  return supabase.auth.signOut();
}

export async function getCurrentUser() {
  if (!supabase) return { data: { user: null }, error: null };
  return supabase.auth.getUser();
}

// ---------------------------------------------------------------------------
// Favorites helpers
// Table: favorite_spots (id, user_id, name, lat, lon, address, notes, created_at)
// ---------------------------------------------------------------------------

export async function getFavorites(userId) {
  if (!supabase || !userId) return [];
  try {
    const { data, error } = await supabase
      .from('favorite_spots')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[supabase] getFavorites error:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('[supabase] getFavorites exception:', err.message);
    return [];
  }
}

export async function addFavorite(userId, { name, lat, lon, address, notes }) {
  if (!supabase || !userId) return { data: null, error: { message: 'Guest mode or missing userId.' } };
  try {
    const { data, error } = await supabase
      .from('favorite_spots')
      .insert([{ user_id: userId, name, lat, lon, address: address || null, notes: notes || null }])
      .select()
      .single();

    if (error) {
      console.warn('[supabase] addFavorite error:', error.message);
    }
    return { data, error };
  } catch (err) {
    console.warn('[supabase] addFavorite exception:', err.message);
    return { data: null, error: { message: err.message } };
  }
}

export async function removeFavorite(id) {
  if (!supabase || !id) return { error: null };
  try {
    const { error } = await supabase
      .from('favorite_spots')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('[supabase] removeFavorite error:', error.message);
    }
    return { error };
  } catch (err) {
    console.warn('[supabase] removeFavorite exception:', err.message);
    return { error: { message: err.message } };
  }
}

// ---------------------------------------------------------------------------
// Parking timer helpers
// Table: parking_timers (id, user_id, spot_name, lat, lon, started_at, duration_minutes, notification_ids, completed, created_at)
// ---------------------------------------------------------------------------

export async function getActiveTimers(userId) {
  if (!supabase || !userId) return [];
  try {
    const { data, error } = await supabase
      .from('parking_timers')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', false);

    if (error) {
      console.warn('[supabase] getActiveTimers error:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('[supabase] getActiveTimers exception:', err.message);
    return [];
  }
}

export async function createTimer(userId, {
  spotName,
  lat,
  lon,
  startedAt,
  durationMinutes,
  notificationIds,
}) {
  if (!supabase || !userId) return { data: null, error: { message: 'Guest mode or missing userId.' } };
  try {
    const { data, error } = await supabase
      .from('parking_timers')
      .insert([
        {
          user_id: userId,
          spot_name: spotName || null,
          lat: lat || null,
          lon: lon || null,
          started_at: startedAt || new Date().toISOString(),
          duration_minutes: durationMinutes,
          notification_ids: notificationIds || null,
          completed: false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.warn('[supabase] createTimer error:', error.message);
    }
    return { data, error };
  } catch (err) {
    console.warn('[supabase] createTimer exception:', err.message);
    return { data: null, error: { message: err.message } };
  }
}

export async function completeTimer(id) {
  if (!supabase || !id) return { error: null };
  try {
    const { error } = await supabase
      .from('parking_timers')
      .update({ completed: true })
      .eq('id', id);

    if (error) {
      console.warn('[supabase] completeTimer error:', error.message);
    }
    return { error };
  } catch (err) {
    console.warn('[supabase] completeTimer exception:', err.message);
    return { error: { message: err.message } };
  }
}
