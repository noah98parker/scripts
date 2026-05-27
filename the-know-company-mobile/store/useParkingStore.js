// Zustand store for all parking-related state + CRUD actions (favorites, timers)

import { create } from 'zustand';
import {
  addFavorite as dbAddFavorite,
  removeFavorite as dbRemoveFavorite,
  createTimer as dbCreateTimer,
  completeTimer as dbCompleteTimer,
} from '../services/supabase';
import { scheduleParkingTimer, cancelTimer as cancelNotifications } from '../services/notifications';

const useParkingStore = create((set, get) => ({
  // ── Location & map ───────────────────────────────────────────────────────
  userLocation: null,
  activePin: null,

  // ── Parking verdict ───────────────────────────────────────────────────────
  verdict: null,
  geocodeInfo: null,

  // ── Nearby data ───────────────────────────────────────────────────────────
  nearbyParking: [],   // OSM + Google Places merged
  towCompanies: [],
  cityMeters: [],      // Socrata city open data

  // ── User data (requires Supabase account) ────────────────────────────────
  favorites: [],
  activeTimers: [],

  // ── UI state ─────────────────────────────────────────────────────────────
  dataLoading: false,
  lastFetchKey: null,

  // ── Basic setters ────────────────────────────────────────────────────────
  setUserLocation:  (loc)  => set({ userLocation: loc }),
  setActivePin:     (loc)  => set({ activePin: loc }),
  clearPin:         ()     => set({ activePin: null }),
  setVerdict:       (v)    => set({ verdict: v }),
  setGeocodeInfo:   (g)    => set({ geocodeInfo: g }),
  setNearbyParking: (arr)  => set({ nearbyParking: arr }),
  setTowCompanies:  (arr)  => set({ towCompanies: arr }),
  setCityMeters:    (arr)  => set({ cityMeters: arr }),
  setFavorites:     (arr)  => set({ favorites: arr }),
  setActiveTimers:  (arr)  => set({ activeTimers: arr }),
  setDataLoading:   (bool) => set({ dataLoading: bool }),
  setLastFetchKey:  (key)  => set({ lastFetchKey: key }),

  // ── addFavorite ───────────────────────────────────────────────────────────
  // Persists to Supabase and optimistically prepends to local state.
  addFavorite: async (userId, spotData) => {
    // spotData: { name, lat, lon, address?, notes? }
    try {
      const result = await dbAddFavorite(userId, spotData);
      if (result) {
        set(state => ({ favorites: [result, ...state.favorites] }));
      }
      return result;
    } catch (err) {
      console.warn('addFavorite error:', err);
      return null;
    }
  },

  // ── removeFavorite ────────────────────────────────────────────────────────
  // Removes from Supabase and filters out of local state.
  removeFavorite: async (id) => {
    try {
      await dbRemoveFavorite(id);
      set(state => ({ favorites: state.favorites.filter(f => f.id !== id) }));
    } catch (err) {
      console.warn('removeFavorite error:', err);
    }
  },

  // ── startTimer ────────────────────────────────────────────────────────────
  // Schedules local notifications and persists the timer to Supabase.
  startTimer: async (userId, { spotName, lat, lon, durationMinutes, warningMinutes = 10 }) => {
    const startedAt = new Date();
    let warningNotifId = null;
    let expiryNotifId  = null;

    try {
      const notifIds = await scheduleParkingTimer(spotName, startedAt, durationMinutes, warningMinutes);
      warningNotifId = notifIds?.warningId ?? null;
      expiryNotifId  = notifIds?.expiryId  ?? null;
    } catch (err) {
      console.warn('Notification scheduling error:', err);
    }

    try {
      const timer = await dbCreateTimer(userId, {
        spotName,
        lat,
        lon,
        startedAt: startedAt.toISOString(),
        durationMinutes,
        notificationIds: { warningId: warningNotifId, expiryId: expiryNotifId },
      });
      if (timer) {
        set(state => ({ activeTimers: [timer, ...state.activeTimers] }));
      }
      return timer;
    } catch (err) {
      console.warn('startTimer DB error:', err);
      return null;
    }
  },

  // ── cancelTimer ───────────────────────────────────────────────────────────
  // Cancels notifications and marks the timer complete in Supabase.
  cancelTimer: async (timerId) => {
    const timer = get().activeTimers.find(t => t.id === timerId);
    if (timer) {
      try {
        await cancelNotifications(timer.warning_notif_id, timer.expiry_notif_id);
      } catch (err) {
        console.warn('Cancel notification error:', err);
      }
    }
    try {
      await dbCompleteTimer(timerId);
    } catch (err) {
      console.warn('completeTimer DB error:', err);
    }
    set(state => ({ activeTimers: state.activeTimers.filter(t => t.id !== timerId) }));
  },
}));

export { useParkingStore };
export default useParkingStore;
