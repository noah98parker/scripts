// Zustand store for user settings, persisted to AsyncStorage

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useSettingsStore = create(
  persist(
    (set) => ({
      // ---------------------------------------------------------------------------
      // Persisted state with defaults
      // ---------------------------------------------------------------------------

      // Whether push notifications are enabled for parking timers
      notificationsEnabled: true,

      // How many minutes before expiry to send the warning notification
      timerWarningMinutes: 10,

      // Default parking timer duration in minutes (2 hours)
      defaultTimerDuration: 120,

      // Whether to fetch city open data (Socrata SODA APIs)
      useCityOpenData: true,

      // Whether to use Google Places API (off by default until user enters a key)
      useGooglePlaces: false,

      // Whether the user has completed the onboarding flow
      onboardingComplete: false,

      // ---------------------------------------------------------------------------
      // Actions: individual setters
      // ---------------------------------------------------------------------------

      setNotificationsEnabled: (value) => set({ notificationsEnabled: value }),

      setTimerWarningMinutes: (minutes) => set({ timerWarningMinutes: minutes }),

      setDefaultTimerDuration: (minutes) => set({ defaultTimerDuration: minutes }),

      setUseCityOpenData: (value) => set({ useCityOpenData: value }),

      setUseGooglePlaces: (value) => set({ useGooglePlaces: value }),

      setOnboardingComplete: (value) => set({ onboardingComplete: value }),

      // ---------------------------------------------------------------------------
      // resetSettings: restore all settings to their defaults
      // ---------------------------------------------------------------------------
      resetSettings: () =>
        set({
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

export default useSettingsStore;
