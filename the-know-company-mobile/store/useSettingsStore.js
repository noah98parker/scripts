// Zustand store for user settings, persisted to AsyncStorage

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useSettingsStore = create(
  persist(
    (set) => ({
      // ── Persisted state ──────────────────────────────────────────────────
      notificationsEnabled: true,
      timerWarningMinutes: 10,

      // Duration field — exposed under TWO names so both old and new screens work:
      //   screens use:         defaultDurationMinutes
      //   original store used: defaultTimerDuration
      defaultTimerDuration: 120,
      get defaultDurationMinutes() { return this.defaultTimerDuration; },

      // City open data — exposed under TWO names:
      //   screens use:         useCityData
      //   original store used: useCityOpenData
      useCityOpenData: true,
      get useCityData() { return this.useCityOpenData; },

      useGooglePlaces: false,
      onboardingComplete: false,

      // ── Actions ──────────────────────────────────────────────────────────
      setNotificationsEnabled: (v)  => set({ notificationsEnabled: v }),
      setTimerWarningMinutes:  (m)  => set({ timerWarningMinutes: m }),

      // Accepts both setter names
      setDefaultTimerDuration:   (m) => set({ defaultTimerDuration: m }),
      setDefaultDurationMinutes: (m) => set({ defaultTimerDuration: m }),

      // Accepts both setter names
      setUseCityOpenData: (v) => set({ useCityOpenData: v }),
      setUseCityData:     (v) => set({ useCityOpenData: v }),

      setUseGooglePlaces:    (v) => set({ useGooglePlaces: v }),
      setOnboardingComplete: (v) => set({ onboardingComplete: v }),

      resetSettings: () => set({
        notificationsEnabled: true,
        timerWarningMinutes: 10,
        defaultTimerDuration: 120,
        useCityOpenData: true,
        useGooglePlaces: false,
        onboardingComplete: false,
      }),
    }),
    {
      name: 'tkc-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export { useSettingsStore };
export default useSettingsStore;
