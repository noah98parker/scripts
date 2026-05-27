/**
 * Vercel Serverless Function — GET /api/parking-search
 *
 * Google Places Nearby Search for parking garages, with Place Details
 * fetched in parallel for the top 6 results.
 *
 * Query params:
 *   lat    - latitude
 *   lon    - longitude
 *   radius - search radius in meters (default 1500)
 */

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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const key = process.env.GOOGLE_PLACES_KEY;
  if (!key) {
    return res.status(200).json({ garages: [] });
  }

  const { lat, lon, radius = '1500' } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: 'lat and lon are required' });
  }

  const originLat = parseFloat(lat);
  const originLon = parseFloat(lon);

  try {
    // 1. Nearby Search
    const nearbyUrl = `${PLACES_BASE}/nearbysearch/json?location=${lat},${lon}&radius=${radius}&type=parking&key=${key}`;
    const nearbyRes = await fetch(nearbyUrl);
    const nearbyData = await nearbyRes.json();

    const places = (nearbyData.results || []).slice(0, 6);

    if (places.length === 0) {
      return res.status(200).json({ garages: [] });
    }

    // 2. Fetch Place Details in parallel
    const fields =
      'name,formatted_address,formatted_phone_number,website,opening_hours,price_level,rating,user_ratings_total,geometry';

    const detailResults = await Promise.allSettled(
      places.map((place) => {
        const url = `${PLACES_BASE}/details/json?place_id=${place.place_id}&fields=${fields}&key=${key}`;
        return fetch(url).then((r) => r.json());
      })
    );

    // 3. Build enriched garage objects
    const garages = [];
    for (let i = 0; i < places.length; i++) {
      const place = places[i];
      const detailSettled = detailResults[i];
      const detail =
        detailSettled.status === 'fulfilled' && detailSettled.value.result
          ? detailSettled.value.result
          : {};

      const geoLat =
        detail.geometry?.location?.lat ??
        place.geometry?.location?.lat ??
        originLat;
      const geoLon =
        detail.geometry?.location?.lng ??
        place.geometry?.location?.lng ??
        originLon;

      const websiteRaw = detail.website || null;
      let websiteDomain = null;
      if (websiteRaw) {
        try {
          websiteDomain = new URL(websiteRaw).hostname.replace(/^www\./, '');
        } catch (_) {
          websiteDomain = websiteRaw;
        }
      }

      const openingHoursText =
        detail.opening_hours?.weekday_text || null;
      const openNow =
        detail.opening_hours?.open_now ??
        place.opening_hours?.open_now ??
        null;

      const distanceM = haversineM(originLat, originLon, geoLat, geoLon);

      garages.push({
        id: place.place_id,
        name: detail.name || place.name || 'Parking',
        address:
          detail.formatted_address ||
          place.vicinity ||
          null,
        lat: geoLat,
        lon: geoLon,
        website: websiteRaw,
        website_domain: websiteDomain,
        phone: detail.formatted_phone_number || null,
        rating: detail.rating ?? place.rating ?? null,
        user_ratings_total:
          detail.user_ratings_total ?? place.user_ratings_total ?? null,
        open_now: openNow,
        opening_hours: openingHoursText,
        price_level: detail.price_level ?? place.price_level ?? null,
        distance_m: Math.round(distanceM),
        maps_url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
      });
    }

    // 4. Sort by distance ascending
    garages.sort((a, b) => a.distance_m - b.distance_m);

    return res.status(200).json({ garages });
  } catch (err) {
    console.error('[api/parking-search] error:', err);
    return res.status(500).json({ error: err.message, garages: [] });
  }
}
