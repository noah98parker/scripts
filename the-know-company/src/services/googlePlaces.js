/**
 * Google Places service — calls the server-side Vercel proxy (/api/places).
 * The API key never touches the browser; it lives in Vercel environment variables.
 */

function inferType(place) {
  const types = place.types || [];
  if (types.includes('parking')) return 'surface';
  return 'surface';
}

/**
 * Fetch nearby parking from Google Places (via server proxy).
 * Returns [] gracefully if the server has no key configured.
 */
export async function fetchGooglePlacesParking(lat, lon, radiusM = 1000) {
  try {
    const res = await fetch(`/api/places?action=nearby&lat=${lat}&lon=${lon}&radius=${radiusM}`);
    if (!res.ok) return [];
    const data = await res.json();

    if (!data.results?.length) return [];

    return data.results.map(p => ({
      id: `gp_${p.place_id}`,
      name: p.name,
      type: inferType(p),
      lat: p.geometry.location.lat,
      lon: p.geometry.location.lng,
      fee: 'unknown',
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
  } catch {
    return [];
  }
}

/**
 * Fetch full Place Details for a single place_id (via server proxy).
 */
export async function fetchPlaceDetails(placeId) {
  try {
    const res = await fetch(`/api/places?action=details&placeId=${encodeURIComponent(placeId)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.result) return null;

    const r = data.result;
    return {
      formatted_address: r.formatted_address || null,
      formatted_phone_number: r.formatted_phone_number || null,
      website: r.website || null,
      opening_hours: r.opening_hours?.weekday_text
        ? r.opening_hours.weekday_text.join(', ')
        : r.opening_hours?.open_now != null
        ? (r.opening_hours.open_now ? 'Open now' : 'Closed now')
        : null,
      price_level: r.price_level ?? null,
      rating: r.rating ?? null,
    };
  } catch {
    return null;
  }
}
