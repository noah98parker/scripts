/**
 * Browser Notifications service
 */

export async function requestPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  const result = await Notification.requestPermission();
  return result;
}

export function sendNotification(title, body, options = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return null;
  return new Notification(title, {
    body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: options.tag || 'know-company',
    requireInteraction: options.requireInteraction || false,
    ...options,
  });
}

export function notifyParkingStatus(verdict) {
  if (!verdict) return;
  const icons = { no_parking: '🚫', no_stopping: '🚫', no_standing: '🚫', time_limited: '⏱️', metered: '🅿️', permit: '🪧', allowed: '✅', advisory: 'ℹ️' };
  const icon = icons[verdict.status] || '❓';
  sendNotification(
    `${icon} ${verdict.label} — The Know Company`,
    verdict.stateLaw?.notes || `Parking status at your current location.`,
    { tag: 'parking-status' }
  );
}

export function notifyTowWarning(stateLaw) {
  if (!stateLaw) return;
  sendNotification(
    '⚠️ Tow Warning',
    stateLaw.towWarning || 'Check local tow regulations before leaving your vehicle.',
    { tag: 'tow-warning', requireInteraction: true }
  );
}
