// Expo push notifications + local scheduled notifications for parking timers

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// ---------------------------------------------------------------------------
// Configure notification handler at module level
// Determines how notifications are presented when the app is in foreground
// ---------------------------------------------------------------------------
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ---------------------------------------------------------------------------
// requestPermissions: ask the user for notification permissions
// Returns 'granted' | 'denied' | 'unsupported'
// ---------------------------------------------------------------------------
export async function requestPermissions() {
  if (!Device.isDevice) {
    console.warn('[notifications] Push notifications require a physical device.');
    return 'unsupported';
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === 'granted') {
      return 'granted';
    }

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted' ? 'granted' : 'denied';
  } catch (err) {
    console.warn('[notifications] requestPermissions error:', err.message);
    return 'denied';
  }
}

// ---------------------------------------------------------------------------
// registerForPushNotifications: get an Expo push token
// Requires a physical device. Returns token string or null.
// ---------------------------------------------------------------------------
export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.warn('[notifications] Must use a physical device for push notifications.');
    return null;
  }

  const permissionStatus = await requestPermissions();
  if (permissionStatus !== 'granted') {
    console.warn('[notifications] Permission not granted for push notifications.');
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  } catch (err) {
    console.warn('[notifications] registerForPushNotifications error:', err.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// scheduleParkingTimer: schedule warning + expiry notifications for a parking timer
//
// @param spotName       - name of the parking spot
// @param startTime      - Date when parking started
// @param durationMinutes - total parking duration in minutes
// @returns { warningId, expiryId }
// ---------------------------------------------------------------------------
export async function scheduleParkingTimer(spotName, startTime, durationMinutes) {
  const start = startTime instanceof Date ? startTime : new Date(startTime);
  const expiryMs = start.getTime() + durationMinutes * 60 * 1000;
  const warningMs = expiryMs - 10 * 60 * 1000; // 10 minutes before expiry

  const expiryDate = new Date(expiryMs);
  const warningDate = new Date(warningMs);
  const now = Date.now();

  let warningId = null;
  let expiryId = null;

  try {
    // Schedule WARNING notification (10 min before expiry) — only if still in the future
    if (warningMs > now) {
      warningId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Parking Timer Warning',
          body: `Your parking at "${spotName}" expires in 10 minutes!`,
          data: { type: 'parking_warning', spotName },
          sound: true,
        },
        trigger: { date: warningDate },
      });
    }

    // Schedule EXPIRY notification — only if still in the future
    if (expiryMs > now) {
      expiryId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Parking Timer Expired',
          body: `Your parking time at "${spotName}" has expired. Move your vehicle to avoid a ticket!`,
          data: { type: 'parking_expiry', spotName },
          sound: true,
        },
        trigger: { date: expiryDate },
      });
    }

    return { warningId, expiryId };
  } catch (err) {
    console.warn('[notifications] scheduleParkingTimer error:', err.message);
    return { warningId: null, expiryId: null };
  }
}

// ---------------------------------------------------------------------------
// cancelTimer: cancel both warning and expiry notifications for a timer
// ---------------------------------------------------------------------------
export async function cancelTimer(warningId, expiryId) {
  try {
    if (warningId) {
      await Notifications.cancelScheduledNotificationAsync(warningId);
    }
    if (expiryId) {
      await Notifications.cancelScheduledNotificationAsync(expiryId);
    }
  } catch (err) {
    console.warn('[notifications] cancelTimer error:', err.message);
  }
}

// ---------------------------------------------------------------------------
// sendImmediateNotification: fire a notification after 1 second
// ---------------------------------------------------------------------------
export async function sendImmediateNotification(title, body) {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: { seconds: 1 },
    });
    return id;
  } catch (err) {
    console.warn('[notifications] sendImmediateNotification error:', err.message);
    return null;
  }
}
