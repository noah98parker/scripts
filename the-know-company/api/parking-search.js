/**
 * Vercel Serverless Function — GET /api/parking-search
 *
 * Uses coordinates to query Google Places (Google Maps' underlying API)
 * for nearby parking garages, then enriches each result with Place Details
 * (website URL, formatted address, phone, hours) fetched in parallel.
 *
 * Query params:
 *   lat    — latitude
 *   lon    — longitude
 *   radius — search radius in meters (default 1500)
 */

export const config = { maxDuration: 30 };

const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place';

function haversineM(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function nearbySearch(lat, lon, radius, key) {
  // Use keyword=parking garage to prioritize actual structures over surface lots
  const url =
    `${PLACES_BASE}/nearbysearch/json` +
    `?location=${lat},${lon}` +
    `&radius=${radius}` +
    `&type=parking` +
    `&keyword=parking+garage` +
    `&key=${key}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}

async function textSearch(lat, lon, radius, key) {
  // Text search surfaces richer results — same ones Google Maps shows when you type
  const url =
    `${PLACES_BASE}/textsearch/json` +
    `?query=parking+garage` +
    `&location=${lat},${lon}` +
    `&radius=${radius}` +
    `&key=${key}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}

async function getPlaceDetails(placeId, key) {
  const fields = [
    'name',
    'formatted_address',
    'formatted_phone_number',
    'website',
    'opening_hours',
    'price_level',
    'rating',
    'user_ratings_total',
    'geometry',
    'url',          // Google Maps URL for this specific place
  ].join(',');

  const url = `${PLACES_BASE}/details/json?place_id=${placeId}&fields=${fields}&key=${key}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.result || {};
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const key = process.env.GOOGLE_PLACES_KEY;
  if (!key) return res.status(200).json({ garages: [] });

  const { lat, lon, radius = '1500' } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'lat and lon required' });

  const originLat = parseFloat(lat);
  const originLon = parseFloat(lon);

  try {
    // Run both search strategies in parallel for maximum coverage
    const [nearbyResults, textResults] = await Promise.allSettled([
      nearbySearch(lat, lon, radius, key),
      textSearch(lat, lon, radius, key),
    ]);

    const nearby = nearbyResults.status === 'fulfilled' ? nearbyResults.value : [];
    const text   = textResults.status   === 'fulfilled' ? textResults.value   : [];

    // Merge and deduplicate by place_id, keeping up to 8 unique garages
    const seen = new Set();
    const merged = [];
    for (const place of [...nearby, ...text]) {
      if (!seen.has(place.place_id)) {
        seen.add(place.place_id);
        merged.push(place);
      }
      if (merged.length >= 8) break;
    }

    if (merged.length === 0) return res.status(200).json({ garages: [] });

    // Fetch Place Details for all candidates in parallel
    const detailResults = await Promise.allSettled(
      merged.map(p => getPlaceDetails(p.place_id, key))
    );

    const garages = [];

    for (let i = 0; i < merged.length; i++) {
      const place  = merged[i];
      const detail = detailResults[i].status === 'fulfilled' ? detailResults[i].value : {};

      const geoLat = detail.geometry?.location?.lat ?? place.geometry?.location?.lat ?? originLat;
      const geoLon = detail.geometry?.location?.lng ?? place.geometry?.location?.lng ?? originLon;

      // Build website info
      const website = detail.website || null;
      let websiteDomain = null;
      if (website) {
        try { websiteDomain = new URL(website).hostname.replace(/^www\./, ''); }
        catch { websiteDomain = website; }
      }

      // Google Maps deep link for this specific place
      const mapsUrl = detail.url
        || `https://www.google.com/maps/place/?q=place_id:${place.place_id}`;

      garages.push({
        id:                  place.place_id,
        name:                detail.name || place.name || 'Parking',
        address:             detail.formatted_address || place.vicinity || null,
        lat:                 geoLat,
        lon:                 geoLon,
        website,
        website_domain:      websiteDomain,
        phone:               detail.formatted_phone_number || null,
        rating:              detail.rating              ?? place.rating              ?? null,
        user_ratings_total:  detail.user_ratings_total  ?? place.user_ratings_total  ?? null,
        open_now:            detail.opening_hours?.open_now ?? place.opening_hours?.open_now ?? null,
        opening_hours:       detail.opening_hours?.weekday_text || null,
        price_level:         detail.price_level ?? place.price_level ?? null,
        distance_m:          Math.round(haversineM(originLat, originLon, geoLat, geoLon)),
        maps_url:            mapsUrl,
      });
    }

    // Sort by distance
    garages.sort((a, b) => a.distance_m - b.distance_m);

    return res.status(200).json({ garages });
  } catch (err) {
    console.error('[api/parking-search] error:', err);
    return res.status(500).json({ error: err.message, garages: [] });
  }
}
