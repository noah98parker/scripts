// Google Places API service for React Native
// API key is stored securely via expo-secure-store

import * as SecureStore from 'expo-secure-store';

const KEY_NAME = 'tkc_google_places_key';
const PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

// ---------------------------------------------------------------------------
// Key management
// ---------------------------------------------------------------------------

export async function getGoogleApiKey() {
  try {
    return await SecureStore.getItemAsync(KEY_NAME);
  } catch (err) {
    console.warn('[googlePlaces] getGoogleApiKey error:', err.message);
    return null;
  }
}

export async function setGoogleApiKey(key) {
  try {
    await SecureStore.setItemAsync(KEY_NAME, key);
  } catch (err) {
    console.warn('[googlePlaces] setGoogleApiKey error:', err.message);
    throw err;
  }
}

export async function clearGoogleApiKey() {
  try {
    await SecureStore.deleteItemAsync(KEY_NAME);
  } catch (err) {
    console.warn('[googlePlaces] clearGoogleApiKey error:', err.message);
  }
}

// ---------------------------------------------------------------------------
// Helper: infer parking type from Google Places types array
// ---------------------------------------------------------------------------
function inferParkingType(types = []) {
  if (types.includes('parking')) return 'surface';
  if (types.includes('establishment')) return 'surface';
  return 'surface';
}

// ---------------------------------------------------------------------------
// Helper: extract opening hours status from place result
// ---------------------------------------------------------------------------
function extractOpeningHours(place) {
  if (!place.opening_hours) return null;
  if (place.opening_hours.weekday_text) {
    return place.opening_hours.weekday_text.join(', ');
  }
  return place.opening_hours.open_now ? 'Open now' : 'Closed';
}

// ---------------------------------------------------------------------------
// Fetch nearby parking via Google Places Nearby Search
// Returns normalised array sorted by prominence (as returned by Google)
// Returns [] if no key is configured or if the API returns REQUEST_DENIED
// ---------------------------------------------------------------------------
export async function fetchGooglePlacesParking(lat, lon, radiusM = 1000) {
  let apiKey;
  try {
    apiKey = await getGoogleApiKey();
  } catch {
    return [];
  }

  if (!apiKey) {
    return [];
  }

  const url =
    `${PLACES_BASE_URL}/nearbysearch/json` +
    `?location=${lat},${lon}` +
    `&radius=${radiusM}` +
    `&type=parking` +
    `&key=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn('[googlePlaces] HTTP error:', response.status);
      return [];
    }

    const json = await response.json();

    if (json.status === 'REQUEST_DENIED') {
      console.warn('[googlePlaces] REQUEST_DENIED — check API key and billing.');
      return [];
    }

    if (json.status === 'ZERO_RESULTS') {
      return [];
    }

    if (json.status !== 'OK') {
      console.warn('[googlePlaces] Unexpected status:', json.status);
      return [];
    }

    const results = json.results || [];
    return results.map((place) => ({
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

// ---------------------------------------------------------------------------
// Fetch full place details by placeId
// Returns: { formatted_address, formatted_phone_number, website, opening_hours, price_level }
// Returns null on error or missing key
// ---------------------------------------------------------------------------
export async function fetchPlaceDetails(placeId) {
  let apiKey;
  try {
    apiKey = await getGoogleApiKey();
  } catch {
    return null;
  }

  if (!apiKey) {
    return null;
  }

  const fields = [
    'formatted_address',
    'formatted_phone_number',
    'website',
    'opening_hours',
    'price_level',
  ].join(',');

  const url =
    `${PLACES_BASE_URL}/details/json` +
    `?place_id=${encodeURIComponent(placeId)}` +
    `&fields=${encodeURIComponent(fields)}` +
    `&key=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn('[googlePlaces] fetchPlaceDetails HTTP error:', response.status);
      return null;
    }

    const json = await response.json();

    if (json.status === 'REQUEST_DENIED') {
      console.warn('[googlePlaces] fetchPlaceDetails REQUEST_DENIED');
      return null;
    }

    if (json.status !== 'OK') {
      console.warn('[googlePlaces] fetchPlaceDetails status:', json.status);
      return null;
    }

    const r = json.result || {};
    return {
      formatted_address: r.formatted_address || null,
      formatted_phone_number: r.formatted_phone_number || null,
      website: r.website || null,
      opening_hours: r.opening_hours?.weekday_text
        ? r.opening_hours.weekday_text
        : r.opening_hours?.open_now != null
        ? r.opening_hours.open_now
          ? 'Open now'
          : 'Closed'
        : null,
      price_level: r.price_level ?? null,
    };
  } catch (err) {
    console.warn('[googlePlaces] fetchPlaceDetails error:', err.message);
    return null;
  }
}
