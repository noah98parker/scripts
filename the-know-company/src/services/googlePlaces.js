/**
 * Google Places API service
 * Nearby Search for parking garages/lots.
 * Requires a Google Places API key (stored in localStorage by the user).
 */

const BASE = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

export function getGoogleApiKey() {
  return localStorage.getItem('tkc_google_places_key') || '';
}

export function setGoogleApiKey(key) {
  localStorage.setItem('tkc_google_places_key', key);
}

/**
 * Fetch nearby parking from Google Places.
 * Returns an array normalised to the same shape as Overpass results.
 */
export async function fetchGooglePlacesParking(lat, lon, radiusM = 1000) {
  const key = getGoogleApiKey();
  if (!key) return [];

  // Google Places Nearby Search must be proxied in production due to CORS;
  // for development / local use we call directly (key must have no HTTP restrictions).
  const url = `${BASE}?location=${lat},${lon}&radius=${radiusM}&type=parking&key=${key}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google Places error ${res.status}`);
  const data = await res.json();

  if (data.status === 'REQUEST_DENIED') {
    console.warn('Google Places: REQUEST_DENIED —', data.error_message);
    return [];
  }

  return (data.results || []).map(p => ({
    id: `gp_${p.place_id}`,
    name: p.name,
    type: inferType(p),
    lat: p.geometry.location.lat,
    lon: p.geometry.location.lng,
    fee: 'unknown',         // Places API doesn't expose price reliably
    capacity: null,
    opening_hours: p.opening_hours?.open_now != null
      ? (p.opening_hours.open_now ? 'Open now' : 'Closed now')
      : null,
    operator: null,
    rating: p.rating || null,
    user_ratings_total: p.user_ratings_total || 0,
    source: 'google',
    place_id: p.place_id,
    vicinity: p.vicinity || null,
    tags: {},
  }));
}

function inferType(place) {
  const types = place.types || [];
  if (types.includes('parking')) return 'surface';
  return 'surface';
}

/**
 * Fetch full Place Details (hours, price level, phone, website) for a single place_id.
 */
export async function fetchPlaceDetails(placeId) {
  const key = getGoogleApiKey();
  if (!key) return null;

  const fields = 'name,formatted_address,formatted_phone_number,website,opening_hours,price_level,rating,user_ratings_total,geometry';
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${key}`;

  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return data.result || null;
}
