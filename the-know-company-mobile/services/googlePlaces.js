/**
 * Google Places service for React Native.
 * All requests are proxied through the Vercel backend so the API key
 * never lives on the device.
 *
 * Set EXPO_PUBLIC_API_URL=https://your-app.vercel.app in your .env file.
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL || '';

function inferParkingType(types = []) {
  if (types.includes('parking')) return 'surface';
  return 'surface';
}

function extractOpeningHours(place) {
  if (!place.opening_hours) return null;
  if (place.opening_hours.weekday_text) {
    return place.opening_hours.weekday_text.join(', ');
  }
  return place.opening_hours.open_now ? 'Open now' : 'Closed';
}

/**
 * Fetch nearby parking via the server-side Google Places proxy.
 * Returns [] gracefully if the server has no key or the request fails.
 */
export async function fetchGooglePlacesParking(lat, lon, radiusM = 1000) {
  if (!API_URL) return [];

  try {
    const res = await fetch(
      `${API_URL}/api/places?action=nearby&lat=${lat}&lon=${lon}&radius=${radiusM}`
    );
    if (!res.ok) return [];
    const json = await res.json();
    if (!json.results?.length) return [];

    return json.results.map(place => ({
      id: `gp_${place.place_id}`,
      name: place.name || 'Parking',
      type: inferParkingType(place.types),
      lat: place.geometry?.location?.lat ?? null,
      lon: place.geometry?.location?.lng ?? null,
      fee: 'unknown',
      capacity: null,
      opening_hours: extractOpeningHours(place),
      operator: null,
      rating: place.rating ?? null,
      source: 'google',
      place_id: place.place_id,
      vicinity: place.vicinity || null,
      tags: {},
    }));
  } catch (err) {
    console.warn('[googlePlaces] fetchGooglePlacesParking error:', err.message);
    return [];
  }
}

/**
 * Fetch full place details by placeId via the server-side proxy.
 */
export async function fetchPlaceDetails(placeId) {
  if (!API_URL) return null;

  try {
    const res = await fetch(
      `${API_URL}/api/places?action=details&placeId=${encodeURIComponent(placeId)}`
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.result) return null;

    const r = json.result;
    return {
      formatted_address: r.formatted_address || null,
      formatted_phone_number: r.formatted_phone_number || null,
      website: r.website || null,
      opening_hours: r.opening_hours?.weekday_text
        ? r.opening_hours.weekday_text
        : r.opening_hours?.open_now != null
        ? r.opening_hours.open_now ? 'Open now' : 'Closed'
        : null,
      price_level: r.price_level ?? null,
    };
  } catch (err) {
    console.warn('[googlePlaces] fetchPlaceDetails error:', err.message);
    return null;
  }
}
