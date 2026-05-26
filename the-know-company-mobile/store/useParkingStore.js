// Zustand store for all parking-related data

import { create } from 'zustand';

const useParkingStore = create((set) => ({
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  // User's current GPS coordinates
  userLocation: null,

  // A tapped map location the user wants to inspect
  activePin: null,

  // Computed parking verdict (from computeVerdict in parkingRules.js)
  verdict: null,

  // Reverse geocode result (from reverseGeocode in parkingRules.js)
  geocodeInfo: null,

  // Combined parking results: Overpass + Google Places + city open data
  nearbyParking: [],

  // Tow companies from Overpass
  towCompanies: [],

  // City-specific parking meter data from Socrata/SODA APIs
  cityMeters: [],

  // Saved favorites from Supabase
  favorites: [],

  // Active parking timers from Supabase
  activeTimers: [],

  // Whether a data-fetch operation is in progress
  dataLoading: false,

  // Key representing the last fetched location (e.g. "lat,lon" string)
  // Used to avoid redundant re-fetches
  lastFetchKey: null,

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  setUserLocation: (loc) => set({ userLocation: loc }),

  setActivePin: (loc) => set({ activePin: loc }),

  clearPin: () => set({ activePin: null }),

  setVerdict: (v) => set({ verdict: v }),

  setGeocodeInfo: (g) => set({ geocodeInfo: g }),

  setNearbyParking: (arr) => set({ nearbyParking: arr }),

  setTowCompanies: (arr) => set({ towCompanies: arr }),

  setCityMeters: (arr) => set({ cityMeters: arr }),

  setFavorites: (arr) => set({ favorites: arr }),

  setActiveTimers: (arr) => set({ activeTimers: arr }),

  setDataLoading: (bool) => set({ dataLoading: bool }),

  setLastFetchKey: (key) => set({ lastFetchKey: key }),
}));

export default useParkingStore;
