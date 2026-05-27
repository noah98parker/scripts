import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { useAuthStore } from '../stores/authStore';
import { requestPermissions } from '../services/notifications';

const PROTECTED_ROUTES = ['account', 'favorites'];

function useProtectedRoute(isAuthenticated, isInitialized) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const currentTab = segments[1];
    const isProtected = PROTECTED_ROUTES.includes(currentTab);

    if (!isAuthenticated && !inAuthGroup && isProtected) {
      router.replace('/(auth)/welcome');
    }
  }, [isAuthenticated, isInitialized, segments]);
}

export default function RootLayout() {
  const { initialize, isAuthenticated, isInitialized } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    (async () => {
      await requestPermissions();
    })();
  }, []);

  useEffect(() => {
    (async () => {
      await Location.requestForegroundPermissionsAsync();
    })();
  }, []);

  useProtectedRoute(isAuthenticated, isInitialized);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
